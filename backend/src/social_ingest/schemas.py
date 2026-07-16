from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from src.influencer_profile.enums import SocialPlatform
from src.social_ingest.models import DiscoveryCreator


class DiscoverRequest(BaseModel):
    platform: SocialPlatform
    handle: str = Field(min_length=1, max_length=200)


class SearchRequest(BaseModel):
    platform: SocialPlatform
    query: str = Field(min_length=1, max_length=200)
    limit: int = Field(default=10, ge=1, le=25)


class DiscoveryCreatorPublic(BaseModel):
    id: int
    platform: SocialPlatform
    handle: str
    display_name: str | None = None
    avatar_url: str | None = None
    followers: int | None = None
    avg_engagement_rate: float | None = None
    recent_post_avg_views: int | None = None
    is_verified_badge: bool
    fake_view_flag: bool
    provider: str
    last_scraped_at: datetime
    is_claimed: bool

    @classmethod
    def from_row(cls, row: DiscoveryCreator) -> "DiscoveryCreatorPublic":
        return cls(
            id=row.id,
            platform=row.platform,
            handle=row.handle,
            display_name=row.display_name,
            avatar_url=row.avatar_url,
            followers=row.followers,
            avg_engagement_rate=(
                float(row.avg_engagement_rate) if row.avg_engagement_rate is not None else None
            ),
            recent_post_avg_views=row.recent_post_avg_views,
            is_verified_badge=row.is_verified_badge,
            fake_view_flag=row.fake_view_flag,
            provider=row.provider,
            last_scraped_at=row.last_scraped_at,
            is_claimed=row.influencer_profile_id is not None,
        )
