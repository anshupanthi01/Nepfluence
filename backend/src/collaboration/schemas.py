from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from src.campaign_proposal.schemas import ProposalCampaignSummary, ProposalCreatorSummary
from src.collaboration.enums import CollaborationState, EscrowStatus, LedgerType


class DeliverableSubmissionCreate(BaseModel):
    video_url: str = Field(min_length=1)
    post_url: Optional[str] = None
    caption: Optional[str] = None
    notes: Optional[str] = None
    aspect_ratio: Optional[str] = None
    duration: Optional[str] = None
    brief_matched: bool = True
    usage_rights: bool = True
    no_copyright_music: bool = True


class DeliverableSubmissionPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    video_url: str
    post_url: Optional[str] = None
    caption: Optional[str] = None
    notes: Optional[str] = None
    aspect_ratio: Optional[str] = None
    duration: Optional[str] = None
    brief_matched: bool
    usage_rights: bool
    no_copyright_music: bool
    submitted_at: datetime


class CollaborationPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    proposal_id: int
    state: CollaborationState
    escrow_status: EscrowStatus
    payout_amount: int
    created_at: datetime
    updated_at: datetime
    creator: Optional[ProposalCreatorSummary] = None
    campaign: Optional[ProposalCampaignSummary] = None
    submission: Optional[DeliverableSubmissionPublic] = None


class WalletPublic(BaseModel):
    balance: int
    escrow_held: int
    released: int


class LedgerEntryPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    collaboration_id: int
    from_user_id: Optional[int] = None
    to_user_id: Optional[int] = None
    type: LedgerType
    amount: int
    created_at: datetime
