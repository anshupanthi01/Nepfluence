from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.admin import crud as admin_crud
from src.admin import permissions
from src.admin.deps import require_admin_module
from src.admin.models import AdminProfile
from src.admin.schemas import AdminAuditLogEntry
from src.database import get_db
from src.shared.pagination import Page

router = APIRouter()


@router.get("/audit-log", response_model=Page[AdminAuditLogEntry])
async def list_audit_log(
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[AdminProfile, require_admin_module(permissions.MODULE_AUDIT_LOG)],
    module: str | None = None,
    action: str | None = None,
    target_type: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    rows, total = await admin_crud.list_audit_log(
        db, module=module, action=action, target_type=target_type, page=page, page_size=page_size
    )
    return Page[AdminAuditLogEntry](items=rows, page=page, page_size=page_size, total=total)
