from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from src.database import engine, Base
from src.users import router
from src.brand_profile.routes import router as brand_router

# Create database tables on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created")
    yield
    # Shutdown
    print("🔄 Shutting down...")

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

# Include user router
app.include_router(router,prefix="/api/users", tags=["users"])
app.include_router(brand_router)

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