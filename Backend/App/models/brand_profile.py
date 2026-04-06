from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class BrandProfile(Base):
    __tablename__ = "brand_profile"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    company_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    website_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    verified_badge: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

    total_campaigns_run: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    onboarding_status: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="brand_profile")
    
    campaigns: Mapped[List["Campaign"]] = relationship(back_populates="brand", cascade="all, delete-orphan")