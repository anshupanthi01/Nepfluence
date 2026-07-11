from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ConversationCreatorPublic(BaseModel):
    id: int
    user_id: int
    full_name: str
    handle: str | None = None


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


class MessagePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    sender_user_id: int
    sender_role: str
    sender_name: str
    body: str
    created_at: datetime
    deleted_for_sender_at: datetime | None = None
    deleted_for_recipient_at: datetime | None = None


class ConversationPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    campaign_id: int
    brand_profile_id: int
    influencer_profile_id: int
    creator: ConversationCreatorPublic
    last_message: MessagePublic | None = None
    created_at: datetime
    updated_at: datetime
    hidden_for_brand_at: datetime | None = None
    hidden_for_creator_at: datetime | None = None
