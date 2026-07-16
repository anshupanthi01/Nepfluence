from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.influencer_profile.enums import SocialPlatform
from src.social_ingest.models import DiscoveryCreator, DiscoveryPostSnapshot
from src.social_ingest.providers.base import PostStats, ProfileStats

# raw_json is for debugging only (plan §5, "store only public aggregate stats + raw JSON
# needed for debugging") - cap it so one odd provider response can't bloat the row.
_RAW_JSON_MAX_CHARS = 20_000


def _as_aware_utc(value: datetime) -> datetime:
    return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)


async def get_by_platform_handle(
    db: AsyncSession, platform: SocialPlatform, handle: str
) -> DiscoveryCreator | None:
    result = await db.execute(
        select(DiscoveryCreator).where(
            DiscoveryCreator.platform == platform, DiscoveryCreator.handle == handle
        )
    )
    return result.scalars().first()


async def get_if_fresh(
    db: AsyncSession, platform: SocialPlatform, handle: str, max_age: timedelta
) -> DiscoveryCreator | None:
    row = await get_by_platform_handle(db, platform, handle)
    if row is None:
        return None
    cutoff = datetime.now(timezone.utc) - max_age
    if _as_aware_utc(row.last_scraped_at) < cutoff:
        return None
    return row


async def upsert_profile(
    db: AsyncSession,
    profile: ProfileStats,
    *,
    avg_engagement_rate: float | None = None,
    recent_post_avg_views: int | None = None,
    fake_view_flag: bool = False,
    niche_guess: str | None = None,
    country_guess: str | None = None,
) -> DiscoveryCreator:
    row = await get_by_platform_handle(db, profile.platform, profile.handle)
    if row is None:
        row = DiscoveryCreator(platform=profile.platform, handle=profile.handle)
        db.add(row)

    row.platform_user_id = profile.platform_user_id
    row.display_name = profile.display_name
    # Don't null out a previously-stored value if this particular response lacked one (e.g. a
    # search result that carries less data than a full profile lookup).
    if profile.followers is not None:
        row.followers = profile.followers
    if profile.avatar_url:
        row.avatar_url = profile.avatar_url
    row.is_verified_badge = profile.is_verified_badge
    row.provider = profile.provider
    row.last_scraped_at = profile.fetched_at
    row.avg_engagement_rate = avg_engagement_rate
    row.recent_post_avg_views = recent_post_avg_views
    row.fake_view_flag = fake_view_flag
    if niche_guess is not None:
        row.niche_guess = niche_guess
    if country_guess is not None:
        row.country_guess = country_guess
    try:
        row.raw_json = json.dumps(profile.raw, default=str)[:_RAW_JSON_MAX_CHARS]
    except (TypeError, ValueError):
        row.raw_json = None

    await db.commit()
    await db.refresh(row)
    return row


async def replace_post_snapshots(
    db: AsyncSession, discovery_creator_id: int, posts: list[PostStats]
) -> None:
    await db.execute(
        delete(DiscoveryPostSnapshot).where(
            DiscoveryPostSnapshot.discovery_creator_id == discovery_creator_id
        )
    )
    captured_at = datetime.now(timezone.utc)
    for post in posts:
        db.add(
            DiscoveryPostSnapshot(
                discovery_creator_id=discovery_creator_id,
                platform_post_id=post.platform_post_id,
                posted_at=post.posted_at,
                views=post.views,
                likes=post.likes,
                comments=post.comments,
                shares=post.shares,
                captured_at=captured_at,
            )
        )
    await db.commit()


async def list_claimed(db: AsyncSession) -> list[DiscoveryCreator]:
    result = await db.execute(
        select(DiscoveryCreator).where(DiscoveryCreator.influencer_profile_id.is_not(None))
    )
    return list(result.scalars().all())


async def mark_claimed(
    db: AsyncSession, platform: SocialPlatform, handle: str, influencer_profile_id: int
) -> DiscoveryCreator | None:
    row = await get_by_platform_handle(db, platform, handle)
    if row is None:
        return None
    row.influencer_profile_id = influencer_profile_id
    await db.commit()
    await db.refresh(row)
    return row


async def search_cached(
    db: AsyncSession, platform: SocialPlatform, query: str, limit: int = 10
) -> list[DiscoveryCreator]:
    """DB-side search over already-scraped, unclaimed rows. Used as a same-request fallback
    when Redis is unreachable, and as a natural side-effect of upserts from prior searches -
    repeated/overlapping queries don't always need a fresh provider call.
    """
    like = f"%{query.lower()}%"
    result = await db.execute(
        select(DiscoveryCreator)
        .where(
            DiscoveryCreator.platform == platform,
            DiscoveryCreator.influencer_profile_id.is_(None),
            (DiscoveryCreator.handle.ilike(like)) | (DiscoveryCreator.display_name.ilike(like)),
        )
        .limit(limit)
    )
    return list(result.scalars().all())
