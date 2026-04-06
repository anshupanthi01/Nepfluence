from sqlalchemy import create_engine,text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from models.base import Base
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL not found in environment variables. "
        "Please create a .env file with DATABASE_URL"
    )

engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,      # Verify connections before using
        pool_size=10,            # Connection pool size
        max_overflow=20,         # Max connections beyond pool_size
        echo=os.getenv("DEBUG", "False").lower() == "true"
    )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# Base = declarative_base()

def get_db():
    """
    Database session generator for FastAPI dependency injection.
    
    Usage in routes:
        @app.get("/products")
        def get_products(db: Session = Depends(get_db)):
            products = db.query(Product).all()
            return products
            It doesn’t give you the whole database itself —
            it gives you a database session object (Session)
            that acts like a temporary connection to the database
    The session is automatically closed after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Initialize database - create all tables.
    
    This imports all models and creates their tables in the database.
    Safe to call multiple times (won't recreate existing tables).
    """

    from App import models
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")


def drop_db():
    """
    Drop all tables from the database.
    
    ⚠️ WARNING: This will delete ALL data!
    Only use in development/testing.
    """
    Base.metadata.drop_all(bind=engine)
    print("⚠️ All database tables dropped!")

def reset_db():
    """
    Reset database - drop all tables and recreate them.
    
    ⚠️ WARNING: This will delete ALL data!
    Only use in development/testing.
    """
    print("🔄 Resetting database...")
    drop_db()
    init_db()
    print("✅ Database reset complete!")

def test_connection():
    """
    Test database connection.
    
    Returns:
        bool: True if connection successful, False otherwise
    """
    try:
        db = SessionLocal()
        # Execute a simple query
        db.execute(text("SELECT 1"))
        db.close()
        print("✅ Database connection successful!")
        print(f"📊 Database URL: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
    
__all__ = [
    "engine",
    "SessionLocal",
    "Base",
    "get_db",
    "init_db",
    "drop_db",
    "reset_db",
    "test_connection"
] #export all