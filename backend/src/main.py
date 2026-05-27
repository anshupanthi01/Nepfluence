from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text
from src.database import engine, Base
from src.config import settings
from src.users import router
from src.brand_profile.routes import router as brand_router
# src/influencer_profile/__init__.py
from src.influencer_profile.routes import router as influencer_router
from src.campaign.routes import router as campaign_router
from src.campaign_proposal.routes import router as campaign_proposal_router

from src.google_auth import router as google_auth_router


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


# Create database tables on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await ensure_sqlite_schema(conn)
    print("Database tables created")
    yield
    # Shutdown
    print("Shutting down...")

# Initialize FastAPI app
app = FastAPI(
    title="Nepfluence2.0 API",
    description="API for Nepfluence2.0 Application",
    version="0.1.0",
    lifespan=lifespan
)

# Configure CORS (for frontend/development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY.get_secret_value(),
)

# Include user router
app.include_router(google_auth_router)
app.include_router(router,prefix="/api/users", tags=["users"])
app.include_router(brand_router)
app.include_router(influencer_router) 
app.include_router(campaign_router)
app.include_router(campaign_proposal_router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to Nepfluence2.0 API",
        "docs": "/docs",
        "redoc": "/redoc"
    }

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
