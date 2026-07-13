from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.campaign.models import Campaign
from src.campaign_proposal.models import CampaignProposal
from src.collaboration.enums import CollaborationState, EscrowStatus, LedgerType
from src.collaboration.models import Collaboration, DeliverableSubmission, LedgerEntry
from src.collaboration.schemas import DeliverableSubmissionCreate
from src.influencer_profile.models import InfluencerProfile

_EAGER_OPTIONS = (
    selectinload(Collaboration.submission),
    selectinload(Collaboration.proposal)
    .selectinload(CampaignProposal.influencer_profile)
    .selectinload(InfluencerProfile.social_accounts),
    selectinload(Collaboration.proposal)
    .selectinload(CampaignProposal.influencer_profile)
    .selectinload(InfluencerProfile.user),
    selectinload(Collaboration.proposal)
    .selectinload(CampaignProposal.campaign)
    .selectinload(Campaign.brand_profile),
)


async def get_by_id(db: AsyncSession, collaboration_id: int) -> Collaboration | None:
    result = await db.execute(
        select(Collaboration)
        .where(Collaboration.id == collaboration_id)
        .options(*_EAGER_OPTIONS)
        .execution_options(populate_existing=True)
    )
    return result.scalars().first()


async def get_by_proposal_id(db: AsyncSession, proposal_id: int) -> Collaboration | None:
    result = await db.execute(
        select(Collaboration).where(Collaboration.proposal_id == proposal_id).options(*_EAGER_OPTIONS)
    )
    return result.scalars().first()


async def create_for_proposal(db: AsyncSession, proposal_id: int, payout_amount: int) -> Collaboration:
    collaboration = Collaboration(
        proposal_id=proposal_id,
        state=CollaborationState.ESCROW_PENDING,
        escrow_status=EscrowStatus.PENDING,
        payout_amount=payout_amount,
    )
    db.add(collaboration)
    await db.commit()
    return await get_by_id(db, collaboration.id)


async def list_for_brand(db: AsyncSession, brand_profile_id: int) -> list[Collaboration]:
    result = await db.execute(
        select(Collaboration)
        .join(CampaignProposal, Collaboration.proposal_id == CampaignProposal.id)
        .join(Campaign, CampaignProposal.campaign_id == Campaign.id)
        .where(Campaign.brand_profile_id == brand_profile_id)
        .options(*_EAGER_OPTIONS)
        .order_by(Collaboration.created_at.desc())
    )
    return list(result.scalars().all())


async def list_for_creator(db: AsyncSession, influencer_profile_id: int) -> list[Collaboration]:
    result = await db.execute(
        select(Collaboration)
        .join(CampaignProposal, Collaboration.proposal_id == CampaignProposal.id)
        .where(CampaignProposal.influencer_profile_id == influencer_profile_id)
        .options(*_EAGER_OPTIONS)
        .order_by(Collaboration.created_at.desc())
    )
    return list(result.scalars().all())


async def deposit_escrow(db: AsyncSession, collaboration: Collaboration, brand_user_id: int) -> Collaboration:
    collaboration.escrow_status = EscrowStatus.HELD
    collaboration.state = CollaborationState.IN_PROGRESS
    db.add(
        LedgerEntry(
            collaboration_id=collaboration.id,
            from_user_id=brand_user_id,
            to_user_id=None,
            type=LedgerType.ESCROW_DEPOSIT,
            amount=collaboration.payout_amount,
        )
    )
    await db.commit()
    return await get_by_id(db, collaboration.id)


async def create_submission(
    db: AsyncSession,
    collaboration: Collaboration,
    data: DeliverableSubmissionCreate,
) -> Collaboration:
    submission = DeliverableSubmission(
        collaboration_id=collaboration.id,
        video_url=data.video_url,
        post_url=data.post_url,
        caption=data.caption,
        notes=data.notes,
        aspect_ratio=data.aspect_ratio,
        duration=data.duration,
        brief_matched=data.brief_matched,
        usage_rights=data.usage_rights,
        no_copyright_music=data.no_copyright_music,
    )
    db.add(submission)
    collaboration.state = CollaborationState.SUBMITTED
    await db.commit()
    return await get_by_id(db, collaboration.id)


async def approve(db: AsyncSession, collaboration: Collaboration, creator_user_id: int) -> Collaboration:
    collaboration.escrow_status = EscrowStatus.RELEASED
    collaboration.state = CollaborationState.APPROVED
    db.add(
        LedgerEntry(
            collaboration_id=collaboration.id,
            from_user_id=None,
            to_user_id=creator_user_id,
            type=LedgerType.PAYOUT_RELEASE,
            amount=collaboration.payout_amount,
        )
    )
    await db.commit()
    return await get_by_id(db, collaboration.id)


async def list_ledger_for_user(db: AsyncSession, user_id: int) -> list[LedgerEntry]:
    result = await db.execute(
        select(LedgerEntry)
        .where((LedgerEntry.from_user_id == user_id) | (LedgerEntry.to_user_id == user_id))
        .order_by(LedgerEntry.created_at.desc())
    )
    return list(result.scalars().all())
