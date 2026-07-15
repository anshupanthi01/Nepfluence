from __future__ import annotations

from typing import Generic, Sequence, TypeVar

from pydantic import BaseModel
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: list[T]
    page: int
    page_size: int
    total: int


async def paginate_rows(
    db: AsyncSession,
    stmt: Select,
    page: int,
    page_size: int,
) -> tuple[Sequence, int]:
    """Runs `stmt` (a base SELECT with filters/joins already applied) with
    LIMIT/OFFSET, plus a COUNT(*) over the same filtered subquery.
    Returns (rows, total).
    """
    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (await db.execute(stmt.offset((page - 1) * page_size).limit(page_size))).scalars().all()
    return rows, total
