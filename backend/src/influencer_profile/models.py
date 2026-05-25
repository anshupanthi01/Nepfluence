from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    Integer,
    Numeric,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    func,
    Enum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, TYPE_CHECKING

from src.database import Base
from src.influencer_profile.enums import InfluencerNiche

if TYPE_CHECKING:
    from users.model_user import User


class InfluencerProfile(Base):
    __tablename__ = "influencer_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    full_name: Mapped[str] = mapped_column(String(150), nullable=False)

    bio: Mapped[str | None] = mapped_column(Text, nullable=True)

    niche: Mapped[InfluencerNiche] = mapped_column(
        Enum(InfluencerNiche),
        nullable=False,
        index=True,
    )

    availability: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user = relationship("User", back_populates="influencer_profile", uselist=False)

    # Social accounts (one-to-many)
    social_accounts: Mapped[List["SocialAccount"]] = relationship(
        "SocialAccount",
        back_populates="influencer",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class SocialPlatform(str, enum.Enum):
    instagram = "instagram"
    youtube = "youtube"
    tiktok = "tiktok"


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id: Mapped[int] = mapped_column(primary_key=True)

    influencer_id: Mapped[int] = mapped_column(
        ForeignKey("influencer_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    platform: Mapped[SocialPlatform] = mapped_column(
        Enum(SocialPlatform, name="social_platform"),
        nullable=False,
        index=True,
    )

    username: Mapped[str] = mapped_column(String(100), nullable=False)

    follower_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    total_views: Mapped[float] = mapped_column(Numeric(5, 2), default=0, nullable=False)

    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    influencer = relationship("InfluencerProfile", back_populates="social_accounts")