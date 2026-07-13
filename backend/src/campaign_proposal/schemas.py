from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime

from src.campaign.enums import CampaignStatus
from src.campaign_proposal.enums import ProposalStatus


class ProposalBase(BaseModel):
    message: Optional[str] = None
    proposed_budget: Optional[int] = Field(default=None, ge=0)


class ProposalCreate(ProposalBase):
    pass


class ProposalCreatorSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    full_name: str
    handle: str
    niche: str
    country: str
    followers: str


class ProposalCampaignSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    brand_name: str
    status: CampaignStatus
    budget_min: int
    budget_max: int


class ProposalPublic(ProposalBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    campaign_id: int
    influencer_profile_id: int
    status: ProposalStatus
    created_at: datetime
    updated_at: datetime
    creator: Optional[ProposalCreatorSummary] = None
    campaign: Optional[ProposalCampaignSummary] = None