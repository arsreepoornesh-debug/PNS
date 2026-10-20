from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.config import settings

_is_sqlite = "sqlite" in settings.DATABASE_URL
_is_postgres = (
    "postgresql" in settings.DATABASE_URL
    or "postgres" in settings.DATABASE_URL
    or "asyncpg" in settings.DATABASE_URL
)

# Build engine kwargs based on the database backend
_engine_kwargs: dict = {"echo": False, "future": True}

if _is_sqlite:
    # SQLite requires check_same_thread=False for async usage
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
elif _is_postgres:
    # Cloud PostgreSQL (Render / Supabase) — keep the pool resilient
    _engine_kwargs["pool_size"] = 5
    _engine_kwargs["max_overflow"] = 2
    _engine_kwargs["pool_pre_ping"] = True

# Fallback normalization just in case
_db_url = settings.DATABASE_URL
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif _db_url.startswith("postgresql://") and not _db_url.startswith("postgresql+asyncpg://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(_db_url, **_engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

