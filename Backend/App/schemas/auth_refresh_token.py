from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import Field

from .common import APIModel


class AuthRefreshTokenBase(APIModel):
    user_agent: Optional[str] = Field(default=None, max_length=255)
    ip_address: Optional[str] = Field(default=None, max_length=45)
    expires_at: datetime
    revoked: bool = False
    revoked_at: Optional[datetime] = None
    replaced_by_token: Optional[str] = Field(default=None, max_length=255)


class AuthRefreshTokenCreate(APIModel):
    user_id: UUID
    token_hash: str = Field(min_length=20, max_length=255)
    expires_at: datetime
    user_agent: Optional[str] = Field(default=None, max_length=255)
    ip_address: Optional[str] = Field(default=None, max_length=45)
    # revoked defaults False


class AuthRefreshTokenUpdate(APIModel):
    revoked: Optional[bool] = None
    revoked_at: Optional[datetime] = None
    replaced_by_token: Optional[str] = Field(default=None, max_length=255)


class AuthRefreshTokenRead(APIModel):
    # What you can safely return if you ever list sessions
    id: UUID
    user_id: UUID
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    expires_at: datetime
    revoked: bool
    revoked_at: Optional[datetime] = None
    created_at: datetime