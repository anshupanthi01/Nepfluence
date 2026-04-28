from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import Field

from .common import APIModel
from models.enums import SocialPlatform  # adjust import path if needed


class InfluencerSocialAccountBase(APIModel):
    platform: SocialPlatform

    platform_user_id: Optional[str] = Field(default=None, max_length=200)
    username: Optional[str] = Field(default=None, max_length=200)

    follower_count: Optional[int] = Field(default=None, ge=0)
    avg_engagement_rate: Optional[Decimal] = Field(default=None, ge=0)

    last_synced_at: Optional[datetime] = None
    is_primary: bool = False


class InfluencerSocialAccountCreate(InfluencerSocialAccountBase):
    influencer_id: UUID

    # IMPORTANT:
    # We should NOT accept access_token_encrypted directly from client in most designs.
    # Instead accept a plain token and encrypt server-side, OR handle via OAuth callback.
    # If you *really* need it, tell me and I’ll add an admin/internal create schema.


class InfluencerSocialAccountUpdate(APIModel):
    # PATCH: optional
    platform_user_id: Optional[str] = Field(default=None, max_length=200)
    username: Optional[str] = Field(default=None, max_length=200)

    follower_count: Optional[int] = Field(default=None, ge=0)
    avg_engagement_rate: Optional[Decimal] = Field(default=None, ge=0)

    last_synced_at: Optional[datetime] = None
    is_primary: Optional[bool] = None

    # Again: do NOT patch access_token_encrypted from client.


class InfluencerSocialAccountRead(InfluencerSocialAccountBase):
    id: UUID
    influencer_id: UUID
    created_at: datetime


class InfluencerSocialAccountMini(APIModel):
    id: UUID
    platform: SocialPlatform
    username: Optional[str] = None
    follower_count: Optional[int] = None
    is_primary: bool = False