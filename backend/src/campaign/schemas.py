from pydantic import BaseModel, ConfigDict, Field
from typing import Literal, Optional
from datetime import date, datetime
from src.campaign.enums import CampaignStatus
from src.brand_profile.schemas import BrandProfilePublic

CampaignCountry = Literal["NP", "IN"]


class CampaignBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None

    budget_min: int = Field(ge=0)
    budget_max: int = Field(ge=0)

    niche: Optional[str] = Field(default=None, max_length=50)
    country: Optional[CampaignCountry] = None
    platform: Optional[str] = Field(default=None, max_length=50)
    deadline: Optional[date] = None



class CampaignCreate(CampaignBase):
    pass


class CampaignUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None

    budget_min: Optional[int] = Field(default=None, ge=0)
    budget_max: Optional[int] = Field(default=None, ge=0)

    niche: Optional[str] = Field(default=None, max_length=50)
    country: Optional[CampaignCountry] = None
    platform: Optional[str] = Field(default=None, max_length=50)
    deadline: Optional[date] = None


class CampaignPublic(CampaignBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    brand_profile_id: int
    brand_name: str
    status: CampaignStatus
    image_file:str|None
    image_path:str

class CampaignResponse(CampaignBase):
    model_config=ConfigDict(from_attributes=True)

    id:int
    user_id:int
    date_posted:datetime
    brand_profile:BrandProfilePublic