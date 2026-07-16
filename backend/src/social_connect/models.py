from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
    Enum as SAEnum,
)
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base
from src.influencer_profile.enums import SocialPlatform


class VerifiedCreatorAccount(Base):
    """The *verified* plane (OAuth, payout-grade) - deliberately separate from
    `social_ingest.models.DiscoveryCreator` (the *scraped* plane). See plan §3/§8: nothing
    payout-related may ever be sourced from the scraped plane, so keeping these as distinct
    tables (not a shared "social account" table with a "verified" flag) makes that boundary
    structural, not just a convention someone could accidentally violate later.

    No `relationship()` to `InfluencerProfile` on either side (deliberately, matching
    `DiscoveryCreator`'s choice in Track 1) - avoids the admin/campaign_proposal eager-load
    import-ordering trap documented in `main.py`, and nothing here needs ORM-level traversal.
    """

    __tablename__ = "verified_creator_accounts"
    __table_args__ = (
        UniqueConstraint("influencer_profile_id", "platform", name="uq_verified_account_profile_platform"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    influencer_profile_id: Mapped[int] = mapped_column(
        ForeignKey("influencer_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    platform: Mapped[SocialPlatform] = mapped_column(
        SAEnum(SocialPlatform, name="verified_account_platform"),
        nullable=False,
        index=True,
    )
    platform_user_id: Mapped[str] = mapped_column(String(200), nullable=False)
    platform_handle: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Fernet ciphertext (base64 urlsafe text), never plaintext - see token_crypto.py.
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    token_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    scopes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    connected_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
