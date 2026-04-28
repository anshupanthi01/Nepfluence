from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import Field

from .common import APIModel


class CampaignMessageBase(APIModel):
    message_body: str = Field(min_length=1, max_length=5000)
    delivery_status: Optional[str] = Field(default=None, max_length=50)


class CampaignMessageCreate(APIModel):
    campaign_id: UUID
    recipient_id: UUID
    message_body: str = Field(min_length=1, max_length=5000)
    # sender_id is derived from the logged-in user


class CampaignMessageUpdate(APIModel):
    # Usually you don't edit messages; keep minimal.
    delivery_status: Optional[str] = Field(default=None, max_length=50)


class CampaignMessageRead(CampaignMessageBase):
    id: UUID
    campaign_id: UUID
    sender_id: UUID
    recipient_id: UUID
    created_at: datetime