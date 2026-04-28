from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import AnyUrl, Field

from .common import APIModel


class BrandProfileBase(APIModel):
    company_name: Optional[str] = Field(default=None, max_length=200)
    website_url: Optional[AnyUrl] = None

    total_campaigns_run: Optional[int] = Field(default=None, ge=0)
    onboarding_status: Optional[str] = Field(default=None, max_length=50)

    # Usually controlled by backend/admin
    verified_badge: Optional[bool] = None


class BrandProfileCreate(BrandProfileBase):
    user_id: UUID


class BrandProfileUpdate(APIModel):
    company_name: Optional[str] = Field(default=None, max_length=200)
    website_url: Optional[AnyUrl] = None

    total_campaigns_run: Optional[int] = Field(default=None, ge=0)
    onboarding_status: Optional[str] = Field(default=None, max_length=50)

    # keep only if admin can update it:
    verified_badge: Optional[bool] = None


class BrandProfileRead(BrandProfileBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class BrandProfileMini(APIModel):
    id: UUID
    company_name: Optional[str] = None
    verified_badge: bool = False