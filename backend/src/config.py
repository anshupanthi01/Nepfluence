from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )

    # JWT Settings
    SECRET_KEY: SecretStr = SecretStr("change-this-local-dev-secret-at-least-32-bytes")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    DATABASE_URL: str = "sqlite+aiosqlite:///./nepfluence.db"

    YOUTUBE_API_KEY: str = ""
    
    # File Upload
    MAX_UPLOAD_SIZE_BYTES: int = 5 * 1024 * 1024
    
    # Pagination
    POSTS_PER_PAGE: int = 10
    
    # Password Reset
    RESET_TOKEN_EXPIRE_MIN: int = 60
    
    # Email Settings (Mailtrap)
    MAIL_SERVER: str = "sandbox.smtp.mailtrap.io"
    MAIL_PORT: int = 2525
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: SecretStr = SecretStr("")
    MAIL_FROM: str = "noreply@nepfluence.com"
    MAIL_USE_TLS: bool = True

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://127.0.0.1:8000/auth/google/callback"

    # Frontend URL
    FRONTEND_URL: str = "http://localhost:3000"

    # Social connect (verified OAuth plane - see social_connect/). Fernet key used to encrypt
    # OAuth access/refresh tokens at rest; losing it permanently invalidates all stored tokens
    # (acceptable - creators just reconnect). Generate with:
    #   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    TOKEN_ENCRYPTION_KEY: SecretStr = SecretStr("")

    # YouTube "connect your account" flow reuses the same Google OAuth client as login
    # (GOOGLE_CLIENT_ID/SECRET) but with an analytics scope + this dedicated callback path.
    # This exact URI must be added to the OAuth client's Authorized redirect URIs in Google Cloud.
    # Host is deliberately "localhost" (NOT "127.0.0.1" like GOOGLE_REDIRECT_URI) - the
    # /social-connect/{platform}/start->callback flow binds `state` to a session cookie, which is
    # host-scoped; it must match the frontend's default API host
    # (NEXT_PUBLIC_API_URL ?? "http://localhost:8000") or the cookie set during /start won't be
    # sent back on the callback redirect. Keep this in sync if either default ever changes.
    GOOGLE_YOUTUBE_REDIRECT_URI: str = "http://localhost:8000/social-connect/youtube/callback"

    # Instagram (Meta) and TikTok connect clients - dormant until the user registers developer
    # apps. Left empty so the *_configured gate in social_connect/oauth_clients.py stays False and
    # those platforms return a clean 503 instead of erroring.
    META_CLIENT_ID: SecretStr = SecretStr("")
    META_CLIENT_SECRET: SecretStr = SecretStr("")
    TIKTOK_CLIENT_KEY: SecretStr = SecretStr("")
    TIKTOK_CLIENT_SECRET: SecretStr = SecretStr("")

    # Escrow.com sandbox (Phase C real-escrow integration is paused; not used by any code
    # path today, kept here so .env can hold the credentials without breaking startup)
    ESCROW_API_EMAIL: str = ""
    ESCROW_API_KEY: SecretStr = SecretStr("")
    ESCROW_BASE_URL: str = ""

    # Social discovery ingestion (TikHub for Instagram/TikTok discovery-tier data only;
    # never used for verified/payout-grade analytics - see social_ingest/providers/registry.py)
    TIKHUB_API_KEY: SecretStr = SecretStr("")
    TIKHUB_BASE_URL: str = "https://api.tikhub.io"
    SCRAPECREATORS_API_KEY: SecretStr = SecretStr("")
    REDIS_URL: str = "redis://localhost:6379/0"
    DISCOVERY_DAILY_REQUEST_BUDGET: int = 500

settings = Settings()
