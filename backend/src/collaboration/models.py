from __future__ import annotations

from datetime import datetime, UTC
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base
from src.collaboration.enums import CollaborationState, EscrowStatus, LedgerType

if TYPE_CHECKING:
    from src.campaign_proposal.models import CampaignProposal
    from src.users.model import User


class Collaboration(Base):
    __tablename__ = "collaborations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    proposal_id: Mapped[int] = mapped_column(
        ForeignKey("campaign_proposals.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    state: Mapped[CollaborationState] = mapped_column(
        Enum(CollaborationState),
        default=CollaborationState.ESCROW_PENDING,
        nullable=False,
        index=True,
    )
    escrow_status: Mapped[EscrowStatus] = mapped_column(
        Enum(EscrowStatus),
        default=EscrowStatus.PENDING,
        nullable=False,
        index=True,
    )
    payout_amount: Mapped[int] = mapped_column(Integer, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    proposal: Mapped["CampaignProposal"] = relationship("CampaignProposal")
    submission: Mapped[Optional["DeliverableSubmission"]] = relationship(
        "DeliverableSubmission",
        back_populates="collaboration",
        uselist=False,
        cascade="all, delete-orphan",
    )
    ledger_entries: Mapped[list["LedgerEntry"]] = relationship(
        "LedgerEntry",
        back_populates="collaboration",
        cascade="all, delete-orphan",
    )


class DeliverableSubmission(Base):
    __tablename__ = "deliverable_submissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    collaboration_id: Mapped[int] = mapped_column(
        ForeignKey("collaborations.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    video_url: Mapped[str] = mapped_column(nullable=False)
    post_url: Mapped[Optional[str]] = mapped_column(nullable=True)
    caption: Mapped[Optional[str]] = mapped_column(nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(nullable=True)
    aspect_ratio: Mapped[Optional[str]] = mapped_column(nullable=True)
    duration: Mapped[Optional[str]] = mapped_column(nullable=True)

    brief_matched: Mapped[bool] = mapped_column(default=True, nullable=False)
    usage_rights: Mapped[bool] = mapped_column(default=True, nullable=False)
    no_copyright_music: Mapped[bool] = mapped_column(default=True, nullable=False)

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    collaboration: Mapped["Collaboration"] = relationship("Collaboration", back_populates="submission")


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    collaboration_id: Mapped[int] = mapped_column(
        ForeignKey("collaborations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    from_user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    to_user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    type: Mapped[LedgerType] = mapped_column(Enum(LedgerType), nullable=False, index=True)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    collaboration: Mapped["Collaboration"] = relationship("Collaboration", back_populates="ledger_entries")
