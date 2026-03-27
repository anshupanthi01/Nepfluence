from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class InfluencerProfile(Base):
    __tablename__ = "influencer_profile"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    display_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    niche: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    location_city: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    location_country: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    follower_tier: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    total_followers: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    engagement_score: Mapped[Optional[float]] = mapped_column(Numeric, nullable=True)

    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    profile_status: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="influencer_profile")

    social_accounts: Mapped[List["InfluencerSocialAccount"]] = relationship(
        back_populates="influencer", cascade="all, delete-orphan"
    )
    applications: Mapped[List["CampaignApplication"]] = relationship(
        back_populates="influencer", cascade="all, delete-orphan"
    )