from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from src.influencer_profile.enums import SocialPlatform


class ConnectStartResponse(BaseModel):
    authorize_url: str


class ConnectedAccountPublic(BaseModel):
    """Deliberately excludes access_token/refresh_token/scopes - this is the only schema
    a `VerifiedCreatorAccount` row is ever serialized through for an API response. Do not
    add token fields here even for a "me"-only endpoint; there is no legitimate reason for
    a token to leave the backend once stored."""

    platform: SocialPlatform
    platform_handle: str | None
    connected_at: datetime

    @classmethod
    def from_row(cls, row) -> "ConnectedAccountPublic":
        return cls(
            platform=row.platform,
            platform_handle=row.platform_handle,
            connected_at=row.connected_at,
        )
