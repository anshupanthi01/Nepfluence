from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.campaign.models import Campaign
from src.campaign_proposal.models import CampaignProposal
from src.collaboration.crud import get_by_id
from src.collaboration.enums import CollaborationState, LedgerType
from src.collaboration.models import Collaboration, LedgerEntry
from src.influencer_profile.models import InfluencerProfile
from src.shared.pagination import paginate_rows

_ADMIN_EAGER_OPTIONS = (
    selectinload(Collaboration.submission),
    selectinload(Collaboration.proposal)
    .selectinload(CampaignProposal.influencer_profile)
    .selectinload(InfluencerProfile.user),
    selectinload(Collaboration.proposal)
    .selectinload(CampaignProposal.campaign)
    .selectinload(Campaign.brand_profile),
)


async def admin_list_collaborations(
    db: AsyncSession,
    *,
    escrow_status=None,
    state=None,
    q: str | None = None,
    page: int = 1,
    page_size: int = 20,
):
    stmt = (
        select(Collaboration)
        .join(CampaignProposal, Collaboration.proposal_id == CampaignProposal.id)
        .join(Campaign, CampaignProposal.campaign_id == Campaign.id)
        .options(*_ADMIN_EAGER_OPTIONS)
        .order_by(Collaboration.created_at.desc())
    )
    if escrow_status is not None:
        stmt = stmt.where(Collaboration.escrow_status == escrow_status)
    if state is not None:
        stmt = stmt.where(Collaboration.state == state)
    if q:
        stmt = stmt.where(Campaign.title.ilike(f"%{q}%"))

    rows, total = await paginate_rows(db, stmt, page, page_size)
    return list(rows), total


async def get_ledger_for_collaboration(db: AsyncSession, collaboration_id: int) -> list[LedgerEntry]:
    result = await db.execute(
        select(LedgerEntry)
        .where(LedgerEntry.collaboration_id == collaboration_id)
        .order_by(LedgerEntry.created_at.asc())
    )
    return list(result.scalars().all())


def _brand_user_id(collaboration: Collaboration) -> int | None:
    campaign = collaboration.proposal.campaign if collaboration.proposal else None
    brand_profile = campaign.brand_profile if campaign else None
    return brand_profile.user_id if brand_profile else None


def _creator_user_id(collaboration: Collaboration) -> int | None:
    influencer_profile = collaboration.proposal.influencer_profile if collaboration.proposal else None
    return influencer_profile.user_id if influencer_profile else None


async def pause(db: AsyncSession, collaboration: Collaboration) -> Collaboration:
    collaboration.state = CollaborationState.PAUSED
    await db.commit()
    return await get_by_id(db, collaboration.id)


async def resume(db: AsyncSession, collaboration: Collaboration) -> Collaboration:
    collaboration.state = CollaborationState.IN_PROGRESS
    await db.commit()
    return await get_by_id(db, collaboration.id)


async def flag_dispute(db: AsyncSession, collaboration: Collaboration) -> Collaboration:
    collaboration.state = CollaborationState.DISPUTED
    await db.commit()
    return await get_by_id(db, collaboration.id)


async def refund(db: AsyncSession, collaboration: Collaboration, *, amount: int, full: bool) -> Collaboration:
    brand_user_id = _brand_user_id(collaboration)
    db.add(
        LedgerEntry(
            collaboration_id=collaboration.id,
            from_user_id=None,
            to_user_id=brand_user_id,
            type=LedgerType.REFUND if full else LedgerType.PARTIAL_REFUND,
            amount=amount,
        )
    )
    if full:
        collaboration.state = CollaborationState.CANCELLED
    await db.commit()
    return await get_by_id(db, collaboration.id)


async def adjust(db: AsyncSession, collaboration: Collaboration, *, kind: str, amount: int) -> Collaboration:
    creator_user_id = _creator_user_id(collaboration)
    if kind == "credit":
        db.add(
            LedgerEntry(
                collaboration_id=collaboration.id,
                from_user_id=None,
                to_user_id=creator_user_id,
                type=LedgerType.ADJUSTMENT_CREDIT,
                amount=amount,
            )
        )
    else:
        db.add(
            LedgerEntry(
                collaboration_id=collaboration.id,
                from_user_id=creator_user_id,
                to_user_id=None,
                type=LedgerType.ADJUSTMENT_DEBIT,
                amount=amount,
            )
        )
    await db.commit()
    return await get_by_id(db, collaboration.id)
