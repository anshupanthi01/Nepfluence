from __future__ import annotations

from fastapi import APIRouter

from src.admin import permissions
from src.admin.deps import CurrentAdmin
from src.admin.routes_audit_log import router as audit_log_router
from src.admin.routes_campaigns import router as campaigns_router
from src.admin.routes_escrow import router as escrow_router
from src.admin.routes_users import router as users_router
from src.admin.schemas import AdminMe

router = APIRouter(prefix="/api/admin")

router.include_router(users_router)
router.include_router(campaigns_router)
router.include_router(escrow_router)
router.include_router(audit_log_router)


@router.get("/me", response_model=AdminMe)
async def get_admin_me(admin: CurrentAdmin):
    return AdminMe(
        staff_role=admin.staff_role,
        allowed_modules=permissions.allowed_modules_for(admin.staff_role),
        must_change_password=admin.user.must_change_password,
    )
