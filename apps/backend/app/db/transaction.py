from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from contextvars import ContextVar

from sqlalchemy.ext.asyncio import AsyncSession

_transaction_depth: ContextVar[int] = ContextVar("transaction_depth", default=0)


@asynccontextmanager
async def transaction_scope(session: AsyncSession) -> AsyncIterator[AsyncSession]:
    depth = _transaction_depth.get()
    token = _transaction_depth.set(depth + 1)
    try:
        if depth == 0:
            try:
                yield session
                await session.commit()
            except BaseException:
                await session.rollback()
                raise
        else:
            async with session.begin_nested():
                yield session
    finally:
        _transaction_depth.reset(token)
