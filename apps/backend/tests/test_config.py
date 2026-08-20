import sys

import pytest
from loguru import logger

from app.core.config import Settings
from app.core.logging import configure_logging
from tests.conftest import TEST_SECRETS


def test_local_settings_require_database_url() -> None:
    settings = Settings(ENVIRONMENT="local", DATABASE_URL="postgresql+asyncpg://u:p@localhost:5432/app", **TEST_SECRETS)
    settings.validate_runtime()


def test_test_database_requires_test_suffix() -> None:
    settings = Settings(
        ENVIRONMENT="test",
        DATABASE_URL="postgresql+asyncpg://u:p@localhost:5432/app",
        TEST_DATABASE_URL="postgresql+asyncpg://u:p@localhost:5432/app_test",
        **TEST_SECRETS,
    )
    settings.validate_runtime()


def test_required_redis_requires_url() -> None:
    settings = Settings(
        ENVIRONMENT="local",
        DATABASE_URL="postgresql+asyncpg://u:p@localhost:5432/app",
        **{**TEST_SECRETS, "REDIS_URL": None},
    )
    with pytest.raises(ValueError, match="REDIS_URL"):
        settings.validate_runtime()


def test_environment_aliases_are_rejected() -> None:
    with pytest.raises(ValueError):
        Settings(ENVIRONMENT="development")


def test_file_logging_defaults_are_local_file_safe() -> None:
    settings = Settings()

    assert settings.log_file_enabled is True
    assert settings.log_file_path == "logs/app_{time:YYYY-MM-DD}.log"
    assert settings.log_file_rotation == "50 MB"
    assert settings.log_file_retention == "10 days"


def test_configure_logging_adds_async_file_sink_when_enabled(tmp_path, monkeypatch) -> None:
    settings = Settings(
        LOG_FILE_ENABLED=True,
        LOG_FILE_PATH=str(tmp_path / "logs" / "app_{time:YYYY-MM-DD}.log"),
    )
    added: list[tuple[object, dict[str, object]]] = []
    monkeypatch.setattr(logger, "remove", lambda: None)
    monkeypatch.setattr(logger, "add", lambda sink, **kwargs: added.append((sink, kwargs)) or 1)

    configure_logging(settings)

    assert (tmp_path / "logs").is_dir()
    assert len(added) == 2
    sink, options = added[1]
    assert sink == settings.log_file_path
    assert options["enqueue"] is True
    assert options["rotation"] == "50 MB"
    assert options["retention"] == "10 days"
    assert options["compression"] == "zip"
    assert options["encoding"] == "utf-8"


def test_configure_logging_skips_file_sink_when_disabled(tmp_path, monkeypatch) -> None:
    settings = Settings(
        LOG_FILE_ENABLED=False,
        LOG_FILE_PATH=str(tmp_path / "logs" / "app.log"),
    )
    added: list[object] = []
    monkeypatch.setattr(logger, "remove", lambda: None)
    monkeypatch.setattr(logger, "add", lambda sink, **_: added.append(sink) or 1)

    configure_logging(settings)

    assert added == [sys.stderr]
    assert not (tmp_path / "logs").exists()
