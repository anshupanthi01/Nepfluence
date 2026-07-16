from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Enum as SAEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base
from src.influencer_profile.enums import SocialPlatform


class DiscoveryCreator(Base):
    """One row per scraped creator (discovery plane - see social_ingest/providers/).

    Not FK-required to influencer_profiles - most rows represent creators who have never
    signed up to Nepfluence. `influencer_profile_id` is set only when a creator claims/
    onboards (see crud.mark_claimed) and is what gates the nightly refresh job (plan §4:
    only claimed creators get refreshed on a schedule, unclaimed rows are on-demand only).
    """

    __tablename__ = "discovery_creators"
    __table_args__ = (UniqueConstraint("platform", "handle", name="uq_discovery_creator_platform_handle"),)

    id: Mapped[int] = mapped_column(primary_key=True)

    platform: Mapped[SocialPlatform] = mapped_column(
        SAEnum(SocialPlatform, name="discovery_creator_platform"),
        nullable=False,
        index=True,
    )
    handle: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    platform_user_id: Mapped[str | None] = mapped_column(String(200), nullable=True)
    display_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    country_guess: Mapped[str | None] = mapped_column(String(2), nullable=True)
    niche_guess: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # Real platform CDN avatar. These URLs are SIGNED AND SHORT-LIVED (~24h) on both IG and
    # TikTok, so a stored value expires on roughly the same cadence as the discovery freshness
    # TTL that refreshes it. Text (not String(n)) because the signed query strings are long.
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    followers: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    avg_engagement_rate: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    recent_post_avg_views: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    is_verified_badge: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    fake_view_flag: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    last_scraped_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    raw_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    influencer_profile_id: Mapped[int | None] = mapped_column(
        ForeignKey("influencer_profiles.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    post_snapshots: Mapped[list["DiscoveryPostSnapshot"]] = relationship(
        "DiscoveryPostSnapshot",
        back_populates="discovery_creator",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class DiscoveryPostSnapshot(Base):
    """Recent-post stats captured at scrape time, for engagement calc / recent-performance
    display. Not deduped across scrapes - each ingestion writes a fresh batch; retention
    policy (plan §5, "set a retention window") is left as a future cleanup job.
    """

    __tablename__ = "discovery_post_snapshots"

    id: Mapped[int] = mapped_column(primary_key=True)

    discovery_creator_id: Mapped[int] = mapped_column(
        ForeignKey("discovery_creators.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    platform_post_id: Mapped[str] = mapped_column(String(200), nullable=False)
    posted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    views: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    likes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    comments: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    shares: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    discovery_creator = relationship("DiscoveryCreator", back_populates="post_snapshots")
