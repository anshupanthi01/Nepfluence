from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import AnyUrl, Field

from .common import APIModel
from models.enums import SubmissionStatus  # adjust import path if needed


class CampaignSubmissionBase(APIModel):
    submission_url: AnyUrl
    url_valid: Optional[bool] = None


class CampaignSubmissionCreate(CampaignSubmissionBase):
    application_id: UUID
    deliverable_id: UUID
    # revision_number/status/submitted_at are server-managed


class CampaignSubmissionUpdate(APIModel):
    # brand/admin review fields
    url_valid: Optional[bool] = None
    status: Optional[SubmissionStatus] = None
    brand_reviewed_at: Optional[datetime] = None
    auto_released_at: Optional[datetime] = None


class CampaignSubmissionRead(CampaignSubmissionBase):
    id: UUID
    application_id: UUID
    deliverable_id: UUID

    revision_number: int
    status: SubmissionStatus

    brand_reviewed_at: Optional[datetime] = None
    auto_released_at: Optional[datetime] = None
    submitted_at: datetime