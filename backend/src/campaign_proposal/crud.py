from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.campaign.models import Campaign
from src.campaign_proposal.models import CampaignProposal
from src.campaign_proposal.schemas import ProposalCreate
from src.campaign_proposal.enums import ProposalStatus
from src.influencer_profile.models import InfluencerProfile

_EAGER_OPTIONS = (
    selectinload(CampaignProposal.influencer_profile).selectinload(InfluencerProfile.social_accounts),
    selectinload(CampaignProposal.influencer_profile).selectinload(InfluencerProfile.user),
    selectinload(CampaignProposal.campaign).selectinload(Campaign.brand_profile),
)


async def get_by_id(db: AsyncSession, proposal_id: int) -> CampaignProposal | None:
    result = await db.execute(
        select(CampaignProposal).where(CampaignProposal.id == proposal_id).options(*_EAGER_OPTIONS)
    )
    return result.scalars().first()


async def get_by_campaign_and_influencer(
    db: AsyncSession,
    campaign_id: int,
    influencer_profile_id: int,
) -> CampaignProposal | None:
    result = await db.execute(
        select(CampaignProposal).where(
            CampaignProposal.campaign_id == campaign_id,
            CampaignProposal.influencer_profile_id == influencer_profile_id,
        )
    )
    return result.scalars().first()


async def list_for_campaign(db: AsyncSession, campaign_id: int) -> list[CampaignProposal]:
    result = await db.execute(
        select(CampaignProposal)
        .where(CampaignProposal.campaign_id == campaign_id)
        .options(*_EAGER_OPTIONS)
        .order_by(CampaignProposal.created_at.desc())
    )
    return list(result.scalars().all())


async def list_for_influencer(db: AsyncSession, influencer_profile_id: int) -> list[CampaignProposal]:
    result = await db.execute(
        select(CampaignProposal)
        .where(CampaignProposal.influencer_profile_id == influencer_profile_id)
        .options(*_EAGER_OPTIONS)
        .order_by(CampaignProposal.created_at.desc())
    )
    return list(result.scalars().all())


async def create(
    db: AsyncSession,
    campaign_id: int,
    influencer_profile_id: int,
    data: ProposalCreate,
) -> CampaignProposal:
    proposal = CampaignProposal(
        campaign_id=campaign_id,
        influencer_profile_id=influencer_profile_id,
        message=data.message,
        proposed_budget=data.proposed_budget,
        status=ProposalStatus.PENDING,
    )
    db.add(proposal)
    await db.commit()
    await db.refresh(proposal)
    return await get_by_id(db, proposal.id)


async def set_status(
    db: AsyncSession,
    proposal: CampaignProposal,
    status: ProposalStatus,
) -> CampaignProposal:
    proposal.status = status
    await db.commit()
    await db.refresh(proposal)
    return await get_by_id(db, proposal.id)


async def delete(db: AsyncSession, proposal: CampaignProposal) -> None:
    await db.delete(proposal)
    await db.commit()