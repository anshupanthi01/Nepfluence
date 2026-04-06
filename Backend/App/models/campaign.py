from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .enums import CampaignStatus


class Campaign(Base):
    __tablename__ = "campaign"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    brand_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("brand_profile.id", ondelete="CASCADE"), nullable=False, index=True
    )

    title: Mapped[str] = mapped_column(String, nullable=False)

    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    niche_tags: Mapped[Optional[list[str]]] = mapped_column(ARRAY(String), nullable=True)

    target_platforms: Mapped[Optional[list[str]]] = mapped_column(ARRAY(String), nullable=True)

    min_followers: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    max_followers: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    budget_total: Mapped[Optional[float]] = mapped_column(Numeric, nullable=True)

    budget_per_slot: Mapped[Optional[float]] = mapped_column(Numeric, nullable=True)

    max_slots: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)

    slots_filled: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)

    status: Mapped[CampaignStatus] = mapped_column(
        Enum(CampaignStatus, name="campaign_status"),
        nullable=False,
        default=CampaignStatus.draft,
        server_default=CampaignStatus.draft.value,
    )

    application_deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    brand: Mapped["BrandProfile"] = relationship(back_populates="campaigns")

    applications: Mapped[List["CampaignApplication"]] = relationship(
        back_populates="campaign", cascade="all, delete-orphan"
    )
    
    deliverables: Mapped[List["CampaignDeliverable"]] = relationship(
        "CampaignDeliverable",
        back_populates="campaign",
        cascade="all, delete-orphan"
    )

    messages: Mapped[List["CampaignMessage"]] = relationship(
        back_populates="campaign", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint(
            "min_followers IS NULL OR max_followers IS NULL OR min_followers <= max_followers",
            name="campaign_min_le_max_followers",
        ),
        CheckConstraint(
            "max_slots IS NULL OR slots_filled IS NULL OR slots_filled <= max_slots",
            name="campaign_slots_filled_le_max_slots",
        ),
    )