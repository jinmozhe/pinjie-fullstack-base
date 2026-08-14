from collections.abc import AsyncIterator
from unittest.mock import MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture
def client_transport() -> ASGITransport:
    return ASGITransport(app=app)


@pytest.fixture
async def client(client_transport: ASGITransport) -> AsyncIterator[AsyncClient]:
    async with AsyncClient(transport=client_transport, base_url="http://testserver") as test_client:
        yield test_client


@pytest.fixture
def fake_resources() -> MagicMock:
    return MagicMock(engine=MagicMock(), session_factory=MagicMock(), redis=None)
