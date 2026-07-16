from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.admin import permissions
from src.admin.audit import record_audit
from src.admin.deps import require_admin_module
from src.admin.models import AdminProfile
from src.admin.schemas import (
    AdjustRequest,
    AdminCollaborationDetail,
    AdminCollaborationListItem,
    AdminLedgerEntry,
    PayoutQueueItem,
    ReasonedRequest,
    RefundRequest,
)
from src.collaboration import admin_crud
from src.collaboration.crud import get_by_id
from src.collaboration.enums import CollaborationState, EscrowStatus, LedgerType
from src.collaboration.models import Collaboration
from src.collaboration.payout_math import compute_payout_breakdown
from src.database import get_db
from src.shared.pagination import Page

router = APIRouter()


def _names(collaboration: Collaboration) -> tuple[str, str, str]:
    proposal = collaboration.proposal
    campaign = proposal.campaign if proposal else None
    brand_profile = campaign.brand_profile if campaign else None
    influencer_profile = proposal.influencer_profile if proposal else None

    campaign_title = campaign.title if campaign else "Unknown campaign"
    brand_name = brand_profile.company_name if brand_profile else "Unknown brand"
    creator_name = influencer_profile.full_name if influencer_profile else "Unknown creator"
    return campaign_title, brand_name, creator_name


def _list_item(collaboration: Collaboration) -> AdminCollaborationListItem:
    campaign_title, brand_name, creator_name = _names(collaboration)
    return AdminCollaborationListItem(
        campaign_title=campaign_title,
        brand_name=brand_name,
        creator_name=creator_name,
        id=collaboration.id,
        state=collaboration.state,
        escrow_status=collaboration.escrow_status,
        payout_amount=collaboration.payout_amount,
        created_at=collaboration.created_at,
    )


async def _get_collaboration_or_404(db: AsyncSession, collaboration_id: int) -> Collaboration:
    collaboration = await get_by_id(db, collaboration_id)
    if not collaboration:
        raise HTTPException(status_code=404, detail="Collaboration not found")
    return collaboration


@router.get("/escrow/collaborations", response_model=Page[AdminCollaborationListItem])
async def list_collaborations(
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[AdminProfile, require_admin_module(permissions.MODULE_ESCROW)],
    escrow_status: EscrowStatus | None = None,
    state: CollaborationState | None = None,
    q: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    rows, total = await admin_crud.admin_list_collaborations(
        db, escrow_status=escrow_status, state=state, q=q, page=page, page_size=page_size
    )
    items = [_list_item(row) for row in rows]
    return Page[AdminCollaborationListItem](items=items, page=page, page_size=page_size, total=total)


@router.get("/escrow/collaborations/{collaboration_id}", response_model=AdminCollaborationDetail)
async def get_collaboration(
    collaboration_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[AdminProfile, require_admin_module(permissions.MODULE_ESCROW)],
):
    collaboration = await _get_collaboration_or_404(db, collaboration_id)
    ledger_entries = await admin_crud.get_ledger_for_collaboration(db, collaboration_id)
    breakdown = await compute_payout_breakdown(db, collaboration.payout_amount)

    list_item = _list_item(collaboration)
    return AdminCollaborationDetail(
        **list_item.model_dump(),
        ledger_entries=[AdminLedgerEntry.model_validate(entry, from_attributes=True) for entry in ledger_entries],
        platform_fee_percent=breakdown.platform_fee_percent,
        platform_fee_amount=breakdown.platform_fee_amount,
        tds_rate_percent=breakdown.tds_rate_percent,
        tds_amount=breakdown.tds_amount,
        net_payout=breakdown.net_payout,
    )


@router.get("/escrow/payout-queue", response_model=Page[PayoutQueueItem])
async def payout_queue(
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[AdminProfile, require_admin_module(permissions.MODULE_ESCROW)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    rows, total = await admin_crud.admin_list_collaborations(
        db, escrow_status=EscrowStatus.HELD, page=page, page_size=page_size
    )
    items = []
    for row in rows:
        campaign_title, brand_name, creator_name = _names(row)
        breakdown = await compute_payout_breakdown(db, row.payout_amount)
        items.append(
            PayoutQueueItem(
                collaboration_id=row.id,
                campaign_title=campaign_title,
                brand_name=brand_name,
                creator_name=creator_name,
                gross_amount=breakdown.gross_amount,
                platform_fee_percent=breakdown.platform_fee_percent,
                platform_fee_amount=breakdown.platform_fee_amount,
                tds_rate_percent=breakdown.tds_rate_percent,
                tds_amount=breakdown.tds_amount,
                net_payout=breakdown.net_payout,
            )
        )
    return Page[PayoutQueueItem](items=items, page=page, page_size=page_size, total=total)


@router.post("/escrow/collaborations/{collaboration_id}/pause", response_model=AdminCollaborationListItem)
async def pause_collaboration(
    collaboration_id: int,
    payload: ReasonedRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[AdminProfile, require_admin_module(permissions.MODULE_ESCROW)],
):
    collaboration = await _get_collaboration_or_404(db, collaboration_id)
    if collaboration.state not in (CollaborationState.IN_PROGRESS, CollaborationState.SUBMITTED):
        raise HTTPException(status_code=400, detail="Collaboration cannot be paused from its current state")

    before = {"state": collaboration.state.value}
    updated = await admin_crud.pause(db, collaboration)
    await record_audit(
        db,
        actor=admin,
        action="collaboration.pause",
        module=permissions.MODULE_ESCROW,
        target_type="collaboration",
        target_id=collaboration_id,
        before=before,
        after={"state": updated.state.value},
        reason=payload.reason,
    )
    return _list_item(updated)


@router.post("/escrow/collaborations/{collaboration_id}/resume", response_model=AdminCollaborationListItem)
async def resume_collaboration(
    collaboration_id: int,
    payload: ReasonedRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[AdminProfile, require_admin_module(permissions.MODULE_ESCROW)],
):
    collaboration = await _get_collaboration_or_404(db, collaboration_id)
    if collaboration.state != CollaborationState.PAUSED:
        raise HTTPException(status_code=400, detail="Only a paused collaboration can be resumed")

    before = {"state": collaboration.state.value}
    updated = await admin_crud.resume(db, collaboration)
    await record_audit(
        db,
        actor=admin,
        action="collaboration.resume",
        module=permissions.MODULE_ESCROW,
        target_type="collaboration",
        target_id=collaboration_id,
        before=before,
        after={"state": updated.state.value},
        reason=payload.reason,
    )
    return _list_item(updated)


@router.post("/escrow/collaborations/{collaboration_id}/flag-dispute", response_model=AdminCollaborationListItem)
async def flag_dispute(
    collaboration_id: int,
    payload: ReasonedRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[AdminProfile, require_admin_module(permissions.MODULE_ESCROW)],
):
    collaboration = await _get_collaboration_or_404(db, collaboration_id)
    if collaboration.state in (CollaborationState.CANCELLED,):
        raise HTTPException(status_code=400, detail="Cannot flag a cancelled collaboration for dispute")

    before = {"state": collaboration.state.value}
    updated = await admin_crud.flag_dispute(db, collaboration)
    await record_audit(
        db,
        actor=admin,
        action="collaboration.flag_dispute",
        module=permissions.MODULE_ESCROW,
        target_type="collaboration",
        target_id=collaboration_id,
        before=before,
        after={"state": updated.state.value},
        reason=payload.reason,
    )
    return _list_item(updated)


@router.post("/escrow/collaborations/{collaboration_id}/refund", response_model=AdminCollaborationListItem)
async def refund_collaboration(
    collaboration_id: int,
    payload: RefundRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[AdminProfile, require_admin_module(permissions.MODULE_ESCROW)],
):
    collaboration = await _get_collaboration_or_404(db, collaboration_id)
    if collaboration.escrow_status != EscrowStatus.HELD:
        raise HTTPException(status_code=400, detail="Only escrow that is currently held can be refunded")
    if payload.amount > collaboration.payout_amount:
        raise HTTPException(status_code=400, detail="Refund amount cannot exceed the held payout amount")

    full = payload.amount == collaboration.payout_amount
    before = {"state": collaboration.state.value, "escrow_status": collaboration.escrow_status.value}
    updated = await admin_crud.refund(db, collaboration, amount=payload.amount, full=full)

    await record_audit(
        db,
        actor=admin,
        action="collaboration.refund",
        module=permissions.MODULE_ESCROW,
        target_type="collaboration",
        target_id=collaboration_id,
        before=before,
        after={
            "state": updated.state.value,
            "escrow_status": updated.escrow_status.value,
            "refund_amount": payload.amount,
        },
        reason=payload.reason,
    )
    return _list_item(updated)


@router.post("/escrow/collaborations/{collaboration_id}/adjust", response_model=AdminCollaborationListItem)
async def adjust_collaboration(
    collaboration_id: int,
    payload: AdjustRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[AdminProfile, require_admin_module(permissions.MODULE_ESCROW)],
):
    collaboration = await _get_collaboration_or_404(db, collaboration_id)
    current_balance = await admin_crud.current_adjustment_balance(db, collaboration)

    if payload.type == "debit" and payload.amount > current_balance:
        raise HTTPException(
            status_code=400,
            detail=f"Debit amount cannot exceed the current balance ({current_balance}) after prior adjustments",
        )
    if payload.type == "credit" and payload.amount > collaboration.payout_amount:
        raise HTTPException(
            status_code=400,
            detail="Credit amount cannot exceed the collaboration's original payout amount",
        )

    updated = await admin_crud.adjust(db, collaboration, kind=payload.type, amount=payload.amount)

    balance_after = current_balance + (payload.amount if payload.type == "credit" else -payload.amount)
    await record_audit(
        db,
        actor=admin,
        action="collaboration.adjust",
        module=permissions.MODULE_ESCROW,
        target_type="collaboration",
        target_id=collaboration_id,
        before={"balance_before": current_balance},
        after={"type": payload.type, "amount": payload.amount, "balance_after": balance_after},
        reason=payload.reason,
    )
    return _list_item(updated)
