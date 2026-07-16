from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.influencer_profile.enums import SocialPlatform
from src.social_connect.models import VerifiedCreatorAccount


async def get_connection(
    db: AsyncSession, influencer_profile_id: int, platform: SocialPlatform
) -> VerifiedCreatorAccount | None:
    result = await db.execute(
        select(VerifiedCreatorAccount).where(
            VerifiedCreatorAccount.influencer_profile_id == influencer_profile_id,
            VerifiedCreatorAccount.platform == platform,
        )
    )
    return result.scalars().first()


async def list_for_profile(db: AsyncSession, influencer_profile_id: int) -> list[VerifiedCreatorAccount]:
    result = await db.execute(
        select(VerifiedCreatorAccount)
        .where(
            VerifiedCreatorAccount.influencer_profile_id == influencer_profile_id,
            VerifiedCreatorAccount.revoked_at.is_(None),
        )
        .order_by(VerifiedCreatorAccount.connected_at.desc())
    )
    return list(result.scalars().all())


async def upsert_connection(
    db: AsyncSession,
    *,
    influencer_profile_id: int,
    platform: SocialPlatform,
    platform_user_id: str,
    platform_handle: str | None,
    access_token_encrypted: str,
    refresh_token_encrypted: str | None,
    token_expires_at: datetime | None,
    scopes: str | None,
) -> VerifiedCreatorAccount:
    """Reconnecting the same (profile, platform) pair replaces the stored tokens rather than
    creating a second row - matches the unique constraint on the table."""
    row = await get_connection(db, influencer_profile_id, platform)
    if row is None:
        row = VerifiedCreatorAccount(
            influencer_profile_id=influencer_profile_id,
            platform=platform,
            connected_at=datetime.now(timezone.utc),
        )
        db.add(row)

    row.platform_user_id = platform_user_id
    row.platform_handle = platform_handle
    row.access_token = access_token_encrypted
    row.refresh_token = refresh_token_encrypted
    row.token_expires_at = token_expires_at
    row.scopes = scopes
    row.revoked_at = None

    await db.commit()
    await db.refresh(row)
    return row
