from __future__ import annotations

from datetime import datetime, timezone

import httpx

from src.config import settings
from src.influencer_profile.enums import SocialPlatform

from .base import PostStats, ProfileStats, ProviderError, SocialDataProvider

# Grounded against docs.scrapecreators.com (fetched during planning). Auth via `x-api-key`
# header, base URL https://api.scrapecreators.com. Verify field names in _parse_profile /
# _parse_post against a live response before trusting harness numbers - the docs summary
# used to write this did not enumerate exact response field names.
_BASE_URL = "https://api.scrapecreators.com"

_ENDPOINTS: dict[SocialPlatform, dict[str, str]] = {
    SocialPlatform.instagram: {
        "profile": "/v1/instagram/profile",
        "posts": "/v2/instagram/user/posts",
    },
    SocialPlatform.tiktok: {
        "profile": "/v1/tiktok/profile",
        "posts": "/v3/tiktok/profile/videos",
    },
}


class ScrapeCreatorsProvider(SocialDataProvider):
    """Harness-only alternative to TikHub, used solely for the Phase 0 side-by-side
    accuracy comparison (plan §2). Not wired into providers/registry.py for production
    traffic - promote it there only if the accuracy harness prefers it over TikHub.
    """

    name = "scrapecreators"

    def __init__(self, api_key: str | None = None) -> None:
        resolved_key = (
            api_key if api_key is not None else settings.SCRAPECREATORS_API_KEY.get_secret_value()
        )
        self._client = httpx.AsyncClient(
            base_url=_BASE_URL,
            headers={"x-api-key": resolved_key},
            timeout=httpx.Timeout(10.0, connect=5.0),
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    def supports(self, platform: SocialPlatform) -> bool:
        return platform in _ENDPOINTS

    async def _get(self, path: str, params: dict) -> dict:
        try:
            response = await self._client.get(path, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as exc:
            raise ProviderError(f"scrapecreators request failed: {path}: {exc}") from exc

    async def get_profile(self, platform: SocialPlatform, handle: str) -> ProfileStats:
        if not self.supports(platform):
            raise ProviderError(f"scrapecreators does not support platform {platform}")
        payload = await self._get(_ENDPOINTS[platform]["profile"], {"handle": handle})
        data = payload.get("data", payload) if isinstance(payload, dict) else {}

        followers = data.get("followers") or data.get("follower_count") or data.get("followersCount")

        return ProfileStats(
            platform=platform,
            handle=handle,
            platform_user_id=data.get("id") or data.get("user_id"),
            display_name=data.get("full_name") or data.get("nickname") or data.get("display_name"),
            followers=int(followers) if followers is not None else None,
            is_verified_badge=bool(data.get("is_verified") or data.get("verified") or False),
            provider=self.name,
            fetched_at=datetime.now(timezone.utc),
            raw=data if isinstance(data, dict) else {},
        )

    async def get_recent_posts(
        self, platform: SocialPlatform, handle: str, limit: int = 12
    ) -> list[PostStats]:
        if not self.supports(platform):
            raise ProviderError(f"scrapecreators does not support platform {platform}")
        payload = await self._get(_ENDPOINTS[platform]["posts"], {"handle": handle})
        data = payload.get("data", payload) if isinstance(payload, dict) else {}
        items = data if isinstance(data, list) else data.get("items", []) or data.get("posts", [])

        posts: list[PostStats] = []
        for item in items[:limit]:
            posts.append(
                PostStats(
                    platform=platform,
                    platform_post_id=str(item.get("id") or item.get("pk") or ""),
                    posted_at=_parse_timestamp(item.get("timestamp") or item.get("create_time")),
                    views=_to_int(item.get("views") or item.get("play_count") or item.get("video_view_count")),
                    likes=_to_int(item.get("likes") or item.get("like_count") or item.get("digg_count")),
                    comments=_to_int(item.get("comments") or item.get("comment_count")),
                    shares=_to_int(item.get("shares") or item.get("share_count")),
                )
            )
        return posts

    async def search(
        self, platform: SocialPlatform, query: str, limit: int = 10
    ) -> list[ProfileStats]:
        # ScrapeCreators is used in the harness only for known-handle lookups, not search.
        raise ProviderError("scrapecreators provider does not implement search (harness-only)")


def _parse_timestamp(value) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromtimestamp(int(value), tz=timezone.utc)
    except (ValueError, TypeError, OverflowError, OSError):
        return None


def _to_int(value) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
