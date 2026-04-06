from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class AuthRefreshToken(Base):
    __tablename__ = "auth_refresh_token"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # FK → user.id
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Store HASHED token (never raw token)
    token_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True
    )

    # Device/session tracking (optional but 🔥 useful)
    user_agent: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )

    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),  # supports IPv6
        nullable=True
    )

    # Expiry
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )

    # Revocation (logout, compromise, etc.)
    revoked: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    revoked_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Rotation tracking (VERY IMPORTANT 🔥)
    replaced_by_token: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # 🔗 Relationship
    user = relationship("User", back_populates="refresh_tokens")