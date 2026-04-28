from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import Field

from .common import APIModel


class InfluencerProfileBase(APIModel):
    display_name: Optional[str] = Field(default=None, max_length=200)
    bio: Optional[str] = None
    niche: Optional[str] = Field(default=None, max_length=200)

    location_city: Optional[str] = Field(default=None, max_length=120)
    location_country: Optional[str] = Field(default=None, max_length=120)

    follower_tier: Optional[str] = Field(default=None, max_length=100)
    total_followers: Optional[int] = Field(default=None, ge=0)

    # Numeric in DB => safest is Decimal
    engagement_score: Optional[Decimal] = Field(default=None, ge=0)

    is_verified: Optional[bool] = None
    profile_status: Optional[str] = Field(default=None, max_length=50)


class InfluencerProfileCreate(InfluencerProfileBase):
    user_id: UUID


class InfluencerProfileUpdate(APIModel):
    # PATCH: all optional
    display_name: Optional[str] = Field(default=None, max_length=200)
    bio: Optional[str] = None
    niche: Optional[str] = Field(default=None, max_length=200)

    location_city: Optional[str] = Field(default=None, max_length=120)
    location_country: Optional[str] = Field(default=None, max_length=120)

    follower_tier: Optional[str] = Field(default=None, max_length=100)
    total_followers: Optional[int] = Field(default=None, ge=0)
    engagement_score: Optional[Decimal] = Field(default=None, ge=0)

    # Typically admin-only fields; keep if you want admin routes to update them
    is_verified: Optional[bool] = None
    profile_status: Optional[str] = Field(default=None, max_length=50)


class InfluencerProfileRead(InfluencerProfileBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime


# Relationship-safe "mini" version (use inside other responses)
class InfluencerProfileMini(APIModel):
    id: UUID
    display_name: Optional[str] = None
    niche: Optional[str] = None
    total_followers: Optional[int] = None