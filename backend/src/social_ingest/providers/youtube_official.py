from __future__ import annotations

from datetime import datetime, timezone

from src.influencer_profile.enums import SocialPlatform
from src.integrations.youtube.service import get_youtube_client

from .base import PostStats, ProfileStats, ProviderError, SocialDataProvider


class YouTubeOfficialProvider(SocialDataProvider):
    """Official YouTube Data API v3 (API-key auth) - reuses
    src.integrations.youtube.service.get_youtube_client so there is one YouTube client, not
    two. Used for the discovery use case; Phase 2's verified provider will need a separate
    OAuth-scoped YouTube Analytics client (channel-owner authorization), which this class
    does not implement - API keys cannot see per-video reach/impressions for a channel you
    don't own.

    Note: the underlying googleapiclient calls are synchronous (`.execute()` blocks the
    event loop) - this matches the existing behavior in integrations/youtube/service.py and
    is not fixed here; flagging it in case it becomes a bottleneck under load.
    """

    name = "youtube_official"

    def supports(self, platform: SocialPlatform) -> bool:
        return platform == SocialPlatform.youtube

    async def get_profile(self, platform: SocialPlatform, handle: str) -> ProfileStats:
        if not self.supports(platform):
            raise ProviderError("youtube_official only supports youtube")

        youtube = get_youtube_client()
        channels_response = (
            youtube.channels()
            .list(part="snippet,statistics", id=handle, maxResults=1)
            .execute()
        )
        items = channels_response.get("items", [])
        if not items:
            raise ProviderError(f"youtube channel not found: {handle}")

        channel = items[0]
        snippet = channel.get("snippet") or {}
        stats = channel.get("statistics") or {}
        subscribers = int(stats.get("subscriberCount", 0) or 0)

        recent_posts = await self.get_recent_posts(platform, handle, limit=12)

        return ProfileStats(
            platform=SocialPlatform.youtube,
            handle=handle,
            platform_user_id=channel.get("id"),
            display_name=snippet.get("title"),
            followers=subscribers,
            is_verified_badge=False,
            provider=self.name,
            fetched_at=datetime.now(timezone.utc),
            raw={
                "total_views": int(stats.get("viewCount", 0) or 0),
                "total_videos": int(stats.get("videoCount", 0) or 0),
                "average_views": _average_views(recent_posts),
                # (likes+comments)/views per post, averaged - see plan §1 YouTube row:
                # this was previously stubbed to None in integrations/youtube/service.py.
                "engagement_rate": _average_engagement_rate(recent_posts),
            },
        )

    async def get_recent_posts(
        self, platform: SocialPlatform, handle: str, limit: int = 12
    ) -> list[PostStats]:
        if not self.supports(platform):
            raise ProviderError("youtube_official only supports youtube")

        youtube = get_youtube_client()
        limit = min(limit, 50)

        search_response = (
            youtube.search()
            .list(channelId=handle, part="id", type="video", order="date", maxResults=limit)
            .execute()
        )
        video_ids = [
            item["id"]["videoId"]
            for item in search_response.get("items", [])
            if item.get("id", {}).get("videoId")
        ]
        if not video_ids:
            return []

        videos_response = (
            youtube.videos().list(part="snippet,statistics", id=",".join(video_ids)).execute()
        )

        posts: list[PostStats] = []
        for item in videos_response.get("items", []):
            stats = item.get("statistics") or {}
            snippet = item.get("snippet") or {}
            posted_at = None
            published = snippet.get("publishedAt")
            if published:
                try:
                    posted_at = datetime.fromisoformat(published.replace("Z", "+00:00"))
                except ValueError:
                    posted_at = None

            posts.append(
                PostStats(
                    platform=SocialPlatform.youtube,
                    platform_post_id=item.get("id", ""),
                    posted_at=posted_at,
                    views=int(stats.get("viewCount", 0) or 0),
                    likes=int(stats.get("likeCount", 0) or 0),
                    comments=int(stats.get("commentCount", 0) or 0),
                    shares=None,
                )
            )
        return posts

    async def search(
        self, platform: SocialPlatform, query: str, limit: int = 10
    ) -> list[ProfileStats]:
        if not self.supports(platform):
            raise ProviderError("youtube_official only supports youtube")

        from src.integrations.youtube.service import search_creators

        results = await search_creators(query, limit=limit)
        return [
            ProfileStats(
                platform=SocialPlatform.youtube,
                handle=result["channel_id"],
                platform_user_id=result["channel_id"],
                display_name=result.get("channel_name"),
                followers=result.get("subscribers"),
                is_verified_badge=False,
                provider=self.name,
                fetched_at=datetime.now(timezone.utc),
                raw=result,
            )
            for result in results
        ]


def _average_views(posts: list[PostStats]) -> int | None:
    views = [post.views for post in posts if post.views is not None]
    if not views:
        return None
    return round(sum(views) / len(views))


def _average_engagement_rate(posts: list[PostStats]) -> float | None:
    rates = []
    for post in posts:
        if not post.views:
            continue
        engagement = (post.likes or 0) + (post.comments or 0)
        rates.append(engagement / post.views * 100)
    if not rates:
        return None
    return round(sum(rates) / len(rates), 2)
