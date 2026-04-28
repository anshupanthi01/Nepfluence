from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import Field, model_validator

from .common import APIModel
from models.enums import Deliverable  # adjust import path if needed


class CampaignDeliverableBase(APIModel):
    deliverable_type: Deliverable
    platform: str = Field(min_length=1, max_length=20)
    description: Optional[str] = None

    due_days_after_accept: int = Field(default=7, ge=0, le=32767)
    revision_limit: int = Field(default=2, ge=0, le=32767)
    milestone_pct: int = Field(default=100, ge=0, le=100)


class CampaignDeliverableCreate(CampaignDeliverableBase):
    campaign_id: UUID


class CampaignDeliverableUpdate(APIModel):
    deliverable_type: Optional[Deliverable] = None
    platform: Optional[str] = Field(default=None, min_length=1, max_length=20)
    description: Optional[str] = None

    due_days_after_accept: Optional[int] = Field(default=None, ge=0, le=32767)
    revision_limit: Optional[int] = Field(default=None, ge=0, le=32767)
    milestone_pct: Optional[int] = Field(default=None, ge=0, le=100)


class CampaignDeliverableRead(CampaignDeliverableBase):
    id: UUID
    campaign_id: UUID
    created_at: datetime