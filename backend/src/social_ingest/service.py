from __future__ import annotations

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


async def _budget_allows(provider_name: str) -> bool:
    if provider_name not in _BUDGETED_PROVIDERS:
        return True
    today_key = f"budget:{provider_name}:{datetime.now(timezone.utc).strftime('%Y%m%d')}"
    # TTL a bit over 24h so a slow-to-expire key never straddles two UTC days undercounted.
    count = await redis_client.incr_with_ttl(today_key, 26 * 3600)
    if count is None:
        # Redis unreachable - fail open (allow), same tradeoff as incr_with_ttl documents.
        return True
    return count <= settings.DISCOVERY_DAILY_REQUEST_BUDGET


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

    if await _breaker_is_open(provider.name, platform) or not await _budget_allows(provider.name):
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

    # Posts are a secondary enrichment (engagement rate / avg views) - a failure here (e.g.
    # a paywalled or misconfigured posts endpoint) must not discard perfectly good profile
    # data we already have. Not tied to circuit-breaker/failure tracking: this endpoint can
    # fail for reasons unrelated to the provider's overall health (billing, param format).
    try:
        posts = await provider.get_recent_posts(platform, handle, limit=12)
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

    if await _breaker_is_open(provider.name, platform) or not await _budget_allows(provider.name):
        return await crud.search_cached(db, platform, query, limit)

    try:
        profiles = await provider.search(platform, query, limit)
    except ProviderError:
        await _record_failure(provider.name, platform)
        return await crud.search_cached(db, platform, query, limit)

    await _record_success(provider.name, platform)

    rows = [await crud.upsert_profile(db, profile) for profile in profiles]
    await redis_client.set_json(cache_key, [row.handle for row in rows], SEARCH_CACHE_TTL_SECONDS)
    return rows


async def refresh_claimed_creator(db: AsyncSession, discovery_creator: DiscoveryCreator) -> None:
    """Force-refresh a single claimed creator, bypassing the DB freshness check. Used by the
    nightly scheduler job (social_ingest/scheduler.py) - unlike get_or_refresh_profile, this
    always hits the provider (subject to the same budget/breaker gating) since the whole
    point of the nightly job is to refresh stats regardless of the last scrape time.
    """
    provider = registry.get_provider(discovery_creator.platform, UseCase.DISCOVERY)

    if await _breaker_is_open(provider.name, discovery_creator.platform):
        return
    if not await _budget_allows(provider.name):
        return

    try:
        profile = await provider.get_profile(discovery_creator.platform, discovery_creator.handle)
    except ProviderError:
        await _record_failure(provider.name, discovery_creator.platform)
        return

    try:
        posts = await provider.get_recent_posts(
            discovery_creator.platform, discovery_creator.handle, limit=12
        )
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
