from dataclasses import dataclass

from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from .config import Settings
from .redis import create_redis_client


@dataclass(slots=True)
class AppResources:
    engine: AsyncEngine
    session_factory: async_sessionmaker[AsyncSession]
    redis: Redis | None

    async def close(self) -> None:
        if self.redis is not None:
            await self.redis.aclose()
        await self.engine.dispose()


def create_resources(settings: Settings) -> AppResources:
    if not settings.database_url:
        raise ValueError("DATABASE_URL is required before resources can be created")
    engine = create_async_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_size=settings.db_pool_size,
        max_overflow=settings.db_max_overflow,
        pool_timeout=settings.db_pool_timeout,
        pool_recycle=1800,
        echo=settings.debug,
    )
    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    return AppResources(engine=engine, session_factory=session_factory, redis=create_redis_client(settings))
