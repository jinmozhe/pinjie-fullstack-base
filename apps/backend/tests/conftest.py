from collections.abc import AsyncIterator
from unittest.mock import MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

TEST_SECRETS = {
    "REDIS_MODE": "required",
    "REDIS_URL": "redis://localhost:6379/15",
    "WEB_JWT_SECRET": "test-web-jwt-secret-0000000000000001",
    "ADMIN_JWT_SECRET": "test-admin-jwt-secret-0000000000001",
    "WEB_TOKEN_HMAC_KEY": "test-web-hmac-secret-000000000000001",
    "ADMIN_TOKEN_HMAC_KEY": "test-admin-hmac-secret-0000000000001",
}


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
    return MagicMock(engine=MagicMock(), session_factory=MagicMock(), redis=MagicMock(), password_manager=MagicMock())
