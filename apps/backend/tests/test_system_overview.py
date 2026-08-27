import json
import uuid
from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from app.core.config import Settings
from app.domains.admin.schemas import SystemTelemetryRead
from app.services.admin_management import AdminManagementService


def _settings(*, redis_mode: str = "required") -> Settings:
    return Settings.model_construct(
        project_name="Pinjie",
        environment="test",
        dependency_timeout=2.0,
        redis_mode=redis_mode,
        security_event_retention_days=180,
        upload_storage_driver="local",
        upload_base_url="/static/uploads",
        release_version="test-release",
        web_origins=["http://localhost:3000"],
        admin_origins=["http://localhost:3001"],
    )


def _service(*, session: AsyncMock | None = None, redis: AsyncMock | None = None) -> AdminManagementService:
    database_session = session or AsyncMock()
    resources = SimpleNamespace(engine=object(), redis=redis)
    return AdminManagementService(
        session=database_session,
        session_factory=AsyncMock(),
        settings=_settings(),
        password_manager=AsyncMock(),
        metadata=AsyncMock(),
        actor_id=uuid.uuid7(),
        resources=resources,
        started_at=datetime(2026, 8, 27, tzinfo=UTC),
    )


@pytest.mark.asyncio
async def test_system_telemetry_cache_hit_overrides_cache_metadata() -> None:
    sampled_at = datetime(2026, 8, 27, 8, 0, tzinfo=UTC)
    redis = AsyncMock()
    redis.get.return_value = json.dumps(
        {
            "status": "ok",
            "sampled_at": sampled_at.isoformat(),
            "user_count": 7,
            "admin_count": 2,
            "role_count": 3,
            "asset_count": 11,
            "audit_event_count": 13,
        }
    )
    service = _service(redis=redis)

    telemetry = await service._read_system_telemetry_cache(service.cache_keys.system_telemetry())

    assert telemetry is not None
    assert telemetry.cached is True
    assert telemetry.source == "redis_cache"
    assert telemetry.sampled_at == sampled_at


@pytest.mark.asyncio
async def test_system_telemetry_query_uses_current_entity_scopes() -> None:
    session = AsyncMock()
    session.execute.return_value = SimpleNamespace(one=lambda: (7, 2, 3, 11, 13))
    service = _service(session=session)

    telemetry = await service._query_system_telemetry(datetime(2026, 8, 27, 8, 0, tzinfo=UTC))

    assert telemetry.status == "ok"
    assert telemetry.source == "database"
    statement = str(session.execute.await_args.args[0])
    assert "users.deleted_at IS NULL" in statement
    assert "admins.is_active IS true" in statement
    assert "roles.is_active IS true" in statement
    assert "audit_events.occurred_at >=" in statement


@pytest.mark.asyncio
async def test_required_redis_failure_marks_overview_unavailable() -> None:
    service = _service(redis=AsyncMock())
    service._load_system_telemetry = AsyncMock(
        return_value=SystemTelemetryRead(
            status="ok",
            sampled_at=datetime(2026, 8, 27, 8, 0, tzinfo=UTC),
            source="database",
            user_count=7,
            admin_count=2,
            role_count=3,
            asset_count=11,
            audit_event_count=13,
            cached=False,
        )
    )

    with (
        patch("app.services.admin_management.check_database", new=AsyncMock(return_value=(True, "ok"))),
        patch("app.services.admin_management.check_redis", new=AsyncMock(return_value=False)),
    ):
        overview = await service.get_system_overview()

    assert overview.status == "unavailable"
    assert overview.infrastructure.redis.status == "unavailable"
