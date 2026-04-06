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
from .enums import Deliverable

class CampaignDeliverable(Base):
    __tablename__ = "campaign_deliverable"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaign.id", ondelete="CASCADE"), nullable=False, index=True
    )

    deliverable_type:Mapped[Deliverable]=mapped_column(Enum(Deliverable,name="content_type"),nullable=False)
  
    platform: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )

      # SMALLINT DEFAULT 7
    due_days_after_accept: Mapped[int] = mapped_column(
        SmallInteger,
        default=7,
        nullable=False
    )

    # SMALLINT DEFAULT 2
    revision_limit: Mapped[int] = mapped_column(
        SmallInteger,
        default=2,
        nullable=False
    )

    # SMALLINT DEFAULT 100
    milestone_pct: Mapped[int] = mapped_column(
        SmallInteger,
        default=100,
        nullable=False
    )

    # TIMESTAMPTZ DEFAULT NOW()
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
 
    campaign = relationship(
        "Campaign",
        back_populates="deliverables"
    )

    submissions = relationship(
    "CampaignSubmission",
    back_populates="deliverable",
    cascade="all, delete-orphan"
    )

    __table_args__ = (
    CheckConstraint("milestone_pct >= 0 AND milestone_pct <= 100", name="check_milestone_pct"),
    CheckConstraint("revision_limit >= 0", name="check_revision_limit"),
    CheckConstraint("due_days_after_accept >= 0", name="check_due_days"),
    )