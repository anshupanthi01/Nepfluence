from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .enums import ApplicationStatus


class CampaignApplication(Base):
    __tablename__ = "campaign_application"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaign.id", ondelete="CASCADE"), nullable=False, index=True
    )
    influencer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("influencer_profile.id", ondelete="CASCADE"), nullable=False, index=True
    )

    quoted_price: Mapped[Optional[float]] = mapped_column(Numeric, nullable=True)
    ai_match_score: Mapped[Optional[float]] = mapped_column(Numeric, nullable=True)
    application_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus, name="application_status"),
        nullable=False,
        default=ApplicationStatus.pending,
        server_default=ApplicationStatus.pending.value,
    )

    accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    campaign: Mapped["Campaign"] = relationship(back_populates="applications")
    influencer: Mapped["InfluencerProfile"] = relationship(back_populates="applications")

    __table_args__ = (
        UniqueConstraint("campaign_id", "influencer_id", name="uq_campaign_application_campaign_influencer"),
    )