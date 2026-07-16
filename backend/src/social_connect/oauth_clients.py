"""Per-platform authlib OAuth client registration for the *verified* social-connect plane.

Mirrors the self-disabling gate pattern in `src/google_auth.py`: each platform has a
`*_configured = bool(<client id> and <client secret>)` flag, and its authlib client is only
registered when configured. `routes.py` checks the flag and returns a clean 503 for any platform
that is not configured, so an unregistered/dormant platform never crashes.

YouTube is buildable today: it reuses the SAME Google OAuth app as login
(`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`) but is registered as a SEPARATE authlib client
instance (`name="google_youtube_analytics"`) with an analytics scope and its own redirect URI, so
login-scope tokens and analytics-scope tokens can never be conflated in code.

Instagram (`meta`) and TikTok (`tiktok`) are dormant: their credentials are intentionally empty in
`.env`, so their `*_configured` flags are False and the registration blocks below never execute.
The registration args for them are best-effort placeholders (never exercised while unconfigured);
they will need to be verified against the real provider docs when the user actually registers apps.
"""

from __future__ import annotations

from dataclasses import dataclass

from src.config import settings

try:
    from authlib.integrations.starlette_client import OAuth
except ModuleNotFoundError:  # pragma: no cover - authlib is a hard dependency, defensive only
    OAuth = None


# YouTube analytics scope: read-only channel data + read-only analytics. `youtube.readonly` lets
# us resolve the connecting user's own channel id (channels.list mine=true); `yt-analytics.readonly`
# is the payout-grade analytics scope (a Google "sensitive" scope - needs consent-screen
# verification beyond ~100 test users, flagged in the plan).
YOUTUBE_SCOPE = (
    "https://www.googleapis.com/auth/yt-analytics.readonly "
    "https://www.googleapis.com/auth/youtube.readonly"
)

google_youtube_configured = bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)
meta_configured = bool(
    settings.META_CLIENT_ID.get_secret_value() and settings.META_CLIENT_SECRET.get_secret_value()
)
tiktok_configured = bool(
    settings.TIKTOK_CLIENT_KEY.get_secret_value()
    and settings.TIKTOK_CLIENT_SECRET.get_secret_value()
)


oauth = OAuth() if OAuth else None

if oauth and google_youtube_configured:
    oauth.register(
        name="google_youtube_analytics",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": YOUTUBE_SCOPE},
    )

if oauth and meta_configured:  # dormant - never runs today (credentials empty)
    oauth.register(
        name="meta",
        client_id=settings.META_CLIENT_ID.get_secret_value(),
        client_secret=settings.META_CLIENT_SECRET.get_secret_value(),
        authorize_url="https://www.facebook.com/v21.0/dialog/oauth",
        access_token_url="https://graph.facebook.com/v21.0/oauth/access_token",
        api_base_url="https://graph.facebook.com/",
        client_kwargs={"scope": "instagram_basic instagram_manage_insights"},
    )

if oauth and tiktok_configured:  # dormant - never runs today (credentials empty)
    oauth.register(
        name="tiktok",
        client_id=settings.TIKTOK_CLIENT_KEY.get_secret_value(),
        client_secret=settings.TIKTOK_CLIENT_SECRET.get_secret_value(),
        authorize_url="https://www.tiktok.com/v2/auth/authorize/",
        access_token_url="https://open.tiktokapis.com/v2/oauth/token/",
        api_base_url="https://open.tiktokapis.com/",
        client_kwargs={"scope": "user.info.basic,video.list"},
    )


@dataclass(frozen=True)
class PlatformOAuth:
    """Resolves a `/social-connect/{platform}` path segment to its authlib client + config."""

    client_name: str
    configured: bool
    redirect_uri: str | None


# Keyed by the `{platform}` path segment. Values map to SocialPlatform enum values
# (instagram/youtube/tiktok). `redirect_uri` is only meaningful for configured platforms; dormant
# ones return 503 before it is ever read.
PLATFORM_CONFIG: dict[str, PlatformOAuth] = {
    "youtube": PlatformOAuth(
        client_name="google_youtube_analytics",
        configured=google_youtube_configured,
        redirect_uri=settings.GOOGLE_YOUTUBE_REDIRECT_URI,
    ),
    "instagram": PlatformOAuth(
        client_name="meta",
        configured=meta_configured,
        redirect_uri=None,
    ),
    "tiktok": PlatformOAuth(
        client_name="tiktok",
        configured=tiktok_configured,
        redirect_uri=None,
    ),
}


def get_platform_oauth(platform: str) -> PlatformOAuth | None:
    """Return the config for a platform path segment, or None if the segment is unknown."""
    return PLATFORM_CONFIG.get(platform)


def get_client(platform_oauth: PlatformOAuth):
    """Return the registered authlib client instance for a configured platform, else None.

    Returns None if authlib is unavailable or the platform's client was never registered (i.e.
    unconfigured) - callers must treat None as "not available" and 503.
    """
    if oauth is None or not platform_oauth.configured:
        return None
    return getattr(oauth, platform_oauth.client_name, None)
