from unittest.mock import AsyncMock, MagicMock

import pytest

from app.db.transaction import transaction_scope


@pytest.mark.asyncio
async def test_outer_transaction_commits() -> None:
    session = AsyncMock()
    async with transaction_scope(session):
        pass
    session.commit.assert_awaited_once()
    session.rollback.assert_not_awaited()


@pytest.mark.asyncio
async def test_outer_transaction_rolls_back_and_preserves_error() -> None:
    session = AsyncMock()
    with pytest.raises(RuntimeError, match="boom"):
        async with transaction_scope(session):
            raise RuntimeError("boom")
    session.rollback.assert_awaited_once()
    session.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_nested_transaction_uses_savepoint_without_commit() -> None:
    session = MagicMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    savepoint = MagicMock()
    session.begin_nested.return_value = savepoint
    savepoint.__aenter__ = AsyncMock(return_value=session)
    savepoint.__aexit__ = AsyncMock(return_value=None)
    async with transaction_scope(session):
        async with transaction_scope(session):
            pass
    session.begin_nested.assert_called_once()
    session.commit.assert_awaited_once()
