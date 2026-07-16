from __future__ import annotations

from src.influencer_profile.enums import SocialPlatform

from .base import ProviderError, SocialDataProvider, UseCase
from .tikhub import TikHubProvider
from .youtube_official import YouTubeOfficialProvider

# Discovery-tier providers, keyed by platform. TikHub is the only bulk source today for
# Instagram/TikTok discovery (plan §1); YouTube discovery prefers the official Data API v3
# and does not need TikHub. Do NOT add an `verified` mapping to a scraped provider here -
# see plan §5 ("nothing payout-related may depend on TikHub"). Phase 2 will add a separate
# `_VERIFIED_PROVIDERS` map populated only with OAuth-backed providers as they're built.
_DISCOVERY_PROVIDERS: dict[SocialPlatform, type[SocialDataProvider]] = {
    SocialPlatform.instagram: TikHubProvider,
    SocialPlatform.tiktok: TikHubProvider,
    SocialPlatform.youtube: YouTubeOfficialProvider,
}

# Phase 2 (not yet built): OAuth-backed providers for verified/payout-grade data.
# Intentionally empty - any (platform, VERIFIED) lookup raises until a real OAuth provider
# is registered here. This is deliberate, not a TODO to silence.
_VERIFIED_PROVIDERS: dict[SocialPlatform, type[SocialDataProvider]] = {}

_instances: dict[type[SocialDataProvider], SocialDataProvider] = {}


def get_provider(platform: SocialPlatform, use_case: UseCase) -> SocialDataProvider:
    """Resolve the provider for a (platform, use_case) pair.

    This is the single enforcement point for the plan's non-negotiable rule: verified/
    payout-grade lookups can never silently fall through to a scraped provider. Do not add
    a fallback here that bridges VERIFIED to _DISCOVERY_PROVIDERS "just for now" - if a
    verified provider isn't built yet for a platform, the caller must be told that
    explicitly (ProviderError), not served an inaccurate stand-in.
    """
    table = _DISCOVERY_PROVIDERS if use_case == UseCase.DISCOVERY else _VERIFIED_PROVIDERS
    provider_cls = table.get(platform)
    if provider_cls is None:
        raise ProviderError(
            f"no {use_case.value} provider registered for platform {platform.value}"
        )

    if provider_cls not in _instances:
        _instances[provider_cls] = provider_cls()
    return _instances[provider_cls]
