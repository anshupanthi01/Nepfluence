from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

from src.influencer_profile.enums import InfluencerNiche


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