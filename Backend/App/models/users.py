from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, Enum, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .enums import UserRole


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    email: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)
    phone_number: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)

    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"), nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    is_verified_phone: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

    password_hash: Mapped[str] = mapped_column(String, nullable=False)

    date_joined: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    country: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    influencer_profile: Mapped[Optional["InfluencerProfile"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    brand_profile: Mapped[Optional["BrandProfile"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )

    sent_messages: Mapped[List["CampaignMessage"]] = relationship(
        back_populates="sender",
        foreign_keys="CampaignMessage.sender_id",
        cascade="all, delete-orphan",
    )
    received_messages: Mapped[List["CampaignMessage"]] = relationship(
        back_populates="recipient",
        foreign_keys="CampaignMessage.recipient_id",
        cascade="all, delete-orphan",
    )