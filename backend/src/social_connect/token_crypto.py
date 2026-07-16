"""Symmetric encryption for OAuth tokens stored at rest.

Every `access_token`/`refresh_token` written to `verified_creator_accounts` passes through
`encrypt()` first, and is only ever `decrypt()`-ed inside the backend when the token is needed to
call a platform API on the creator's behalf. Tokens are NEVER returned through any API response
schema (`ConnectedAccountPublic` deliberately omits them).

Keyed off `settings.TOKEN_ENCRYPTION_KEY` (a `Fernet.generate_key()` output). The Fernet instance
is built lazily, not at import time, so a missing/empty key does not crash app startup - it only
fails loudly the moment an encrypt/decrypt is actually attempted (which only happens inside the
YouTube connect callback, a gated flow). Losing/rotating the key permanently invalidates all
previously stored ciphertext; the accepted recovery is for creators to reconnect.
"""

from __future__ import annotations

from cryptography.fernet import Fernet

from src.config import settings


def _fernet() -> Fernet:
    key = settings.TOKEN_ENCRYPTION_KEY.get_secret_value()
    if not key:
        raise RuntimeError(
            "TOKEN_ENCRYPTION_KEY is not configured - cannot encrypt/decrypt OAuth tokens. "
            "Set it in backend/.env (see .env.example)."
        )
    # Fernet validates the key format (32-byte urlsafe base64) and raises if it is malformed.
    return Fernet(key.encode())


def encrypt(plaintext: str) -> str:
    """Return urlsafe-base64 Fernet ciphertext (text, safe to store in a TEXT column)."""
    return _fernet().encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str:
    """Inverse of `encrypt`. Raises `cryptography.fernet.InvalidToken` if the ciphertext was not
    produced by the current key (e.g. after a key rotation)."""
    return _fernet().decrypt(ciphertext.encode()).decode()
