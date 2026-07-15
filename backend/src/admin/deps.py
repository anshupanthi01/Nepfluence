from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.admin import crud, permissions
from src.admin.models import AdminProfile
from src.auth import CurrentUser
from src.database import get_db
from src.users.model import UserRole


async def get_current_admin(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AdminProfile:
    if current_user.role != UserRole.ADMIN or not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    profile = await crud.get_by_user_id(db, current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No admin profile provisioned for this account",
        )
    return profile


CurrentAdmin = Annotated[AdminProfile, Depends(get_current_admin)]


def require_admin_module(module_name: str):
    async def _dep(admin: CurrentAdmin) -> AdminProfile:
        allowed_roles = permissions.MODULE_PERMISSIONS.get(module_name, set())
        if admin.staff_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{admin.staff_role.value}' is not permitted to access '{module_name}'",
            )
        return admin

    return Depends(_dep)
