from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth import CurrentUser
from src.brand_profile.models import BrandProfile
from src.campaign.models import Campaign
from src.conversations.models import Conversation, Message
from src.conversations.schemas import (
    ConversationCreatorPublic,
    ConversationPublic,
    MessageCreate,
    MessagePublic,
)
from src.database import get_db
from src.influencer_profile.models import InfluencerProfile
from src.users.model import User, UserRole

router = APIRouter(prefix="/campaigns/{campaign_id}/conversations", tags=["conversations"])


async def _get_brand_profile(db: AsyncSession, user_id: int) -> BrandProfile | None:
    result = await db.execute(select(BrandProfile).where(BrandProfile.user_id == user_id))
    return result.scalars().first()


async def _get_influencer_profile(db: AsyncSession, user_id: int) -> InfluencerProfile | None:
    result = await db.execute(select(InfluencerProfile).where(InfluencerProfile.user_id == user_id))
    return result.scalars().first()


async def get_or_create_conversation(
    db: AsyncSession,
    campaign: Campaign,
    influencer_profile_id: int,
) -> Conversation:
    result = await db.execute(
        select(Conversation).where(
            Conversation.campaign_id == campaign.id,
            Conversation.influencer_profile_id == influencer_profile_id,
        )
    )
    conversation = result.scalars().first()
    if conversation:
        return conversation

    conversation = Conversation(
        campaign_id=campaign.id,
        brand_profile_id=campaign.brand_profile_id,
        influencer_profile_id=influencer_profile_id,
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return conversation


async def _get_authorized_campaign(
    db: AsyncSession,
    campaign_id: int,
    current_user: CurrentUser,
) -> tuple[Campaign, BrandProfile | None, InfluencerProfile | None]:
    campaign = await db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    brand_profile = None
    influencer_profile = None

    if current_user.role == UserRole.BRAND:
        brand_profile = await _get_brand_profile(db, current_user.id)
        if not brand_profile or campaign.brand_profile_id != brand_profile.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this campaign")
    elif current_user.role == UserRole.INFLUENCER:
        influencer_profile = await _get_influencer_profile(db, current_user.id)
        if not influencer_profile:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Create influencer profile first")
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    return campaign, brand_profile, influencer_profile


async def _get_authorized_conversation(
    db: AsyncSession,
    campaign_id: int,
    conversation_id: int,
    current_user: CurrentUser,
) -> Conversation:
    campaign, brand_profile, influencer_profile = await _get_authorized_campaign(db, campaign_id, current_user)
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.campaign_id == campaign.id,
        )
    )
    conversation = result.scalars().first()
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    if brand_profile and conversation.brand_profile_id != brand_profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this conversation")
    if influencer_profile and conversation.influencer_profile_id != influencer_profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this conversation")

    return conversation


async def _message_public(db: AsyncSession, message: Message) -> MessagePublic:
    sender = await db.get(User, message.sender_user_id)
    return MessagePublic(
        id=message.id,
        conversation_id=message.conversation_id,
        sender_user_id=message.sender_user_id,
        sender_role=sender.role.value if sender else "unknown",
        sender_name=sender.username if sender else "Unknown",
        body=message.body,
        created_at=message.created_at,
        deleted_for_sender_at=message.deleted_for_sender_at,
        deleted_for_recipient_at=message.deleted_for_recipient_at,
    )


async def _conversation_public(db: AsyncSession, conversation: Conversation, current_user: CurrentUser) -> ConversationPublic:
    creator = await db.get(InfluencerProfile, conversation.influencer_profile_id)
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.desc(), Message.id.desc())
    )
    last_message = next(
        (message for message in result.scalars().all() if _message_visible_to_user(message, current_user)),
        None,
    )

    return ConversationPublic(
        id=conversation.id,
        campaign_id=conversation.campaign_id,
        brand_profile_id=conversation.brand_profile_id,
        influencer_profile_id=conversation.influencer_profile_id,
        creator=ConversationCreatorPublic(
            id=creator.id if creator else conversation.influencer_profile_id,
            user_id=creator.user_id if creator else 0,
            full_name=creator.full_name if creator else "Creator",
            handle=None,
        ),
        last_message=await _message_public(db, last_message) if last_message else None,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        hidden_for_brand_at=conversation.hidden_for_brand_at,
        hidden_for_creator_at=conversation.hidden_for_creator_at,
    )


def _message_visible_to_user(message: Message, current_user: CurrentUser) -> bool:
    if message.sender_user_id == current_user.id:
        return message.deleted_for_sender_at is None
    return message.deleted_for_recipient_at is None


@router.get("", response_model=list[ConversationPublic])
async def list_campaign_conversations(
    campaign_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    campaign, brand_profile, influencer_profile = await _get_authorized_campaign(db, campaign_id, current_user)

    query = select(Conversation).where(Conversation.campaign_id == campaign.id)
    if brand_profile:
        query = query.where(
            Conversation.brand_profile_id == brand_profile.id,
            Conversation.hidden_for_brand_at.is_(None),
        )
    if influencer_profile:
        query = query.where(
            Conversation.influencer_profile_id == influencer_profile.id,
            Conversation.hidden_for_creator_at.is_(None),
        )

    result = await db.execute(query.order_by(Conversation.updated_at.desc(), Conversation.id.desc()))
    return [await _conversation_public(db, conversation, current_user) for conversation in result.scalars().all()]


@router.get("/{conversation_id}/messages", response_model=list[MessagePublic])
async def list_conversation_messages(
    campaign_id: int,
    conversation_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    conversation = await _get_authorized_conversation(db, campaign_id, conversation_id, current_user)
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc(), Message.id.asc())
    )
    return [
        await _message_public(db, message)
        for message in result.scalars().all()
        if _message_visible_to_user(message, current_user)
    ]


@router.post("/{conversation_id}/messages", response_model=MessagePublic, status_code=status.HTTP_201_CREATED)
async def send_conversation_message(
    campaign_id: int,
    conversation_id: int,
    payload: MessageCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    conversation = await _get_authorized_conversation(db, campaign_id, conversation_id, current_user)
    message = Message(
        conversation_id=conversation.id,
        sender_user_id=current_user.id,
        body=payload.body.strip(),
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return await _message_public(db, message)


@router.delete("/{conversation_id}", response_model=ConversationPublic)
async def hide_conversation(
    campaign_id: int,
    conversation_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    conversation = await _get_authorized_conversation(db, campaign_id, conversation_id, current_user)
    now = datetime.now(UTC)
    if current_user.role == UserRole.BRAND:
        conversation.hidden_for_brand_at = now
    elif current_user.role == UserRole.INFLUENCER:
        conversation.hidden_for_creator_at = now
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    await db.commit()
    await db.refresh(conversation)
    return await _conversation_public(db, conversation, current_user)


@router.delete("/{conversation_id}/messages/{message_id}", response_model=MessagePublic)
async def hide_message(
    campaign_id: int,
    conversation_id: int,
    message_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    conversation = await _get_authorized_conversation(db, campaign_id, conversation_id, current_user)
    result = await db.execute(
        select(Message).where(
            Message.id == message_id,
            Message.conversation_id == conversation.id,
        )
    )
    message = result.scalars().first()
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    now = datetime.now(UTC)
    if message.sender_user_id == current_user.id:
        message.deleted_for_sender_at = now
    else:
        message.deleted_for_recipient_at = now

    await db.commit()
    await db.refresh(message)
    return await _message_public(db, message)
