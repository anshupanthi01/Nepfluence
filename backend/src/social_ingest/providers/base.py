from __future__ import annotations

import enum
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime

from src.influencer_profile.enums import SocialPlatform


class UseCase(str, enum.Enum):
    """Which of the two architecturally separate data planes a lookup is for.

    DISCOVERY: bulk, scraped, "good enough" - for creators who haven't onboarded.
    VERIFIED: OAuth-authorized, payout-grade - for justifying campaign payouts.

    providers/registry.py enforces that VERIFIED never resolves to a scraped provider
    (TikHub/ScrapeCreators) - see plan §5, "nothing payout-related may depend on TikHub".
    """

    DISCOVERY = "discovery"
    VERIFIED = "verified"


@dataclass
class ProfileStats:
    """Normalized creator profile shape, provider-agnostic."""

    platform: SocialPlatform
    handle: str
    platform_user_id: str | None
    display_name: str | None
    followers: int | None
    is_verified_badge: bool
    provider: str
    fetched_at: datetime
    # Provider-specific extras not yet promoted to a normalized field (e.g. average_views,
    # engagement_rate, total_views, total_videos, fake_view_flag). Consumers should read
    # well-known keys defensively; not every provider populates every key.
    raw: dict = field(default_factory=dict)


@dataclass
class PostStats:
    """Normalized single-post/video shape, provider-agnostic."""

    platform: SocialPlatform
    platform_post_id: str
    posted_at: datetime | None
    views: int | None
    likes: int | None
    comments: int | None
    shares: int | None
    fake_view_flag: bool = False


class ProviderError(Exception):
    """Raised when a provider call fails (network, rate limit, not found, bad response)."""


class SocialDataProvider(ABC):
    """Common interface every social data source implements.

    This is the seam that makes the TikHub-vs-alternative accuracy comparison (plan §2)
    possible, and the seam that keeps `verified` from ever silently resolving to a scraped
    provider (plan §5) - both the accuracy harness and providers/registry.py depend on every
    provider speaking this exact interface.
    """

    name: str

    @abstractmethod
    def supports(self, platform: SocialPlatform) -> bool:
        ...

    @abstractmethod
    async def get_profile(self, platform: SocialPlatform, handle: str) -> ProfileStats:
        ...

    @abstractmethod
    async def get_recent_posts(
        self, platform: SocialPlatform, handle: str, limit: int = 12
    ) -> list[PostStats]:
        ...

    @abstractmethod
    async def search(
        self, platform: SocialPlatform, query: str, limit: int = 10
    ) -> list[ProfileStats]:
        ...
