from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx

from src.config import settings
from src.influencer_profile.enums import SocialPlatform

from .base import PostStats, ProfileStats, ProviderError, SocialDataProvider

logger = logging.getLogger(__name__)

# Endpoint paths below were pulled from TikHub's live openapi.json (https://api.tikhub.io/
# openapi.json) on 2026-07-16, not guessed - the path/param names are real. TikTok's
# profile+search response SHAPES were additionally verified with live calls against real
# accounts. Instagram's response shapes are still UNVERIFIED: every Instagram endpoint on
# this account returned HTTP 402 "Insufficient balance, this endpoint requires payment and
# does not accept free credit" - the free signup credits don't cover Instagram at all on this
# account. Fund the TikHub account (https://user.tikhub.io/users/add_credit) and re-verify
# Instagram's actual response shape in _parse_instagram_profile/_parse_instagram_search_item
# before trusting Instagram discovery data.
_ENDPOINTS: dict[SocialPlatform, dict[str, str]] = {
    SocialPlatform.instagram: {
        "profile": "/api/v1/instagram/v1/fetch_user_info_by_username",  # param: username
        "posts": "/api/v1/instagram/v3/get_user_posts",  # param: username
        "search": "/api/v1/instagram/v2/search_users",  # param: keyword
    },
    SocialPlatform.tiktok: {
        "profile": "/api/v1/tiktok/web/fetch_user_profile",  # param: uniqueId - VERIFIED shape
        # Posts: both the app/v3 (fetch_user_post_videos) and web (fetch_user_post) endpoints
        # failed on this account (402 paywall / 400 bad-request respectively) - left as the
        # spec-documented path, but get_recent_posts failures are handled as non-fatal by
        # social_ingest/service.py (profile data still gets saved without engagement stats).
        "posts": "/api/v1/tiktok/app/v3/fetch_user_post_videos",  # param: unique_id
        "search": "/api/v1/tiktok/web/fetch_search_user",  # param: keyword - VERIFIED shape
    },
}

_FAKE_VIEW_KEYS = ("is_fake_view", "fake_view", "abnormal_view_flag")


class TikHubProvider(SocialDataProvider):
    """Unofficial/scraped provider (pay-as-you-go, no SLA). Discovery use case ONLY.

    providers/registry.py must never map UseCase.VERIFIED to this class - payout/dispute
    evidence must come from official OAuth APIs (plan §5). This class intentionally does not
    implement anything YouTube; YouTube discovery uses the official Data API v3 instead
    (see youtube_official.py) with TikHub only as a documented fallback if that quota runs
    out - that fallback path is not wired here yet (net-new work if it's needed).
    """

    name = "tikhub"

    def __init__(self, api_key: str | None = None, base_url: str | None = None) -> None:
        resolved_key = api_key if api_key is not None else settings.TIKHUB_API_KEY.get_secret_value()
        self._base_url = base_url or settings.TIKHUB_BASE_URL
        self._client = httpx.AsyncClient(
            base_url=self._base_url,
            headers={"Authorization": f"Bearer {resolved_key}"},
            timeout=httpx.Timeout(10.0, connect=5.0),
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    def supports(self, platform: SocialPlatform) -> bool:
        return platform in _ENDPOINTS

    async def _get(self, path: str, params: dict) -> dict:
        last_error: Exception | None = None
        for attempt in range(3):
            try:
                response = await self._client.get(path, params=params)
                if response.status_code == 429:
                    raise ProviderError(f"tikhub rate limited: {path}")
                if response.status_code == 404:
                    raise ProviderError(f"tikhub not found: {path} params={params}")
                if response.status_code == 402:
                    body = response.json().get("detail", {}).get("message", "")
                    raise ProviderError(f"tikhub insufficient balance for {path}: {body}")
                response.raise_for_status()
                return response.json()
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                last_error = exc
                continue
            except httpx.HTTPStatusError as exc:
                last_error = exc
                if exc.response.status_code >= 500:
                    continue
                raise ProviderError(f"tikhub request failed: {path}: {exc}") from exc
        raise ProviderError(f"tikhub request failed after retries: {path}: {last_error}") from last_error

    async def get_profile(self, platform: SocialPlatform, handle: str) -> ProfileStats:
        if not self.supports(platform):
            raise ProviderError(f"tikhub does not support platform {platform}")
        endpoint = _ENDPOINTS[platform]["profile"]

        if platform == SocialPlatform.tiktok:
            payload = await self._get(endpoint, {"uniqueId": handle})
            return self._parse_tiktok_profile(handle, payload)

        payload = await self._get(endpoint, {"username": handle})
        return self._parse_instagram_profile(handle, payload)

    async def get_recent_posts(
        self, platform: SocialPlatform, handle: str, limit: int = 12
    ) -> list[PostStats]:
        if not self.supports(platform):
            raise ProviderError(f"tikhub does not support platform {platform}")
        endpoint = _ENDPOINTS[platform]["posts"]
        param_key = "unique_id" if platform == SocialPlatform.tiktok else "username"
        payload = await self._get(endpoint, {param_key: handle, "count": limit})
        items = _unwrap_list(payload)
        return [self._parse_post(platform, item) for item in items[:limit]]

    async def search(
        self, platform: SocialPlatform, query: str, limit: int = 10
    ) -> list[ProfileStats]:
        if not self.supports(platform):
            raise ProviderError(f"tikhub does not support platform {platform}")
        endpoint = _ENDPOINTS[platform]["search"]
        payload = await self._get(endpoint, {"keyword": query, "count": limit})

        if platform == SocialPlatform.tiktok:
            return self._parse_tiktok_search(payload, limit)
        return self._parse_instagram_search(payload, limit)

    # --- TikTok: verified against real live responses (2026-07-16) --------------------

    def _parse_tiktok_profile(self, handle: str, payload: dict) -> ProfileStats:
        # data.userInfo.user / data.userInfo.stats - confirmed via a live call.
        data = payload.get("data", {}) if isinstance(payload, dict) else {}
        user_info = data.get("userInfo", {}) if isinstance(data, dict) else {}
        user = user_info.get("user", {}) if isinstance(user_info, dict) else {}
        stats = user_info.get("stats", {}) if isinstance(user_info, dict) else {}

        return ProfileStats(
            platform=SocialPlatform.tiktok,
            handle=user.get("uniqueId") or handle,
            platform_user_id=user.get("id"),
            display_name=user.get("nickname"),
            followers=_to_int(stats.get("followerCount")),
            is_verified_badge=bool(user.get("verified", False)),
            provider=self.name,
            fetched_at=datetime.now(timezone.utc),
            raw={
                "sec_uid": user.get("secUid"),
                "following_count": stats.get("followingCount"),
                "heart": stats.get("heart"),
                "video_count": stats.get("videoCount"),
            },
        )

    def _parse_tiktok_search(self, payload: dict, limit: int) -> list[ProfileStats]:
        # data.user_list[].user_info - confirmed via a live call. Distinct shape (snake_case,
        # different nesting) from the profile-lookup endpoint above - don't merge the parsers.
        data = payload.get("data", {}) if isinstance(payload, dict) else {}
        user_list = data.get("user_list", []) if isinstance(data, dict) else []

        results: list[ProfileStats] = []
        for entry in user_list[:limit]:
            user = entry.get("user_info", {}) if isinstance(entry, dict) else {}
            handle = user.get("unique_id")
            if not handle:
                continue
            is_verified = bool(user.get("custom_verify") or user.get("enterprise_verify_reason"))
            results.append(
                ProfileStats(
                    platform=SocialPlatform.tiktok,
                    handle=handle,
                    platform_user_id=user.get("uid"),
                    display_name=user.get("nickname"),
                    followers=_to_int(user.get("follower_count")),
                    is_verified_badge=is_verified,
                    provider=self.name,
                    fetched_at=datetime.now(timezone.utc),
                    raw={
                        "sec_uid": user.get("sec_uid"),
                        "total_favorited": user.get("total_favorited"),
                    },
                )
            )
        return results

    # --- Instagram: verified against a live account/handle (2026-07-16, funded account) ---
    # Both endpoints wrap Instagram's own API envelope inside TikHub's own "data" envelope,
    # so the real shape is DOUBLE-nested: payload["data"]["data"]["user"|"items"] - not the
    # single-level "data" unwrap used everywhere else in this file. This is an Instagram-
    # specific quirk (TikHub proxying IG's own GraphQL-style response), not a general pattern.

    def _parse_instagram_profile(self, handle: str, payload: dict) -> ProfileStats:
        outer = payload.get("data", {}) if isinstance(payload, dict) else {}
        inner = outer.get("data", {}) if isinstance(outer, dict) else {}
        user = inner.get("user", {}) if isinstance(inner, dict) else {}

        followers = user.get("edge_followed_by")
        if isinstance(followers, dict):
            followers = followers.get("count")

        return ProfileStats(
            platform=SocialPlatform.instagram,
            handle=handle,
            platform_user_id=user.get("id"),
            display_name=user.get("full_name"),
            followers=_to_int(followers),
            is_verified_badge=bool(user.get("is_verified", False)),
            provider=self.name,
            fetched_at=datetime.now(timezone.utc),
            raw={
                "following_count": (user.get("edge_follow") or {}).get("count"),
                "is_private": user.get("is_private"),
                "is_business_account": user.get("is_business_account"),
                "biography": user.get("biography"),
            },
        )

    def _parse_instagram_search(self, payload: dict, limit: int) -> list[ProfileStats]:
        outer = payload.get("data", {}) if isinstance(payload, dict) else {}
        inner = outer.get("data", {}) if isinstance(outer, dict) else {}
        items = inner.get("items", []) if isinstance(inner, dict) else []

        results: list[ProfileStats] = []
        for item in items[:limit]:
            handle = item.get("username")
            if not handle:
                continue
            # Search results don't include a follower count (confirmed live) - only a
            # profile lookup does. Leaving followers=None here is correct, not a parsing
            # gap: fetching per-result profiles to backfill it would multiply the billed
            # requests per search, which the cost-discipline design in service.py avoids.
            results.append(
                ProfileStats(
                    platform=SocialPlatform.instagram,
                    handle=handle,
                    platform_user_id=item.get("id"),
                    display_name=item.get("full_name"),
                    followers=None,
                    is_verified_badge=bool(item.get("is_verified", False)),
                    provider=self.name,
                    fetched_at=datetime.now(timezone.utc),
                    raw=item if isinstance(item, dict) else {},
                )
            )
        return results

    def _parse_post(self, platform: SocialPlatform, item: dict) -> PostStats:
        stats = item.get("statistics", item) if isinstance(item, dict) else {}
        posted_ts = _first_present(item, "create_time", "taken_at", "timestamp")
        posted_at = None
        if posted_ts:
            try:
                posted_at = datetime.fromtimestamp(int(posted_ts), tz=timezone.utc)
            except (ValueError, OverflowError, OSError):
                posted_at = None

        fake_view_flag = any(bool(item.get(key)) for key in _FAKE_VIEW_KEYS)

        return PostStats(
            platform=platform,
            platform_post_id=str(_first_present(item, "aweme_id", "id", "pk") or ""),
            posted_at=posted_at,
            views=_to_int(_first_present(stats, "play_count", "view_count", "video_view_count")),
            likes=_to_int(_first_present(stats, "digg_count", "like_count")),
            comments=_to_int(_first_present(stats, "comment_count")),
            shares=_to_int(_first_present(stats, "share_count")),
            fake_view_flag=fake_view_flag,
        )


def _unwrap_list(payload: dict) -> list[dict]:
    if not isinstance(payload, dict):
        return []
    data = payload.get("data", payload)
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("items", "aweme_list", "posts", "users", "list", "user_list"):
            value = data.get(key)
            if isinstance(value, list):
                return value
    return []


def _first_present(obj: dict, *keys: str):
    if not isinstance(obj, dict):
        return None
    for key in keys:
        if key in obj and obj[key] is not None:
            return obj[key]
    return None


def _to_int(value) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
