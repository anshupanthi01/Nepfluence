from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import Field

from .common import APIModel
from models.enums import ApplicationStatus  # adjust import path if needed


class CampaignApplicationBase(APIModel):
    quoted_price: Optional[Decimal] = Field(default=None, ge=0)
    application_note: Optional[str] = None


class CampaignApplicationCreate(CampaignApplicationBase):
    campaign_id: UUID
    influencer_id: UUID
    # status defaults to pending in DB; don't accept from client


class CampaignApplicationUpdate(APIModel):
    # "simple" PATCH (influencer editable fields)
    quoted_price: Optional[Decimal] = Field(default=None, ge=0)
    application_note: Optional[str] = None
    # do not allow status here in general


class CampaignApplicationRead(CampaignApplicationBase):
    id: UUID
    campaign_id: UUID
    influencer_id: UUID

    ai_match_score: Optional[Decimal] = None
    status: ApplicationStatus
    accepted_at: Optional[datetime] = None

    created_at: datetime


# Optional: action schemas (recommended for clean endpoints)
class CampaignApplicationWithdraw(APIModel):
    # influencer action
    status: ApplicationStatus = ApplicationStatus.withdrawn


class CampaignApplicationDecision(APIModel):
    # brand/admin action
    status: ApplicationStatus  # accept/reject

    # If you want strict validation:
    # @model_validator(mode="after") ensure status in {accepted, rejected}