from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from src.platform_settings import crud as settings_crud


@dataclass
class PayoutBreakdown:
    gross_amount: int
    platform_fee_percent: float
    platform_fee_amount: int
    tds_rate_percent: float
    tds_amount: int
    net_payout: int


async def compute_payout_breakdown(db: AsyncSession, gross_amount: int) -> PayoutBreakdown:
    fee_pct = await settings_crud.get_setting_value_float(db, "platform_fee_percent", default=10.0)
    tds_pct = await settings_crud.get_setting_value_float(db, "tds_rate_percent", default=1.5)
    platform_fee_amount = round(gross_amount * fee_pct / 100)
    tds_amount = round(gross_amount * tds_pct / 100)
    return PayoutBreakdown(
        gross_amount=gross_amount,
        platform_fee_percent=fee_pct,
        platform_fee_amount=platform_fee_amount,
        tds_rate_percent=tds_pct,
        tds_amount=tds_amount,
        net_payout=gross_amount - platform_fee_amount - tds_amount,
    )
