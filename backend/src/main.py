import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from sqlalchemy import text

from src.database import engine, Base
from src.config import settings

from src.users import router as users_router
from src.brand_profile.routes import router as brand_router
from src.influencer_profile.routes import router as influencer_router
from src.campaign.routes import router as campaign_router
# Import admin.routes here: after User/BrandProfile/InfluencerProfile/Campaign are
# registered (their classes must already exist for the admin_profile/brand_profile/
# influencer_profile forward-ref relationships to resolve), but before
# campaign_proposal.routes - campaign_proposal/crud.py and collaboration/crud.py both
# build selectinload(...) eager-load option tuples at module import time, which forces
# SQLAlchemy to eagerly resolve every pending relationship on every class mapped so far.
from src.admin.routes import router as admin_router
from src.campaign_proposal.routes import router as campaign_proposal_router
from src.google_auth import router as google_auth_router
from src.integrations.youtube.routes import router as youtube_router
from src.marketplace.routes import router as marketplace_router
from src.contact.routes import router as contact_router
from src.conversations.routes import router as conversations_router
from src.collaboration.routes import router as collaboration_router
from src.platform_settings import crud as platform_settings_crud
from src.database import AsyncSessionLocal


async def ensure_sqlite_schema(conn) -> None:
    if engine.url.get_backend_name() != "sqlite":
        return

    result = await conn.execute(text("PRAGMA table_info(users)"))
    user_columns = {row[1] for row in result.fetchall()}
    if "google_sub" not in user_columns:
        await conn.execute(text("ALTER TABLE users ADD COLUMN google_sub VARCHAR(64)"))
        await conn.execute(
            text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_sub ON users (google_sub)")
        )
    if "must_change_password" not in user_columns:
        await conn.execute(
            text("ALTER TABLE users ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT 0")
        )

    result = await conn.execute(text("PRAGMA table_info(brand_profiles)"))
    brand_profile_columns = {row[1] for row in result.fetchall()}
    if "logo_file" not in brand_profile_columns:
        await conn.execute(text("ALTER TABLE brand_profiles ADD COLUMN logo_file VARCHAR(200)"))

    result = await conn.execute(text("PRAGMA table_info(campaigns)"))
    campaign_columns = {row[1] for row in result.fetchall()}
    if "niche" not in campaign_columns:
        await conn.execute(text("ALTER TABLE campaigns ADD COLUMN niche VARCHAR(50)"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_campaigns_niche ON campaigns (niche)"))
    if "country" not in campaign_columns:
        await conn.execute(text("ALTER TABLE campaigns ADD COLUMN country VARCHAR(2)"))
    if "platform" not in campaign_columns:
        await conn.execute(text("ALTER TABLE campaigns ADD COLUMN platform VARCHAR(50)"))
    if "deadline" not in campaign_columns:
        await conn.execute(text("ALTER TABLE campaigns ADD COLUMN deadline DATE"))
    await conn.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER NOT NULL PRIMARY KEY,
                campaign_id INTEGER NOT NULL,
                brand_profile_id INTEGER NOT NULL,
                influencer_profile_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                FOREIGN KEY(campaign_id) REFERENCES campaigns (id) ON DELETE CASCADE,
                FOREIGN KEY(brand_profile_id) REFERENCES brand_profiles (id) ON DELETE CASCADE,
                FOREIGN KEY(influencer_profile_id) REFERENCES influencer_profiles (id) ON DELETE CASCADE,
                CONSTRAINT uq_conversation_campaign_influencer UNIQUE (campaign_id, influencer_profile_id)
            )
            """
        )
    )
    await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_conversations_campaign_id ON conversations (campaign_id)"))
    await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_conversations_brand_profile_id ON conversations (brand_profile_id)"))
    await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_conversations_influencer_profile_id ON conversations (influencer_profile_id)"))
    await conn.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER NOT NULL PRIMARY KEY,
                conversation_id INTEGER NOT NULL,
                sender_user_id INTEGER NOT NULL,
                body TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                FOREIGN KEY(conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
                FOREIGN KEY(sender_user_id) REFERENCES users (id) ON DELETE CASCADE
            )
            """
        )
    )
    await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_messages_conversation_id ON messages (conversation_id)"))
    await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_messages_sender_user_id ON messages (sender_user_id)"))
    result = await conn.execute(text("PRAGMA table_info(conversations)"))
    conversation_columns = {row[1] for row in result.fetchall()}
    if "hidden_for_brand_at" not in conversation_columns:
        await conn.execute(text("ALTER TABLE conversations ADD COLUMN hidden_for_brand_at DATETIME"))
    if "hidden_for_creator_at" not in conversation_columns:
        await conn.execute(text("ALTER TABLE conversations ADD COLUMN hidden_for_creator_at DATETIME"))

    result = await conn.execute(text("PRAGMA table_info(messages)"))
    message_columns = {row[1] for row in result.fetchall()}
    if "deleted_for_sender_at" not in message_columns:
        await conn.execute(text("ALTER TABLE messages ADD COLUMN deleted_for_sender_at DATETIME"))
    if "deleted_for_recipient_at" not in message_columns:
        await conn.execute(text("ALTER TABLE messages ADD COLUMN deleted_for_recipient_at DATETIME"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await ensure_sqlite_schema(conn)
    print("Database tables created")

    async with AsyncSessionLocal() as session:
        await platform_settings_crud.seed_defaults(session)

    yield
    print("Shutting down...")


app = FastAPI(
    title="Nepfluence2.0 API",
    description="API for Nepfluence2.0 Application",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY.get_secret_value(),
)

os.makedirs("media", exist_ok=True)
app.mount("/media", StaticFiles(directory="media"), name="media")

# Routers
app.include_router(google_auth_router, tags=["auth"])
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(brand_router)
app.include_router(influencer_router)
app.include_router(campaign_router)
app.include_router(campaign_proposal_router)
app.include_router(youtube_router)  # ✅ moved here
app.include_router(marketplace_router)
app.include_router(contact_router)
app.include_router(conversations_router)
app.include_router(collaboration_router)
app.include_router(admin_router, tags=["admin"])


@app.get("/")
async def root():
    return {
        "message": "Welcome to Nepfluence2.0 API",
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
