from unittest.mock import AsyncMock, patch

import pytest

from app.core.health import ReadinessResult


@pytest.mark.asyncio
async def test_liveness_is_dependency_free(client) -> None:
    response = await client.get("/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "alive"}
    assert response.headers["x-request-id"]
    assert response.headers["x-content-type-options"] == "nosniff"


@pytest.mark.asyncio
async def test_system_status_returns_unavailable_without_resources(client) -> None:
    response = await client.get("/api/v1/system/status")
    assert response.status_code == 503
    assert response.json()["code"] == "SERVICE_UNAVAILABLE"
    assert response.json()["request_id"]


@pytest.mark.asyncio
async def test_system_status_returns_safe_success_payload(client, fake_resources) -> None:
    from app.main import app

    app.state.resources = fake_resources
    app.state.settings = app.state.settings.model_copy(
        update={"database_url": "postgresql+asyncpg://u:p@localhost:5432/app"}
    )
    with patch(
        "app.domains.system.router.check_readiness",
        new=AsyncMock(return_value=ReadinessResult(ready=True, checks={"database": "ok"})),
    ):
        response = await client.get("/api/v1/system/status")
    assert response.status_code == 200
    assert response.json()["code"] == "OK"
    assert response.json()["data"] == {"status": "available"}


@pytest.mark.asyncio
async def test_unknown_route_has_stable_error(client) -> None:
    response = await client.get("/does-not-exist")
    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_external_request_id_is_rejected_and_replaced(client) -> None:
    response = await client.get("/health/live", headers={"X-Request-ID": "contains spaces"})
    assert response.status_code == 200
    assert response.headers["x-request-id"] != "contains spaces"
