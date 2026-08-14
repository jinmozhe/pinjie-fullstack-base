import pytest

from app.core.config import Settings


def test_local_settings_require_database_url() -> None:
    settings = Settings(ENVIRONMENT="local", DATABASE_URL="postgresql+asyncpg://u:p@localhost:5432/app")
    settings.validate_runtime()


def test_test_database_requires_test_suffix() -> None:
    settings = Settings(
        ENVIRONMENT="test",
        DATABASE_URL="postgresql+asyncpg://u:p@localhost:5432/app",
        TEST_DATABASE_URL="postgresql+asyncpg://u:p@localhost:5432/app_test",
    )
    settings.validate_runtime()


def test_required_redis_requires_url() -> None:
    settings = Settings(
        ENVIRONMENT="local",
        DATABASE_URL="postgresql+asyncpg://u:p@localhost:5432/app",
        REDIS_MODE="required",
    )
    with pytest.raises(ValueError, match="REDIS_URL"):
        settings.validate_runtime()


def test_environment_aliases_are_rejected() -> None:
    with pytest.raises(ValueError):
        Settings(ENVIRONMENT="development")
