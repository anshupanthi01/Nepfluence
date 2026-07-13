from __future__ import annotations

from datetime import date, datetime, UTC
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base
from src.campaign.enums import CampaignStatus

if TYPE_CHECKING:
    from src.brand_profile.models import BrandProfile
    from src.campaign_proposal.models import CampaignProposal

class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    brand_profile_id: Mapped[int] = mapped_column(
        ForeignKey("brand_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    budget_min: Mapped[int] = mapped_column(Integer, nullable=False)
    budget_max: Mapped[int] = mapped_column(Integer, nullable=False)

    niche: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    country: Mapped[Optional[str]] = mapped_column(String(2), nullable=True)
    platform: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    status: Mapped[CampaignStatus] = mapped_column(
        Enum(CampaignStatus),
        nullable=False,
        default=CampaignStatus.DRAFT,
        index=True,
    )
    image_file:Mapped[str|None]=mapped_column(String(200),nullable=True,default=None)
    date_posted: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    brand_profile: Mapped["BrandProfile"] = relationship("BrandProfile",back_populates="posts")
    @property
    def image_path(self)->str:
        if self.image_file:
            return f"/media/brand_post/{self.image_file}"
        return "kei xaina"

    @property
    def brand_name(self) -> str:
        return self.brand_profile.company_name if self.brand_profile else "Brand"
    
    proposals: Mapped[list["CampaignProposal"]] = relationship(
    "CampaignProposal",
    back_populates="campaign",
    cascade="all,delete-orphan",
)