from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.admin.enums import AdminStaffRole
from src.admin.models import AdminProfile, AuditLog
from src.users.model import User, UserRole


async def get_by_user_id(db: AsyncSession, user_id: int) -> AdminProfile | None:
    result = await db.execute(
        select(AdminProfile)
        .where(AdminProfile.user_id == user_id)
        .options(selectinload(AdminProfile.user))
    )
    return result.scalars().first()


async def get_by_id(db: AsyncSession, admin_profile_id: int) -> AdminProfile | None:
    result = await db.execute(
        select(AdminProfile)
        .where(AdminProfile.id == admin_profile_id)
        .options(selectinload(AdminProfile.user))
    )
    return result.scalars().first()


async def list_staff(
    db: AsyncSession, *, page: int = 1, page_size: int = 20
) -> tuple[list[AdminProfile], int]:
    from src.shared.pagination import paginate_rows

    stmt = select(AdminProfile).options(selectinload(AdminProfile.user)).order_by(AdminProfile.id)
    rows, total = await paginate_rows(db, stmt, page, page_size)
    return list(rows), total


async def count_active_super_admins(db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count())
        .select_from(AdminProfile)
        .join(User, AdminProfile.user_id == User.id)
        .where(AdminProfile.staff_role == AdminStaffRole.SUPER_ADMIN, User.is_active.is_(True))
    )
    return result.scalar_one()


async def create_staff(
    db: AsyncSession,
    *,
    username: str,
    email: str,
    password_hash: str,
    staff_role: AdminStaffRole,
    created_by_admin_id: int | None,
) -> AdminProfile:
    user = User(
        username=username,
        email=email.lower(),
        password_hash=password_hash,
        role=UserRole.ADMIN,
        is_active=True,
        must_change_password=True,
    )
    db.add(user)
    await db.flush()

    profile = AdminProfile(
        user_id=user.id,
        staff_role=staff_role,
        created_by_admin_id=created_by_admin_id,
    )
    db.add(profile)
    await db.commit()
    return await get_by_user_id(db, user.id)


async def update_staff(
    db: AsyncSession,
    profile: AdminProfile,
    *,
    staff_role: AdminStaffRole | None = None,
    is_active: bool | None = None,
) -> AdminProfile:
    if staff_role is not None:
        profile.staff_role = staff_role
    if is_active is not None:
        profile.user.is_active = is_active
    await db.commit()
    return await get_by_id(db, profile.id)


async def list_audit_log(
    db: AsyncSession,
    *,
    module: str | None = None,
    action: str | None = None,
    target_type: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[AuditLog], int]:
    from src.shared.pagination import paginate_rows

    stmt = select(AuditLog).order_by(AuditLog.id.desc())
    if module is not None:
        stmt = stmt.where(AuditLog.module == module)
    if action is not None:
        stmt = stmt.where(AuditLog.action == action)
    if target_type is not None:
        stmt = stmt.where(AuditLog.target_type == target_type)

    rows, total = await paginate_rows(db, stmt, page, page_size)
    return list(rows), total
