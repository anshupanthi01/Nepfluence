from __future__ import annotations

from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth import CurrentUser
from src.brand_profile.models import BrandProfile
from src.campaign_proposal.schemas import ProposalCampaignSummary, ProposalCreatorSummary
from src.collaboration import crud
from src.collaboration.enums import CollaborationState, EscrowStatus
from src.collaboration.models import Collaboration
from src.collaboration.schemas import (
    CollaborationPublic,
    DeliverableSubmissionCreate,
    DeliverableSubmissionPublic,
    LedgerEntryPublic,
    WalletPublic,
)
from src.database import get_db
from src.influencer_profile.models import InfluencerProfile
from src.influencer_profile.utils import country_code, profile_followers, profile_handle
from src.users.model import UserRole

router = APIRouter(tags=["collaborations"])

DEFAULT_BRAND_STARTING_BALANCE = 150_000


async def _get_my_brand_profile(db: AsyncSession, current_user: CurrentUser) -> BrandProfile:
    if current_user.role != UserRole.BRAND:
        raise HTTPException(status_code=403, detail="Only brand users can do this")
    result = await db.execute(select(BrandProfile).where(BrandProfile.user_id == current_user.id))
    brand_profile = result.scalars().first()
    if not brand_profile:
        raise HTTPException(status_code=400, detail="Create brand profile first")
    return brand_profile


async def _get_my_influencer_profile(db: AsyncSession, current_user: CurrentUser) -> InfluencerProfile:
    if current_user.role != UserRole.INFLUENCER:
        raise HTTPException(status_code=403, detail="Only influencer users can do this")
    result = await db.execute(select(InfluencerProfile).where(InfluencerProfile.user_id == current_user.id))
    influencer_profile = result.scalars().first()
    if not influencer_profile:
        raise HTTPException(status_code=400, detail="Create influencer profile first")
    return influencer_profile


def _collaboration_public(collaboration: Collaboration) -> CollaborationPublic:
    proposal = collaboration.proposal
    creator = None
    campaign_summary = None

    if proposal and proposal.influencer_profile:
        influencer_profile = proposal.influencer_profile
        creator = ProposalCreatorSummary(
            id=influencer_profile.id,
            user_id=influencer_profile.user_id,
            full_name=influencer_profile.full_name,
            handle=profile_handle(influencer_profile),
            niche=getattr(influencer_profile.niche, "value", influencer_profile.niche),
            country=country_code(getattr(influencer_profile.user, "country", None)),
            followers=profile_followers(influencer_profile),
        )

    if proposal and proposal.campaign:
        campaign = proposal.campaign
        campaign_summary = ProposalCampaignSummary(
            id=campaign.id,
            title=campaign.title,
            brand_name=campaign.brand_profile.company_name if campaign.brand_profile else "Brand",
            status=campaign.status,
            budget_min=campaign.budget_min,
            budget_max=campaign.budget_max,
        )

    submission = (
        DeliverableSubmissionPublic.model_validate(collaboration.submission)
        if collaboration.submission
        else None
    )

    return CollaborationPublic(
        id=collaboration.id,
        proposal_id=collaboration.proposal_id,
        state=collaboration.state,
        escrow_status=collaboration.escrow_status,
        payout_amount=collaboration.payout_amount,
        created_at=collaboration.created_at,
        updated_at=collaboration.updated_at,
        creator=creator,
        campaign=campaign_summary,
        submission=submission,
    )


async def _get_authorized_collaboration(
    db: AsyncSession,
    collaboration_id: int,
    current_user: CurrentUser,
) -> Collaboration:
    collaboration = await crud.get_by_id(db, collaboration_id)
    if not collaboration or not collaboration.proposal:
        raise HTTPException(status_code=404, detail="Collaboration not found")

    proposal = collaboration.proposal
    if current_user.role == UserRole.BRAND:
        brand_profile = await _get_my_brand_profile(db, current_user)
        if not proposal.campaign or proposal.campaign.brand_profile_id != brand_profile.id:
            raise HTTPException(status_code=403, detail="Not authorized for this collaboration")
    elif current_user.role == UserRole.INFLUENCER:
        influencer_profile = await _get_my_influencer_profile(db, current_user)
        if proposal.influencer_profile_id != influencer_profile.id:
            raise HTTPException(status_code=403, detail="Not authorized for this collaboration")
    else:
        raise HTTPException(status_code=403, detail="Not authorized")

    return collaboration


def _wallet_from_collaborations(collaborations: list[Collaboration], role: UserRole) -> WalletPublic:
    held = sum(c.payout_amount for c in collaborations if c.escrow_status == EscrowStatus.HELD)
    released = sum(c.payout_amount for c in collaborations if c.escrow_status == EscrowStatus.RELEASED)

    if role == UserRole.BRAND:
        balance = max(0, DEFAULT_BRAND_STARTING_BALANCE - held - released)
    else:
        balance = released

    return WalletPublic(balance=balance, escrow_held=held, released=released)


@router.get("/collaborations/me", response_model=List[CollaborationPublic])
async def list_my_collaborations(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if current_user.role == UserRole.BRAND:
        brand_profile = await _get_my_brand_profile(db, current_user)
        collaborations = await crud.list_for_brand(db, brand_profile.id)
    elif current_user.role == UserRole.INFLUENCER:
        influencer_profile = await _get_my_influencer_profile(db, current_user)
        collaborations = await crud.list_for_creator(db, influencer_profile.id)
    else:
        raise HTTPException(status_code=403, detail="Not authorized")

    return [_collaboration_public(collaboration) for collaboration in collaborations]


@router.post("/collaborations/{collaboration_id}/deposit-escrow", response_model=CollaborationPublic)
async def deposit_escrow(
    collaboration_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if current_user.role != UserRole.BRAND:
        raise HTTPException(status_code=403, detail="Only the brand can deposit escrow")

    collaboration = await _get_authorized_collaboration(db, collaboration_id, current_user)
    if collaboration.escrow_status != EscrowStatus.PENDING:
        raise HTTPException(status_code=400, detail="Escrow has already been deposited")

    brand_profile = await _get_my_brand_profile(db, current_user)
    wallet = _wallet_from_collaborations(await crud.list_for_brand(db, brand_profile.id), UserRole.BRAND)
    if wallet.balance < collaboration.payout_amount:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance to deposit escrow")

    updated = await crud.deposit_escrow(db, collaboration, current_user.id)
    return _collaboration_public(updated)


@router.post(
    "/collaborations/{collaboration_id}/submissions",
    response_model=CollaborationPublic,
    status_code=status.HTTP_201_CREATED,
)
async def submit_deliverable(
    collaboration_id: int,
    payload: DeliverableSubmissionCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if current_user.role != UserRole.INFLUENCER:
        raise HTTPException(status_code=403, detail="Only the creator can submit a deliverable")

    collaboration = await _get_authorized_collaboration(db, collaboration_id, current_user)
    if collaboration.escrow_status != EscrowStatus.HELD:
        raise HTTPException(status_code=400, detail="Escrow must be funded before submitting a deliverable")
    if collaboration.submission:
        raise HTTPException(status_code=400, detail="A deliverable has already been submitted for this collaboration")

    updated = await crud.create_submission(db, collaboration, payload)
    return _collaboration_public(updated)


@router.post("/collaborations/{collaboration_id}/approve", response_model=CollaborationPublic)
async def approve_collaboration(
    collaboration_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if current_user.role != UserRole.BRAND:
        raise HTTPException(status_code=403, detail="Only the brand can approve a deliverable")

    collaboration = await _get_authorized_collaboration(db, collaboration_id, current_user)
    if collaboration.state != CollaborationState.SUBMITTED:
        raise HTTPException(status_code=400, detail="Deliverable must be submitted before approval")

    creator_user_id = collaboration.proposal.influencer_profile.user_id
    updated = await crud.approve(db, collaboration, creator_user_id)
    return _collaboration_public(updated)


@router.get("/wallet/me", response_model=WalletPublic)
async def get_my_wallet(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if current_user.role == UserRole.BRAND:
        brand_profile = await _get_my_brand_profile(db, current_user)
        collaborations = await crud.list_for_brand(db, brand_profile.id)
    elif current_user.role == UserRole.INFLUENCER:
        influencer_profile = await _get_my_influencer_profile(db, current_user)
        collaborations = await crud.list_for_creator(db, influencer_profile.id)
    else:
        raise HTTPException(status_code=403, detail="Not authorized")

    return _wallet_from_collaborations(collaborations, current_user.role)


@router.get("/ledger/me", response_model=List[LedgerEntryPublic])
async def get_my_ledger(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    entries = await crud.list_ledger_for_user(db, current_user.id)
    return [LedgerEntryPublic.model_validate(entry) for entry in entries]
