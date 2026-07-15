from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.admin import permissions
from src.admin.audit import record_audit
from src.admin.deps import require_admin_module
from src.admin.models import AdminProfile
from src.admin.schemas import AdminCampaignDetail, AdminCampaignListItem, AdminCampaignStatusUpdate
from src.campaign import crud as campaign_crud
from src.campaign.enums import CampaignStatus
from src.campaign_proposal.models import CampaignProposal
from src.collaboration.models import Collaboration
from src.database import get_db
from src.shared.pagination import Page

router = APIRouter()


@router.get("/campaigns", response_model=Page[AdminCampaignListItem])
async def list_campaigns(
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[AdminProfile, require_admin_module(permissions.MODULE_CAMPAIGNS)],
    status: CampaignStatus | None = None,
    brand_id: int | None = None,
    q: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    rows, total = await campaign_crud.admin_list_campaigns(
        db, status=status, brand_id=brand_id, q=q, page=page, page_size=page_size
    )
    return Page[AdminCampaignListItem](items=rows, page=page, page_size=page_size, total=total)


@router.get("/campaigns/{campaign_id}", response_model=AdminCampaignDetail)
async def get_campaign(
    campaign_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[AdminProfile, require_admin_module(permissions.MODULE_CAMPAIGNS)],
):
    campaign = await campaign_crud.get_campaign_by_id(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    proposals_count = (
        await db.execute(
            select(func.count()).select_from(CampaignProposal).where(CampaignProposal.campaign_id == campaign_id)
        )
    ).scalar_one()
    collaborations_count = (
        await db.execute(
            select(func.count())
            .select_from(Collaboration)
            .join(CampaignProposal, Collaboration.proposal_id == CampaignProposal.id)
            .where(CampaignProposal.campaign_id == campaign_id)
        )
    ).scalar_one()

    base = AdminCampaignDetail.model_validate(campaign, from_attributes=True)
    return base.model_copy(
        update={"proposals_count": proposals_count, "collaborations_count": collaborations_count}
    )


@router.patch("/campaigns/{campaign_id}/status", response_model=AdminCampaignListItem)
async def set_campaign_status(
    campaign_id: int,
    payload: AdminCampaignStatusUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[AdminProfile, require_admin_module(permissions.MODULE_CAMPAIGNS)],
):
    campaign = await campaign_crud.get_campaign_by_id(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    before = {"status": campaign.status.value}
    campaign.status = payload.status
    await db.commit()
    await db.refresh(campaign)

    await record_audit(
        db,
        actor=admin,
        action="campaign.set_status",
        module=permissions.MODULE_CAMPAIGNS,
        target_type="campaign",
        target_id=campaign.id,
        before=before,
        after={"status": payload.status.value},
        reason=payload.reason,
    )
    return campaign
