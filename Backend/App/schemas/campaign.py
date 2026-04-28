from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import Field, model_validator

from .common import APIModel
from models.enums import CampaignStatus  # adjust import path if needed
from models.enums import SocialPlatform

class CampaignBase(APIModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None

    niche_tags: Optional[list[str]] = None

    min_followers: Optional[int] = Field(default=None, ge=0)
    max_followers: Optional[int] = Field(default=None, ge=0)

    budget_total: Optional[Decimal] = Field(default=None, ge=0)
    budget_per_slot: Optional[Decimal] = Field(default=None, ge=0)

    max_slots: Optional[int] = Field(default=None, ge=1, le=32767)  # SmallInteger safe range
    target_platforms: Optional[list[SocialPlatform]] = None
    status: Optional[CampaignStatus] = None
    application_deadline: Optional[datetime] = None

    @model_validator(mode="after")
    def validate_ranges(self):
        if self.min_followers is not None and self.max_followers is not None:
            if self.min_followers > self.max_followers:
                raise ValueError("min_followers must be <= max_followers")

        if self.max_slots is not None and self.slots_filled is not None:
            if self.slots_filled > self.max_slots:
                raise ValueError("slots_filled must be <= max_slots")

        return self


class CampaignCreate(CampaignBase):
    brand_id: UUID
    # If you want to force status on create:
    # status: CampaignStatus = CampaignStatus.draft


class CampaignUpdate(APIModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None

    niche_tags: Optional[list[str]] = None
    min_followers: Optional[int] = Field(default=None, ge=0)
    max_followers: Optional[int] = Field(default=None, ge=0)

    budget_total: Optional[Decimal] = Field(default=None, ge=0)
    budget_per_slot: Optional[Decimal] = Field(default=None, ge=0)
    target_platforms: Optional[list[SocialPlatform]] = None
    max_slots: Optional[int] = Field(default=None, ge=1, le=32767)


    status: Optional[CampaignStatus] = None
    application_deadline: Optional[datetime] = None

    @model_validator(mode="after")
    def validate_ranges(self):
        if self.min_followers is not None and self.max_followers is not None:
            if self.min_followers > self.max_followers:
                raise ValueError("min_followers must be <= max_followers")

        if self.max_slots is not None and self.slots_filled is not None:
            if self.slots_filled > self.max_slots:
                raise ValueError("slots_filled must be <= max_slots")

        return self


class CampaignRead(APIModel):
    id: UUID
    brand_id: UUID

    title: str
    description: Optional[str] = None

    niche_tags: Optional[list[str]] = None
    target_platforms: Optional[list[SocialPlatform]] = None

    min_followers: Optional[int] = None
    max_followers: Optional[int] = None

    budget_total: Optional[Decimal] = None
    budget_per_slot: Optional[Decimal] = None

    max_slots: Optional[int] = None
    slots_filled: Optional[int] = None

    status: CampaignStatus
    application_deadline: Optional[datetime] = None

    created_at: datetime
    updated_at: datetime


class CampaignMini(APIModel):
    id: UUID
    title: str
    status: CampaignStatus