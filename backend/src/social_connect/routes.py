"""Verified social-account "connect" flow (OAuth), prefix `/social-connect`.

Security-sensitive. Design points that make this different from the login OAuth in
`google_auth.py`:

1. A full-page OAuth redirect cannot carry the creator's `Authorization: Bearer <jwt>` header
   across the round trip to the provider and back. Instead, `POST /{platform}/start` (normal
   authenticated request) signs a short-lived `state` (itsdangerous, 10 min) embedding the
   creator's `user_id` + `platform`; the callback verifies+decodes that `state` to re-establish
   *who* is connecting, CSRF-safely (a tampered/forged/expired state is rejected).

2. `state` being unforgeable is NOT enough on its own: without more, an attacker could call
   `/start` themselves (authenticated as the attacker), get back a validly-signed
   `authorize_url`, and trick a VICTIM into completing Google's consent screen with it - the
   callback would then link the victim's real YouTube channel/tokens to the attacker's
   Nepfluence account (a classic OAuth login/account-linking CSRF; state must be bound to the
   browser that started the flow, not just be tamper-proof - RFC 6819 / OAuth Security BCP).
   Fix: `/start` also stores a random, single-use nonce in the caller's browser session
   (`request.session`, via Starlette's `SessionMiddleware` - already installed globally in
   `main.py`) and embeds that SAME nonce inside the signed `state`. `/callback` requires the
   nonce inside `state` to match the nonce in ITS OWN session cookie, then immediately clears it
   (single-use). An attacker's stolen `authorize_url`, completed in a victim's browser, arrives
   at `/callback` carrying the victim's OWN session cookie (not the attacker's) - the victim's
   session never had the attacker's nonce stored in it, so the comparison fails and the
   connection is rejected before any token is ever persisted.
   IMPORTANT operational requirement this depends on: the browser must actually present the same
   session cookie on both legs. That cookie is host-scoped (Starlette's `SessionMiddleware`
   defaults to `domain=None`, i.e. exact-host-only) and `same_site="lax"` (works for
   same-site-but-cross-port requests like `localhost:3000` fetching `localhost:8000`, and for the
   top-level GET redirect Google sends back - but NOT if the frontend calls the backend via a
   *different hostname string* than `GOOGLE_YOUTUBE_REDIRECT_URI`'s host, e.g. `127.0.0.1` vs
   `localhost` - those are different "sites" to the browser even though both resolve to
   loopback). `GOOGLE_YOUTUBE_REDIRECT_URI`'s default was changed to `localhost` (was
   `127.0.0.1`) specifically to match the frontend's default API host
   (`NEXT_PUBLIC_API_URL ?? "http://localhost:8000"`, see `Frontend/lib/api-client.ts`) - keep
   them aligned if either changes. The frontend's fetch to `POST /start` must also send
   `credentials: "include"` or the session cookie set on that response is never stored by the
   browser at all.

3. `GET /{platform}/callback` is a BROWSER redirect target, not a fetch/JSON endpoint. Every
   failure path therefore REDIRECTS to the frontend receiver with `status=error` rather than
   raising a JSON HTTPException (a raw 400 JSON page is broken UX here). No error path ever puts a
   token, code, or state into a response body or log line.
"""

from __future__ import annotations

import logging
import secrets
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from itsdangerous import BadData, URLSafeTimedSerializer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth import CurrentUser
from src.config import settings
from src.database import get_db
from src.influencer_profile import crud as influencer_crud
from src.influencer_profile.enums import SocialPlatform
from src.influencer_profile.models import SocialAccount
from src.integrations.youtube.service import get_channel_stats, get_own_channel
from src.social_connect import crud
from src.social_connect.oauth_clients import get_client, get_platform_oauth
from src.social_connect.schemas import ConnectedAccountPublic, ConnectStartResponse
from src.social_connect.token_crypto import encrypt
from src.users.model import UserRole

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/social-connect", tags=["social_connect"])


class _ChannelLinkError(Exception):
    """A YouTube channel-link failure carrying a stable, non-sensitive reason code.

    Distinguishes the two very different user-facing causes that were previously both
    signalled by returning None (and both rendered as "already connected to a different
    account", which is actively wrong when the real cause was "no channel on this account").
    """

    def __init__(self, reason: str) -> None:
        self.reason = reason
        super().__init__(reason)

# Reuses the app's existing SECRET_KEY (same secret SessionMiddleware is keyed with). The salt
# namespaces these tokens so a `social-connect` state can never be confused with any other
# itsdangerous token signed elsewhere in the app with the same secret.
_state_serializer = URLSafeTimedSerializer(
    settings.SECRET_KEY.get_secret_value(), salt="social-connect"
)

_STATE_MAX_AGE_SECONDS = 600  # 10 minutes


def _session_nonce_key(platform: str) -> str:
    # Namespaced per platform so starting a second platform's connect flow in the same browser
    # (e.g. two tabs) doesn't clobber an in-flight flow for a different platform.
    return f"social_connect_nonce:{platform}"


def _require_influencer_user(current_user: CurrentUser) -> None:
    if current_user.role != UserRole.INFLUENCER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only creator (influencer) accounts can connect social accounts",
        )


def _callback_redirect(platform: str, ok: bool, reason: str | None = None) -> RedirectResponse:
    """Browser redirect back to the frontend social-callback page. Carries only platform/status
    (+ an optional non-sensitive reason code) - never a token, code, or state."""
    url = f"{settings.FRONTEND_URL}/creator/social-callback?platform={platform}"
    url += "&status=success" if ok else "&status=error"
    if not ok and reason:
        url += f"&reason={reason}"
    return RedirectResponse(url, status_code=status.HTTP_302_FOUND)


@router.post("/{platform}/start", response_model=ConnectStartResponse)
async def start_connect(
    platform: str,
    request: Request,
    current_user: CurrentUser,
):
    """Authenticated. Returns an `authorize_url` (already carrying a signed state) for the frontend
    to send the browser to. 503s cleanly if the platform is unknown or not configured.

    Also stores a random single-use nonce in the caller's browser session and embeds it in the
    signed `state` - see the module docstring point 2. This is the browser-binding half of the
    CSRF defense; `/callback` enforces the other half.
    """
    _require_influencer_user(current_user)

    platform_oauth = get_platform_oauth(platform)
    if platform_oauth is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown platform '{platform}'",
        )

    client = get_client(platform_oauth)
    if client is None or platform_oauth.redirect_uri is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                f"Connecting {platform} is not available yet - this platform is not configured "
                "on the server."
            ),
        )

    # Overwrites any nonce from a prior in-flight /start call for this platform in this browser -
    # deliberate: only the most recently issued authorize_url for a given (browser, platform)
    # stays valid, which also caps replay of an older, abandoned authorize_url to zero.
    nonce = secrets.token_urlsafe(32)
    request.session[_session_nonce_key(platform)] = nonce

    state = _state_serializer.dumps(
        {"user_id": current_user.id, "platform": platform, "nonce": nonce}
    )

    # authlib 1.7.2: create_authorization_url(redirect_uri, **kwargs) returns {"url","state",...}
    # and lets us inject our own `state` (unlike authorize_redirect, which mints + session-stores
    # its own). access_type=offline + prompt=consent are required for Google to return a
    # refresh_token; harmless extra params for other providers.
    rv = await client.create_authorization_url(
        platform_oauth.redirect_uri,
        state=state,
        access_type="offline",
        prompt="consent",
    )
    return ConnectStartResponse(authorize_url=rv["url"])


async def _link_youtube_channel(
    db: AsyncSession,
    influencer_profile_id: int,
    access_token: str,
) -> tuple[str, str | None]:
    """YouTube side-effect: resolve the connecting user's own channel, guard the already-claimed
    edge case, then create/update the legacy `SocialAccount` row with verified stats.

    Returns `(channel_id, handle)` on success. Raises `_ChannelLinkError` with a reason code if
    the channel can't be resolved or is already claimed by a DIFFERENT influencer profile;
    nothing is committed on those paths.

    `youtube_channel_id` is NOT NULL UNIQUE across the whole table, so a channel already linked to
    another profile is a hard integrity conflict (potential fraud) - we refuse rather than silently
    reassign it.
    """
    channel = await get_own_channel(access_token)
    if not channel or not channel.get("channel_id"):
        raise _ChannelLinkError("no_channel")

    channel_id = channel["channel_id"]
    handle = channel.get("handle")

    # Conflict check: is this channel already linked to someone else's profile?
    existing_by_channel = (
        await db.execute(
            select(SocialAccount).where(SocialAccount.youtube_channel_id == channel_id)
        )
    ).scalars().first()
    if existing_by_channel is not None and existing_by_channel.influencer_id != influencer_profile_id:
        raise _ChannelLinkError("channel_claimed")

    # Public API-key stats for display (subscribers/views/videos) - purely enrichment for the
    # legacy SocialAccount row. A failure here must NOT abort the connect: the OAuth exchange
    # already succeeded and the channel is resolved, so the authorization itself is valid and
    # worth persisting. This mirrors the same call made for get_recent_posts in
    # social_ingest/service.py - secondary enrichment never discards good primary data.
    # Realistic failure causes: YOUTUBE_API_KEY unset/revoked (build() raises
    # DefaultCredentialsError, not an HTTP error) or the Data API's 10k units/day quota
    # exhausted. Stats then stay null and are refilled by the next successful read.
    stats: dict = {}
    try:
        stats = await get_channel_stats(channel_id)
    except Exception as exc:
        logger.warning(
            "get_channel_stats failed for channel_id=%s (connect still proceeding): %s: %s",
            channel_id,
            type(exc).__name__,
            exc,
        )

    # Reuse the row already tied to this channel, else this profile's existing YouTube row (handles
    # a creator reconnecting a different channel), else create fresh.
    row = existing_by_channel
    if row is None:
        row = (
            await db.execute(
                select(SocialAccount).where(
                    SocialAccount.influencer_id == influencer_profile_id,
                    SocialAccount.platform == SocialPlatform.youtube,
                )
            )
        ).scalars().first()

    if row is None:
        row = SocialAccount(
            influencer_id=influencer_profile_id,
            platform=SocialPlatform.youtube,
            youtube_channel_id=channel_id,
        )
        db.add(row)

    row.youtube_channel_id = channel_id
    row.youtube_handle = handle
    row.youtube_channel_name = stats.get("channel_name")
    row.subscribers_count = stats.get("subscribers")
    row.total_views = stats.get("total_views")
    row.total_videos = stats.get("total_videos")
    row.is_verified = True

    return channel_id, handle


@router.get("/{platform}/callback")
async def connect_callback(
    platform: str,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Browser redirect target. ALWAYS redirects (never JSON) - success or error."""
    platform_oauth = get_platform_oauth(platform)
    if platform_oauth is None:
        return _callback_redirect(platform, ok=False, reason="unknown_platform")

    client = get_client(platform_oauth)
    if client is None or platform_oauth.redirect_uri is None:
        return _callback_redirect(platform, ok=False, reason="not_configured")

    # Provider-reported error (e.g. user denied consent).
    if request.query_params.get("error"):
        return _callback_redirect(platform, ok=False, reason="denied")

    code = request.query_params.get("code")
    state = request.query_params.get("state")
    if not code or not state:
        return _callback_redirect(platform, ok=False, reason="missing_params")

    # Verify + decode the signed state. max_age is ENFORCED here (10 min); BadData covers both
    # tampering (BadSignature) and expiry (SignatureExpired).
    try:
        state_data = _state_serializer.loads(state, max_age=_STATE_MAX_AGE_SECONDS)
    except BadData:
        return _callback_redirect(platform, ok=False, reason="bad_state")

    if not isinstance(state_data, dict) or state_data.get("platform") != platform:
        return _callback_redirect(platform, ok=False, reason="bad_state")
    user_id = state_data.get("user_id")
    if not isinstance(user_id, int):
        return _callback_redirect(platform, ok=False, reason="bad_state")
    state_nonce = state_data.get("nonce")
    if not state_nonce:
        return _callback_redirect(platform, ok=False, reason="bad_state")

    # Browser-binding check (see module docstring point 2): the nonce embedded in `state` must
    # match the nonce stored in THIS BROWSER's session at /start. A stolen authorize_url completed
    # in a different browser (the account-linking CSRF scenario) arrives here with that browser's
    # own session - which never had this nonce - so the comparison fails and nothing is persisted.
    # Popped unconditionally (whether it matches or not) so a session nonce is single-use either way.
    session_key = _session_nonce_key(platform)
    session_nonce = request.session.pop(session_key, None)
    if not session_nonce or not secrets.compare_digest(session_nonce, state_nonce):
        return _callback_redirect(platform, ok=False, reason="session_mismatch")

    # Exchange the authorization code for tokens. redirect_uri must match the one used at start.
    try:
        token = await client.fetch_access_token(
            redirect_uri=platform_oauth.redirect_uri, code=code
        )
    except Exception:
        # Deliberately opaque - never surface provider/token internals to the browser or logs here.
        return _callback_redirect(platform, ok=False, reason="token_exchange_failed")

    access_token = token.get("access_token")
    if not access_token:
        return _callback_redirect(platform, ok=False, reason="token_exchange_failed")

    profile = await influencer_crud.get_by_user_id(db, user_id)
    if profile is None:
        return _callback_redirect(platform, ok=False, reason="no_profile")

    platform_enum = SocialPlatform(platform)

    # Platform-specific side-effects (currently only YouTube is live). Do the channel-claim
    # conflict check BEFORE persisting anything, so a conflict rejects the whole connect atomically.
    platform_user_id: str = ""
    platform_handle: str | None = None
    if platform_enum == SocialPlatform.youtube:
        try:
            platform_user_id, platform_handle = await _link_youtube_channel(
                db, profile.id, access_token
            )
        except _ChannelLinkError as exc:
            await db.rollback()
            return _callback_redirect(platform, ok=False, reason=exc.reason)
        except Exception:
            # Backstop: this endpoint's contract is that it ALWAYS redirects (see module
            # docstring point 3). That guarantee must be structural rather than depend on every
            # callee raising only expected types - e.g. get_channel_stats reaches googleapiclient,
            # which raises DefaultCredentialsError/HttpError, neither of which is an
            # HTTPException, so an uncaught one would render a raw JSON 500 in the user's browser.
            # Traceback only (no locals), so the access_token never reaches the log.
            logger.exception(
                "unexpected failure linking youtube channel for influencer_profile_id=%s",
                profile.id,
            )
            await db.rollback()
            return _callback_redirect(platform, ok=False, reason="link_failed")

    # Encrypt tokens at rest. refresh_token is only present with access_type=offline+prompt=consent.
    access_token_encrypted = encrypt(access_token)
    refresh_token = token.get("refresh_token")
    refresh_token_encrypted = encrypt(refresh_token) if refresh_token else None

    expires_at_ts = token.get("expires_at")
    token_expires_at = (
        datetime.fromtimestamp(expires_at_ts, tz=timezone.utc) if expires_at_ts else None
    )

    await crud.upsert_connection(
        db,
        influencer_profile_id=profile.id,
        platform=platform_enum,
        platform_user_id=platform_user_id,
        platform_handle=platform_handle,
        access_token_encrypted=access_token_encrypted,
        refresh_token_encrypted=refresh_token_encrypted,
        token_expires_at=token_expires_at,
        scopes=token.get("scope"),
    )
    # upsert_connection commits, flushing the SocialAccount changes staged on this same session too.

    return _callback_redirect(platform, ok=True)


@router.get("/me", response_model=list[ConnectedAccountPublic])
async def list_my_connections(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Authenticated, creator-only. Returns connected accounts WITHOUT any token fields."""
    _require_influencer_user(current_user)

    profile = await influencer_crud.get_by_user_id(db, current_user.id)
    if profile is None:
        return []

    rows = await crud.list_for_profile(db, profile.id)
    return [ConnectedAccountPublic.from_row(row) for row in rows]
