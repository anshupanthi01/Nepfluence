from __future__ import annotations

from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth import CurrentUser
from src.database import get_db
from src.users.model import UserRole
from src.brand_profile.models import BrandProfile
from src.campaign.models import Campaign
from src.campaign.enums import CampaignStatus

from src.campaign_proposal import crud
from src.campaign_proposal.enums import ProposalStatus
from src.campaign_proposal.models import CampaignProposal
from src.campaign_proposal.schemas import (
    ProposalCampaignSummary,
    ProposalCreate,
    ProposalCreatorSummary,
    ProposalPublic,
)
from src.collaboration import crud as collaboration_crud
from src.conversations.routes import get_or_create_conversation

# NOTE: adjust import path to your influencer profile model
from src.influencer_profile.models import InfluencerProfile
from src.influencer_profile.utils import country_code, profile_followers, profile_handle

router = APIRouter(prefix="/proposals", tags=["campaign_proposals"])


def _proposal_public(proposal: CampaignProposal) -> ProposalPublic:
    creator = None
    if proposal.influencer_profile:
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

    campaign_summary = None
    if proposal.campaign:
        campaign = proposal.campaign
        campaign_summary = ProposalCampaignSummary(
            id=campaign.id,
            title=campaign.title,
            brand_name=campaign.brand_profile.company_name if campaign.brand_profile else "Brand",
            status=campaign.status,
            budget_min=campaign.budget_min,
            budget_max=campaign.budget_max,
        )

    return ProposalPublic(
        id=proposal.id,
        campaign_id=proposal.campaign_id,
        influencer_profile_id=proposal.influencer_profile_id,
        message=proposal.message,
        proposed_budget=proposal.proposed_budget,
        status=proposal.status,
        created_at=proposal.created_at,
        updated_at=proposal.updated_at,
        creator=creator,
        campaign=campaign_summary,
    )


async def _get_my_brand_profile(db: AsyncSession, current_user: CurrentUser) -> BrandProfile:
    if current_user.role != UserRole.BRAND:
        raise HTTPException(status_code=403, detail="Only brand users can do this")
    result = await db.execute(select(BrandProfile).where(BrandProfile.user_id == current_user.id))
    bp = result.scalars().first()
    if not bp:
        raise HTTPException(status_code=400, detail="Create brand profile first")
    return bp


async def _get_my_influencer_profile(db: AsyncSession, current_user: CurrentUser) -> InfluencerProfile:
    if current_user.role != UserRole.INFLUENCER:
        raise HTTPException(status_code=403, detail="Only influencer users can do this")
    result = await db.execute(select(InfluencerProfile).where(InfluencerProfile.user_id == current_user.id))
    ip = result.scalars().first()
    if not ip:
        raise HTTPException(status_code=400, detail="Create influencer profile first")
    return ip


# ---------- Influencer endpoints ----------
@router.post("/campaigns/{campaign_id}", response_model=ProposalPublic, status_code=status.HTTP_201_CREATED)
async def send_proposal(
    campaign_id: int,
    payload: ProposalCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    influencer_profile = await _get_my_influencer_profile(db, current_user)

    campaign = await db.get(Campaign, campaign_id)
    if not campaign or campaign.status != CampaignStatus.PUBLISHED:
        raise HTTPException(status_code=404, detail="Campaign not found")

    existing = await crud.get_by_campaign_and_influencer(db, campaign_id, influencer_profile.id)
    if existing:
        raise HTTPException(status_code=400, detail="You already sent a proposal for this campaign")

    created = await crud.create(db, campaign_id, influencer_profile.id, payload)
    return _proposal_public(created)


@router.get("/me", response_model=List[ProposalPublic])
async def list_my_proposals(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    influencer_profile = await _get_my_influencer_profile(db, current_user)
    proposals = await crud.list_for_influencer(db, influencer_profile.id)
    return [_proposal_public(proposal) for proposal in proposals]


@router.post("/{proposal_id}/withdraw", response_model=ProposalPublic)
async def withdraw_proposal(
    proposal_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    influencer_profile = await _get_my_influencer_profile(db, current_user)

    proposal = await crud.get_by_id(db, proposal_id)
    if not proposal or proposal.influencer_profile_id != influencer_profile.id:
        raise HTTPException(status_code=404, detail="Proposal not found")

    if proposal.status != ProposalStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending proposals can be withdrawn")

    # Simple approach: mark withdrawn (keeps history). Resend will still be blocked by unique.
    # If you want resend, we can DELETE instead.
    withdrawn = await crud.set_status(db, proposal, ProposalStatus.WITHDRAWN)
    return _proposal_public(withdrawn)


# ---------- Brand endpoints ----------
@router.get("/campaigns/{campaign_id}", response_model=List[ProposalPublic])
async def list_campaign_proposals(
    campaign_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    brand_profile = await _get_my_brand_profile(db, current_user)

    campaign = await db.get(Campaign, campaign_id)
    if not campaign or campaign.brand_profile_id != brand_profile.id:
        raise HTTPException(status_code=404, detail="Campaign not found")

    proposals = await crud.list_for_campaign(db, campaign_id)
    return [_proposal_public(proposal) for proposal in proposals]


@router.post("/{proposal_id}/accept", response_model=ProposalPublic)
async def accept_proposal(
    proposal_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    brand_profile = await _get_my_brand_profile(db, current_user)

    proposal = await crud.get_by_id(db, proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    campaign = await db.get(Campaign, proposal.campaign_id)
    if not campaign or campaign.brand_profile_id != brand_profile.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if proposal.status != ProposalStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending proposals can be accepted")

    accepted = await crud.set_status(db, proposal, ProposalStatus.ACCEPTED)
    await get_or_create_conversation(db, campaign, proposal.influencer_profile_id)

    existing_collaboration = await collaboration_crud.get_by_proposal_id(db, proposal.id)
    if not existing_collaboration:
        payout_amount = proposal.proposed_budget if proposal.proposed_budget is not None else campaign.budget_max
        await collaboration_crud.create_for_proposal(db, proposal.id, payout_amount)

    return _proposal_public(accepted)


@router.post("/{proposal_id}/reject", response_model=ProposalPublic)
async def reject_proposal(
    proposal_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    brand_profile = await _get_my_brand_profile(db, current_user)

    proposal = await crud.get_by_id(db, proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    campaign = await db.get(Campaign, proposal.campaign_id)
    if not campaign or campaign.brand_profile_id != brand_profile.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if proposal.status != ProposalStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending proposals can be rejected")

    rejected = await crud.set_status(db, proposal, ProposalStatus.REJECTED)
    return _proposal_public(rejected)
