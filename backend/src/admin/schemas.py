from __future__ import annotations

from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from src.admin.enums import AdminStaffRole
from src.campaign.enums import CampaignStatus
from src.collaboration.enums import CollaborationState, EscrowStatus, LedgerType
from src.users.model import UserRole


class AdminMe(BaseModel):
    staff_role: AdminStaffRole
    allowed_modules: list[str]
    must_change_password: bool


class AdminStaffListItem(BaseModel):
    admin_profile_id: int
    user_id: int
    username: str
    email: str
    staff_role: AdminStaffRole
    is_active: bool
    created_at: datetime

    @classmethod
    def from_profile(cls, profile) -> "AdminStaffListItem":
        return cls(
            admin_profile_id=profile.id,
            user_id=profile.user.id,
            username=profile.user.username,
            email=profile.user.email,
            staff_role=profile.staff_role,
            is_active=profile.user.is_active,
            created_at=profile.created_at,
        )


class AdminStaffCreate(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    email: EmailStr = Field(max_length=120)
    password: str = Field(min_length=8)
    staff_role: AdminStaffRole


class AdminStaffUpdate(BaseModel):
    staff_role: Optional[AdminStaffRole] = None
    is_active: Optional[bool] = None
    reason: str = Field(min_length=1, max_length=500)


class ReasonedStatusUpdate(BaseModel):
    is_active: bool
    reason: str = Field(min_length=1, max_length=500)


class ReasonedRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=500)


# ---------- User & Account Management ----------
class AdminUserListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    role: UserRole
    staff_role: Optional[AdminStaffRole] = None
    is_active: bool
    date_joined: datetime
    last_login: Optional[datetime] = None


class AdminUserDetail(AdminUserListItem):
    profile_type: Optional[Literal["brand", "influencer"]] = None
    profile_summary: Optional[str] = None


# ---------- Campaign Oversight ----------
class AdminCampaignListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    brand_name: str
    status: CampaignStatus
    budget_min: int
    budget_max: int
    niche: Optional[str] = None
    country: Optional[str] = None
    deadline: Optional[date] = None


class AdminCampaignDetail(AdminCampaignListItem):
    description: Optional[str] = None
    platform: Optional[str] = None
    date_posted: datetime
    proposals_count: int = 0
    collaborations_count: int = 0


class AdminCampaignStatusUpdate(BaseModel):
    status: CampaignStatus
    reason: str = Field(min_length=1, max_length=500)


# ---------- Escrow & Payments Console ----------
class AdminCollaborationListItem(BaseModel):
    campaign_title: str
    brand_name: str
    creator_name: str
    id: int
    state: CollaborationState
    escrow_status: EscrowStatus
    payout_amount: int
    created_at: datetime


class AdminLedgerEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: LedgerType
    amount: int
    from_user_id: Optional[int] = None
    to_user_id: Optional[int] = None
    created_at: datetime


class AdminCollaborationDetail(AdminCollaborationListItem):
    ledger_entries: list[AdminLedgerEntry] = []
    platform_fee_percent: float
    platform_fee_amount: int
    tds_rate_percent: float
    tds_amount: int
    net_payout: int


class PayoutQueueItem(BaseModel):
    collaboration_id: int
    campaign_title: str
    brand_name: str
    creator_name: str
    gross_amount: int
    platform_fee_percent: float
    platform_fee_amount: int
    tds_rate_percent: float
    tds_amount: int
    net_payout: int


class RefundRequest(BaseModel):
    amount: int = Field(gt=0)
    reason: str = Field(min_length=1, max_length=500)


class AdjustRequest(BaseModel):
    type: Literal["credit", "debit"]
    amount: int = Field(gt=0)
    reason: str = Field(min_length=1, max_length=500)


# ---------- Audit Log ----------
class AdminAuditLogEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor_username: str
    action: str
    module: str
    target_type: str
    target_id: int
    reason: Optional[str] = None
    before_state: Optional[str] = None
    after_state: Optional[str] = None
    created_at: datetime
