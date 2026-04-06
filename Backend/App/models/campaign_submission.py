from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    SmallInteger,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import UniqueConstraint
from .base import Base
from .enums import SubmissionStatus


class CampaignSubmission(Base):
    __tablename__ = "campaign_submission"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # FK → campaign_application.id
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaign_application.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # FK → campaign_deliverable.id
    deliverable_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaign_deliverable.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # VARCHAR(1000) NOT NULL
    submission_url: Mapped[str] = mapped_column(
        String(1000),
        nullable=False
    )

    # BOOLEAN NULL
    url_valid: Mapped[Optional[bool]] = mapped_column(
        Boolean,
        nullable=True
    )

    # SMALLINT DEFAULT 1
    revision_number: Mapped[int] = mapped_column(
        SmallInteger,
        default=1,
        nullable=False
    )

    # ENUM
    status: Mapped[SubmissionStatus] = mapped_column(
        Enum(SubmissionStatus, name="submission_status"),
        default=SubmissionStatus.under_review,
        nullable=False
    )

    # TIMESTAMPS
    brand_reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    auto_released_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # 🔗 RELATIONSHIPS
    application = relationship(
        "CampaignApplication",
        back_populates="submissions"
    )

    deliverable = relationship(
        "CampaignDeliverable",
        back_populates="submissions"
    )

    __table_args__ = (
    UniqueConstraint(
        "application_id",
        "deliverable_id",
        "revision_number",
        name="unique_submission_revision"
    ),
    )