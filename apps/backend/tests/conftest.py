import os
from collections.abc import AsyncIterator
from unittest.mock import MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings

_bootstrap_settings = Settings()
if _bootstrap_settings.test_database_url:
    os.environ.setdefault("TEST_DATABASE_URL", _bootstrap_settings.test_database_url)
if _bootstrap_settings.test_redis_url:
    os.environ.setdefault("TEST_REDIS_URL", _bootstrap_settings.test_redis_url)
if os.getenv("TEST_DATABASE_URL") and os.getenv("TEST_REDIS_URL"):
    os.environ["ENVIRONMENT"] = "test"
    os.environ["DATABASE_URL"] = os.environ["TEST_DATABASE_URL"]
    os.environ["REDIS_URL"] = os.environ["TEST_REDIS_URL"]

from app.main import app  # noqa: E402

_test_redis_url = os.getenv("TEST_REDIS_URL", "redis://localhost:6379/15")
TEST_SECRETS = {
    "REDIS_MODE": "required",
    "REDIS_URL": _test_redis_url,
    "TEST_REDIS_URL": _test_redis_url,
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
