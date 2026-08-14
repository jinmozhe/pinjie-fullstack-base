from collections.abc import AsyncIterator

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import session_scope


async def get_db_session(request: Request) -> AsyncIterator[AsyncSession]:
    resources = getattr(request.app.state, "resources", None)
    if resources is None:
        raise RuntimeError("application resources are not initialized")
    async with session_scope(resources.session_factory) as session:
        yield session
