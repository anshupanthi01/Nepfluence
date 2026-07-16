from __future__ import annotations

import asyncio
import hashlib
import logging
import statistics
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.influencer_profile.enums import SocialPlatform
from src.social_ingest import crud, redis_client
from src.social_ingest.models import DiscoveryCreator
from src.social_ingest.providers import registry
from src.social_ingest.providers.base import PostStats, ProviderError, UseCase

logger = logging.getLogger(__name__)

# discovery_ingest_service - cache-through + circuit breaker + budget guardrails (plan §4).
#
# Deliberate simplification vs. the original plan's Redis key list: there is no separate
# Redis cache for single-profile lookups (`disc:profile:*`/`disc:posts:*`). SQLite reads are
# local and cheap, so `crud.get_if_fresh()`'s `last_scraped_at` check already avoids redundant
# provider calls just as well as a Redis TTL would - adding a second cache on top would be
# redundant complexity for no behavior change. Redis is reserved for what it's uniquely
# suited for here: the search-result cache (DB search can only surface handles we've *already*
# scraped, not new query matches) and the atomic budget/circuit-breaker counters.

DB_PROFILE_MAX_AGE = timedelta(hours=24)
SEARCH_CACHE_TTL_SECONDS = 3600

_FAILURE_THRESHOLD = 3
_FAILURE_WINDOW_SECONDS = 300
_BREAKER_COOLDOWN_SECONDS = 120

# Only TikHub is pay-as-you-go and needs a spend ceiling; YouTube's official API has its own
# free daily quota, not billed through this budget.
_BUDGETED_PROVIDERS = {"tikhub"}

# Max concurrent follower-backfill profile lookups (see _backfill_missing_followers). Keeps a
# wide search fast without hammering TikHub hard enough to trip its rate limiter.
_BACKFILL_CONCURRENCY = 5


class DiscoveryUnavailable(Exception):
    """Raised when a live provider call is needed but blocked (budget/circuit breaker) and
    no cached/stale data exists to fall back to."""


def _breaker_fail_key(provider_name: str, platform: SocialPlatform) -> str:
    return f"cb:fail:{provider_name}:{platform.value}"


def _breaker_open_key(provider_name: str, platform: SocialPlatform) -> str:
    return f"cb:open:{provider_name}:{platform.value}"


async def _breaker_is_open(provider_name: str, platform: SocialPlatform) -> bool:
    return await redis_client.get_value(_breaker_open_key(provider_name, platform)) is not None


async def _record_failure(provider_name: str, platform: SocialPlatform) -> None:
    count = await redis_client.incr_with_ttl(
        _breaker_fail_key(provider_name, platform), _FAILURE_WINDOW_SECONDS
    )
    if count is not None and count >= _FAILURE_THRESHOLD:
        await redis_client.set_value(
            _breaker_open_key(provider_name, platform), "1", _BREAKER_COOLDOWN_SECONDS
        )


async def _record_success(provider_name: str, platform: SocialPlatform) -> None:
    await redis_client.delete_key(_breaker_fail_key(provider_name, platform))
    await redis_client.delete_key(_breaker_open_key(provider_name, platform))


def _budget_key(provider_name: str) -> str:
    return f"budget:{provider_name}:{datetime.now(timezone.utc).strftime('%Y%m%d')}"


async def _budget_exhausted(provider_name: str) -> bool:
    """Read-only ceiling check - deliberately does NOT increment.

    Counting is done by `_record_billed_request` after each ACTUAL provider call, because the
    gate and the spend are not 1:1: `get_or_refresh_profile` passes this gate once and then makes
    two billed requests (get_profile + get_recent_posts). An incrementing gate therefore
    undercounted real spend ~2x, letting DISCOVERY_DAILY_REQUEST_BUDGET=500 permit ~1000 billed
    requests - and it also inflated the counter on requests it had just blocked (which spend
    nothing), so an over-budget counter climbed forever.
    """
    if provider_name not in _BUDGETED_PROVIDERS:
        return False
    raw = await redis_client.get_value(_budget_key(provider_name))
    if raw is None:
        # No counter yet today, or Redis unreachable - fail open (allow), the same tradeoff
        # redis_client.incr_with_ttl documents: a Redis outage degrades cost *enforcement*,
        # never availability.
        return False
    try:
        return int(raw) >= settings.DISCOVERY_DAILY_REQUEST_BUDGET
    except (TypeError, ValueError):
        return False


async def _record_billed_request(provider_name: str) -> None:
    """Count exactly one actually-billed provider request.

    Called only AFTER a successful call: TikHub bills successful requests only ("Only pay for
    successful requests" - tikhub.io/pricing), so counting attempts would overstate spend.
    TTL is a bit over 24h so a slow-to-expire key never straddles two UTC days undercounted.
    """
    if provider_name not in _BUDGETED_PROVIDERS:
        return
    await redis_client.incr_with_ttl(_budget_key(provider_name), 26 * 3600)


def _average_views(posts: list[PostStats]) -> int | None:
    views = [p.views for p in posts if p.views is not None]
    if not views:
        return None
    return round(sum(views) / len(views))


def _median_engagement_rate(posts: list[PostStats]) -> float | None:
    rates = []
    for post in posts:
        if not post.views:
            continue
        engagement = (post.likes or 0) + (post.comments or 0)
        rates.append(engagement / post.views * 100)
    if not rates:
        return None
    return round(statistics.median(rates), 2)


async def get_or_refresh_profile(
    db: AsyncSession, platform: SocialPlatform, handle: str
) -> DiscoveryCreator:
    """Cache-through single-creator lookup: DB freshness check -> provider (budget +
    circuit-breaker gated) -> upsert. Used by `GET /creator/{platform}/{handle}` and
    `POST /discover`."""
    fresh_row = await crud.get_if_fresh(db, platform, handle, DB_PROFILE_MAX_AGE)
    if fresh_row is not None:
        return fresh_row

    provider = registry.get_provider(platform, UseCase.DISCOVERY)
    stale_row = await crud.get_by_platform_handle(db, platform, handle)

    if await _breaker_is_open(provider.name, platform) or await _budget_exhausted(provider.name):
        if stale_row is not None:
            return stale_row
        raise DiscoveryUnavailable(
            f"{provider.name} unavailable for {platform.value}/{handle} and no cached data exists"
        )

    try:
        profile = await provider.get_profile(platform, handle)
    except ProviderError:
        await _record_failure(provider.name, platform)
        if stale_row is not None:
            return stale_row
        raise
    await _record_billed_request(provider.name)

    # Posts are a secondary enrichment (engagement rate / avg views) - a failure here (e.g.
    # a paywalled or misconfigured posts endpoint) must not discard perfectly good profile
    # data we already have. Not tied to circuit-breaker/failure tracking: this endpoint can
    # fail for reasons unrelated to the provider's overall health (billing, param format).
    try:
        posts = await provider.get_recent_posts(platform, handle, limit=12)
        await _record_billed_request(provider.name)
    except ProviderError as exc:
        logger.warning("get_recent_posts failed for %s/%s: %s", platform.value, handle, exc)
        posts = []

    await _record_success(provider.name, platform)

    row = await crud.upsert_profile(
        db,
        profile,
        avg_engagement_rate=_median_engagement_rate(posts),
        recent_post_avg_views=_average_views(posts),
        fake_view_flag=any(p.fake_view_flag for p in posts),
    )
    if posts:
        await crud.replace_post_snapshots(db, row.id, posts)
    return row


async def search(
    db: AsyncSession, platform: SocialPlatform, query: str, limit: int = 10
) -> list[DiscoveryCreator]:
    """Search-triggered discovery ingestion for Discover Creators (plan §7 / Track 1).

    Deliberately does NOT fetch recent posts for every search result - that would be up to
    `limit` extra billed provider calls per search on top of the search call itself. Posts/
    engagement are only fetched when a specific creator is viewed individually, via
    `get_or_refresh_profile`.
    """
    query = query.strip()
    if not query:
        return []

    cache_key = f"disc:search:{platform.value}:{hashlib.sha1(query.lower().encode()).hexdigest()}"
    cached_handles = await redis_client.get_json(cache_key)
    if cached_handles:
        rows = []
        for handle in cached_handles:
            row = await crud.get_by_platform_handle(db, platform, handle)
            if row is not None:
                rows.append(row)
        if rows:
            return rows[:limit]

    provider = registry.get_provider(platform, UseCase.DISCOVERY)

    if await _breaker_is_open(provider.name, platform) or await _budget_exhausted(provider.name):
        return await crud.search_cached(db, platform, query, limit)

    try:
        profiles = await provider.search(platform, query, limit)
    except ProviderError:
        await _record_failure(provider.name, platform)
        return await crud.search_cached(db, platform, query, limit)

    await _record_billed_request(provider.name)
    await _record_success(provider.name, platform)

    profiles = await _backfill_missing_followers(provider, platform, profiles)

    rows = [await crud.upsert_profile(db, profile) for profile in profiles]
    await redis_client.set_json(cache_key, [row.handle for row in rows], SEARCH_CACHE_TTL_SECONDS)
    return rows


async def _backfill_missing_followers(provider, platform: SocialPlatform, profiles: list):
    """Fill in follower counts that a platform's SEARCH endpoint doesn't return.

    Instagram's search endpoint returns no follower count at all (verified live) - only its
    profile endpoint does. Without this, brands see an Instagram card with no follower number.

    EXPENSIVE: +1 billed request per result missing a count (a limit=8 IG search becomes 9 billed
    calls). TikTok search already returns counts, so this no-ops there entirely.

    Runs CONCURRENTLY: measured sequentially, a limit=8 IG search took **63 seconds** end-to-end,
    which is unusable for a type-to-search box. Bounded by a semaphore so a wide search doesn't
    hammer TikHub into rate-limiting us.

    Budget is checked ONCE for the batch rather than per call - a deliberate trade: exact
    per-call gating would force this back to sequential. Worst case a single batch overshoots the
    daily ceiling by (batch size - 1), i.e. <=24 at the max allowed limit, which is an acceptable
    bound for a cap whose purpose is preventing runaway spend, not cent-accurate accounting.
    """
    missing = [p for p in profiles if p.followers is None]
    if not missing:
        return profiles
    if await _budget_exhausted(provider.name) or await _breaker_is_open(provider.name, platform):
        return profiles  # degrade: keep results, leave followers unknown

    semaphore = asyncio.Semaphore(_BACKFILL_CONCURRENCY)

    async def fetch(profile):
        async with semaphore:
            try:
                return profile, await provider.get_profile(platform, profile.handle)
            except ProviderError as exc:
                logger.warning(
                    "follower backfill failed for %s/%s: %s", platform.value, profile.handle, exc
                )
                return profile, None

    for profile, full in await asyncio.gather(*(fetch(p) for p in missing)):
        if full is None:
            continue  # non-fatal: keep the search result, just without a follower count
        # Keep the search result's identity, take the profile lookup's richer stats.
        profile.followers = full.followers
        profile.avatar_url = profile.avatar_url or full.avatar_url
        await _record_billed_request(provider.name)
    return profiles


async def refresh_claimed_creator(db: AsyncSession, discovery_creator: DiscoveryCreator) -> None:
    """Force-refresh a single claimed creator, bypassing the DB freshness check. Used by the
    nightly scheduler job (social_ingest/scheduler.py) - unlike get_or_refresh_profile, this
    always hits the provider (subject to the same budget/breaker gating) since the whole
    point of the nightly job is to refresh stats regardless of the last scrape time.
    """
    provider = registry.get_provider(discovery_creator.platform, UseCase.DISCOVERY)

    if await _breaker_is_open(provider.name, discovery_creator.platform):
        return
    if await _budget_exhausted(provider.name):
        return

    try:
        profile = await provider.get_profile(discovery_creator.platform, discovery_creator.handle)
    except ProviderError:
        await _record_failure(provider.name, discovery_creator.platform)
        return
    await _record_billed_request(provider.name)

    try:
        posts = await provider.get_recent_posts(
            discovery_creator.platform, discovery_creator.handle, limit=12
        )
        await _record_billed_request(provider.name)
    except ProviderError as exc:
        logger.warning(
            "get_recent_posts failed for %s/%s: %s",
            discovery_creator.platform.value,
            discovery_creator.handle,
            exc,
        )
        posts = []

    await _record_success(provider.name, discovery_creator.platform)

    row = await crud.upsert_profile(
        db,
        profile,
        avg_engagement_rate=_median_engagement_rate(posts),
        recent_post_avg_views=_average_views(posts),
        fake_view_flag=any(p.fake_view_flag for p in posts),
    )
    if posts:
        await crud.replace_post_snapshots(db, row.id, posts)
