from __future__ import annotations

import json
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from src.admin.models import AdminProfile, AuditLog


async def record_audit(
    db: AsyncSession,
    *,
    actor: AdminProfile,
    action: str,
    module: str,
    target_type: str,
    target_id: int,
    before: dict[str, Any] | None = None,
    after: dict[str, Any] | None = None,
    reason: str | None = None,
) -> AuditLog:
    entry = AuditLog(
        actor_admin_id=actor.id,
        actor_username=actor.user.username,
        action=action,
        module=module,
        target_type=target_type,
        target_id=target_id,
        before_state=json.dumps(before, default=str) if before is not None else None,
        after_state=json.dumps(after, default=str) if after is not None else None,
        reason=reason,
    )
    db.add(entry)
    await db.commit()
    return entry
