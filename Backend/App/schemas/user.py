from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import EmailStr, Field, model_validator

from .common import APIModel
from models.enums import UserRole  # adjust import if your package path differs


class UserBase(APIModel):
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(default=None, min_length=6, max_length=30)
    role: UserRole
    country: Optional[str] = Field(default=None, max_length=100)


class UserCreate(UserBase):
    # client sends plain password; server hashes it into password_hash
    password: str = Field(min_length=8, max_length=128)

    @model_validator(mode="after")
    def check_email_or_phone(self):
        if not self.email and not self.phone_number:
            raise ValueError("Either email or phone_number must be provided")
        return self


class UserUpdate(APIModel):
    # PATCH: everything optional
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(default=None, min_length=6, max_length=30)
    country: Optional[str] = Field(default=None, max_length=100)

    # Depending on your product rules, role/is_active might be admin-only.
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

    @model_validator(mode="after")
    def check_email_or_phone_not_both_missing(self):
        # If client tries to set both explicitly to null => invalid (would violate DB constraint)
        if self.email is None and self.phone_number is None:
            # Note: This triggers even when client sends empty body.
            # If you want to allow empty patch bodies, tell me and I’ll adjust this logic.
            raise ValueError("At least one of email or phone_number must be present (cannot null both)")
        return self


class UserRead(APIModel):
    id: UUID
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None

    role: UserRole
    is_active: bool
    is_verified_phone: bool
    is_verified_email: bool

    date_joined: datetime
    last_login: Optional[datetime] = None
    country: Optional[str] = None
    updated_at: datetime


# Optional internal schema (never return to client)
class UserInDB(UserRead):
    password_hash: Optional[str] = None