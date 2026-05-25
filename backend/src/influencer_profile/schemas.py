from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List

from src.influencer_profile.enums import InfluencerNiche, SocialPlatform


# ----------------------------
# Influencer Profile Schemas
# ----------------------------

class InfluencerProfileBase(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    bio: Optional[str] = None
    niche: InfluencerNiche
    availability: bool = True


class InfluencerProfileCreate(InfluencerProfileBase):
    pass


class InfluencerProfileUpdate(BaseModel):
    # all optional for PATCH
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    bio: Optional[str] = None
    niche: Optional[InfluencerNiche] = None
    availability: Optional[bool] = None


class InfluencerProfilePublic(InfluencerProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int


# ----------------------------
# Social Account Schemas
# ----------------------------
# We will use YouTube API to populate stats, so client should only send identifiers.

class SocialAccountCreate(BaseModel):
    platform: SocialPlatform = SocialPlatform.youtube

    youtube_channel_id: str = Field(min_length=1, max_length=200)
    youtube_handle: Optional[str] = Field(default=None, max_length=120)


class SocialAccountUpdate(BaseModel):
    # all optional for PATCH
    platform: Optional[SocialPlatform] = None
    youtube_channel_id: Optional[str] = Field(default=None, min_length=1, max_length=200)
    youtube_handle: Optional[str] = Field(default=None, max_length=120)


class SocialAccountPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    influencer_id: int

    platform: SocialPlatform
    youtube_channel_id: str
    youtube_handle: Optional[str] = None

    # fetched from YouTube API and saved in DB
    youtube_channel_name: str
    subscribers_count: int
    total_views: int
    total_videos: int
    average_views: Optional[int] = None
    engagement_rate: Optional[float] = None
    is_verified: bool


# Optional: profile response including linked social accounts
class InfluencerProfileWithSocialsPublic(InfluencerProfilePublic):
    social_accounts: List[SocialAccountPublic] = []