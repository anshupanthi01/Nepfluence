from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.platform_settings.models import PlatformSetting

DEFAULT_SETTINGS: dict[str, tuple[str, str, str]] = {
    # key: (value, value_type, description)
    "platform_fee_percent": ("10.0", "float", "Platform fee taken from each payout, as a percentage."),
    "tds_rate_percent": ("1.5", "float", "Tax Deducted at Source rate applied to each payout, as a percentage."),
}


async def get_setting(db: AsyncSession, key: str) -> PlatformSetting | None:
    result = await db.execute(select(PlatformSetting).where(PlatformSetting.key == key))
    return result.scalars().first()


async def get_setting_value_float(db: AsyncSession, key: str, default: float) -> float:
    setting = await get_setting(db, key)
    if not setting:
        return default
    try:
        return float(setting.value)
    except ValueError:
        return default


async def list_settings(db: AsyncSession) -> list[PlatformSetting]:
    result = await db.execute(select(PlatformSetting).order_by(PlatformSetting.key))
    return list(result.scalars().all())


async def upsert_setting(
    db: AsyncSession,
    *,
    key: str,
    value: str,
    updated_by_admin_id: int | None = None,
) -> PlatformSetting:
    setting = await get_setting(db, key)
    if setting:
        setting.value = value
        setting.updated_by_admin_id = updated_by_admin_id
    else:
        setting = PlatformSetting(key=key, value=value, updated_by_admin_id=updated_by_admin_id)
        db.add(setting)
    await db.commit()
    await db.refresh(setting)
    return setting


async def seed_defaults(db: AsyncSession) -> None:
    for key, (value, value_type, description) in DEFAULT_SETTINGS.items():
        if await get_setting(db, key):
            continue
        db.add(PlatformSetting(key=key, value=value, value_type=value_type, description=description))
    await db.commit()
