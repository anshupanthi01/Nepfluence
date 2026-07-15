from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.admin import crud as staff_crud
from src.admin import permissions
from src.admin.audit import record_audit
from src.admin.deps import require_admin_module
from src.admin.enums import AdminStaffRole
from src.admin.models import AdminProfile
from src.admin.schemas import (
    AdminStaffCreate,
    AdminStaffListItem,
    AdminStaffUpdate,
    AdminUserDetail,
    AdminUserListItem,
    ReasonedStatusUpdate,
)
from src.auth import hash_password
from src.brand_profile.models import BrandProfile
from src.database import get_db
from src.influencer_profile.models import InfluencerProfile
from src.shared.pagination import Page
from src.users import crud as users_crud
from src.users.model import User, UserRole

router = APIRouter()


async def _staff_role_map(db: AsyncSession, user_ids: list[int]) -> dict[int, AdminStaffRole]:
    """Maps user_id -> staff_role for whichever of the given user_ids are staff accounts.

    User.role only says "this account is staff" (coarse); the granular role lives on
    AdminProfile.staff_role. Every place the Users list/detail shows a role for an
    ADMIN-role account must surface staff_role too, or it reads as if User.role were
    the whole story (it's the one field that's NOT what RBAC actually checks).
    """
    if not user_ids:
        return {}
    result = await db.execute(select(AdminProfile).where(AdminProfile.user_id.in_(user_ids)))
    return {profile.user_id: profile.staff_role for profile in result.scalars().all()}


def _to_list_item(user: User, staff_role: AdminStaffRole | None) -> AdminUserListItem:
    base = AdminUserListItem.model_validate(user, from_attributes=True)
    return base.model_copy(update={"staff_role": staff_role})


async def _user_detail(db: AsyncSession, user: User) -> AdminUserDetail:
    profile_type = None
    profile_summary = None
    staff_role = None

    if user.role == UserRole.BRAND:
        result = await db.execute(select(BrandProfile).where(BrandProfile.user_id == user.id))
        brand_profile = result.scalars().first()
        if brand_profile:
            profile_type = "brand"
            profile_summary = brand_profile.company_name
    elif user.role == UserRole.INFLUENCER:
        result = await db.execute(select(InfluencerProfile).where(InfluencerProfile.user_id == user.id))
        influencer_profile = result.scalars().first()
        if influencer_profile:
            profile_type = "influencer"
            profile_summary = influencer_profile.full_name
    elif user.role == UserRole.ADMIN:
        role_map = await _staff_role_map(db, [user.id])
        staff_role = role_map.get(user.id)
        if staff_role:
            profile_summary = f"Staff — {staff_role.value.replace('_', ' ')}"

    base = AdminUserDetail.model_validate(user, from_attributes=True)
    return base.model_copy(
        update={"profile_type": profile_type, "profile_summary": profile_summary, "staff_role": staff_role}
    )


@router.get("/users", response_model=Page[AdminUserListItem])
async def list_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[AdminProfile, require_admin_module(permissions.MODULE_USERS)],
    role: UserRole | None = None,
    is_active: bool | None = None,
    q: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    rows, total = await users_crud.admin_list_users(
        db, role=role, is_active=is_active, q=q, page=page, page_size=page_size
    )
    staff_role_map = await _staff_role_map(db, [u.id for u in rows if u.role == UserRole.ADMIN])
    items = [_to_list_item(u, staff_role_map.get(u.id)) for u in rows]
    return Page[AdminUserListItem](items=items, page=page, page_size=page_size, total=total)


@router.get("/users/{user_id}", response_model=AdminUserDetail)
async def get_user(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[AdminProfile, require_admin_module(permissions.MODULE_USERS)],
):
    user = await users_crud.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return await _user_detail(db, user)


@router.patch("/users/{user_id}/status", response_model=AdminUserListItem)
async def set_user_status(
    user_id: int,
    payload: ReasonedStatusUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[AdminProfile, require_admin_module(permissions.MODULE_USERS)],
):
    user = await users_crud.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    before = {"is_active": user.is_active}
    user.is_active = payload.is_active
    db.add(user)
    await db.commit()
    await db.refresh(user)

    await record_audit(
        db,
        actor=admin,
        action="user.set_active",
        module=permissions.MODULE_USERS,
        target_type="user",
        target_id=user.id,
        before=before,
        after={"is_active": payload.is_active},
        reason=payload.reason,
    )

    staff_role = None
    if user.role == UserRole.ADMIN:
        staff_role_map = await _staff_role_map(db, [user.id])
        staff_role = staff_role_map.get(user.id)
    return _to_list_item(user, staff_role)


@router.get("/staff", response_model=Page[AdminStaffListItem])
async def list_staff(
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[AdminProfile, require_admin_module(permissions.MODULE_STAFF)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    rows, total = await staff_crud.list_staff(db, page=page, page_size=page_size)
    items = [AdminStaffListItem.from_profile(profile) for profile in rows]
    return Page[AdminStaffListItem](items=items, page=page, page_size=page_size, total=total)


@router.post("/staff", response_model=AdminStaffListItem, status_code=status.HTTP_201_CREATED)
async def create_staff(
    payload: AdminStaffCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[AdminProfile, require_admin_module(permissions.MODULE_STAFF)],
):
    if await users_crud.get_by_username(db, payload.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    if await users_crud.get_by_email(db, payload.email):
        raise HTTPException(status_code=400, detail="Email already exists")

    profile = await staff_crud.create_staff(
        db,
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        staff_role=payload.staff_role,
        created_by_admin_id=admin.id,
    )

    await record_audit(
        db,
        actor=admin,
        action="staff.create",
        module=permissions.MODULE_STAFF,
        target_type="admin_profile",
        target_id=profile.id,
        after={"username": payload.username, "email": payload.email, "staff_role": payload.staff_role.value},
    )
    return AdminStaffListItem.from_profile(profile)


@router.patch("/staff/{admin_profile_id}", response_model=AdminStaffListItem)
async def update_staff(
    admin_profile_id: int,
    payload: AdminStaffUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[AdminProfile, require_admin_module(permissions.MODULE_STAFF)],
):
    profile = await staff_crud.get_by_id(db, admin_profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Staff account not found")

    demoting_or_deactivating = (
        payload.staff_role is not None and payload.staff_role != profile.staff_role
    ) or (payload.is_active is not None and payload.is_active is False)
    if demoting_or_deactivating and profile.staff_role.value == "super_admin":
        active_super_admins = await staff_crud.count_active_super_admins(db)
        if active_super_admins <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot demote or deactivate the last active Super Admin",
            )

    before = {"staff_role": profile.staff_role.value, "is_active": profile.user.is_active}
    updated = await staff_crud.update_staff(
        db, profile, staff_role=payload.staff_role, is_active=payload.is_active
    )

    await record_audit(
        db,
        actor=admin,
        action="staff.update",
        module=permissions.MODULE_STAFF,
        target_type="admin_profile",
        target_id=updated.id,
        before=before,
        after={"staff_role": updated.staff_role.value, "is_active": updated.user.is_active},
        reason=payload.reason,
    )
    return AdminStaffListItem.from_profile(updated)
