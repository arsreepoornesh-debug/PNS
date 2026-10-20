import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base
from app.models.all_models import User, Job, Requirement
from app.api.v1 import auth, jobs, resumes, candidates, shortlists, export, analytics, settings_api

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables with retry logic (essential for cloud deployments where DB may be warming up)
    logger.info("Initializing database tables...")
    from app.core.config import settings as _settings
    _is_sqlite = "sqlite" in _settings.DATABASE_URL

    max_retries = 5
    for attempt in range(1, max_retries + 1):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

                # Auto-migrate missing columns — SQLite only (PostgreSQL handles this via create_all)
                if _is_sqlite:
                    def migrate_columns(sync_conn):
                        try:
                            cols_res = sync_conn.exec_driver_sql("PRAGMA table_info(resume_analyses)").fetchall()
                            existing_cols = {c[1] for c in cols_res}
                            if existing_cols:
                                if "ai_generated_score" not in existing_cols:
                                    sync_conn.exec_driver_sql("ALTER TABLE resume_analyses ADD COLUMN ai_generated_score FLOAT DEFAULT 0.0")
                                if "ai_generated_label" not in existing_cols:
                                    sync_conn.exec_driver_sql("ALTER TABLE resume_analyses ADD COLUMN ai_generated_label VARCHAR(50) DEFAULT 'Human Written'")
                                if "ai_detection_details" not in existing_cols:
                                    sync_conn.exec_driver_sql("ALTER TABLE resume_analyses ADD COLUMN ai_detection_details JSON DEFAULT '{}'")
                        except Exception as e:
                            logger.warning(f"Schema migration check note: {e}")
                    await conn.run_sync(migrate_columns)
            logger.info("Database initialized successfully.")
            break
        except Exception as e:
            logger.warning(f"Database connection attempt {attempt}/{max_retries} failed: {e}")
            if attempt < max_retries:
                import asyncio
                await asyncio.sleep(2)
            else:
                logger.error("Could not complete database initialization after maximum retries. Continuing to allow health checks.")
    yield
    logger.info("Shutting down application...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-quality AI Resume Shortlisting and Job Matching Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Open for dev flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(jobs.router, prefix=settings.API_V1_STR)
app.include_router(resumes.router, prefix=settings.API_V1_STR)
app.include_router(candidates.router, prefix=settings.API_V1_STR)
app.include_router(shortlists.router, prefix=settings.API_V1_STR)
app.include_router(export.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(settings_api.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
