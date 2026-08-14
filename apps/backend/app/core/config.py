from functools import lru_cache
from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

Environment = Literal["local", "test", "production"]
RedisMode = Literal["disabled", "required"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    project_name: str = Field(default="Pinjie Fullstack Base Backend", validation_alias="PROJECT_NAME")
    environment: Environment = Field(default="local", validation_alias="ENVIRONMENT")
    debug: bool = Field(default=False, validation_alias="DEBUG")
    api_v1_str: str = Field(default="/api/v1", validation_alias="API_V1_STR")
    database_url: str | None = Field(default=None, validation_alias="DATABASE_URL")
    test_database_url: str | None = Field(default=None, validation_alias="TEST_DATABASE_URL")
    redis_mode: RedisMode = Field(default="disabled", validation_alias="REDIS_MODE")
    redis_url: str | None = Field(default=None, validation_alias="REDIS_URL")
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://localhost:3001"],
        validation_alias="BACKEND_CORS_ORIGINS",
    )
    trusted_hosts: list[str] = Field(
        default_factory=lambda: ["localhost", "127.0.0.1", "testserver"],
        validation_alias="TRUSTED_HOSTS",
    )
    force_https: bool = Field(default=False, validation_alias="FORCE_HTTPS")
    api_docs_enabled: bool | None = Field(default=None, validation_alias="API_DOCS_ENABLED")
    release_version: str | None = Field(default=None, validation_alias="RELEASE_VERSION")
    log_level: str = Field(default="INFO", validation_alias="LOG_LEVEL")
    db_pool_size: int = Field(default=5, validation_alias="DB_POOL_SIZE", ge=1, le=50)
    db_max_overflow: int = Field(default=5, validation_alias="DB_MAX_OVERFLOW", ge=0, le=50)
    db_pool_timeout: float = Field(default=5.0, validation_alias="DB_POOL_TIMEOUT", gt=0, le=60)
    dependency_timeout: float = Field(default=2.0, validation_alias="DEPENDENCY_TIMEOUT", gt=0, le=30)

    @field_validator("api_v1_str")
    @classmethod
    def validate_api_prefix(cls, value: str) -> str:
        if not value.startswith("/") or value.endswith("/"):
            raise ValueError("API_V1_STR must start with / and must not end with /")
        return value

    @field_validator("log_level")
    @classmethod
    def normalize_log_level(cls, value: str) -> str:
        level = value.upper()
        if level not in {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}:
            raise ValueError("LOG_LEVEL must be a supported standard logging level")
        return level

    def validate_runtime(self) -> None:
        if self.database_url is None:
            raise ValueError("DATABASE_URL is required")
        self._validate_database_url(self.database_url, "DATABASE_URL")
        if self.environment == "test":
            if self.test_database_url is None:
                raise ValueError("TEST_DATABASE_URL is required in test environment")
            self._validate_database_url(self.test_database_url, "TEST_DATABASE_URL")
            database_name = urlsplit(self.test_database_url).path.removeprefix("/")
            if not database_name.endswith("_test"):
                raise ValueError("TEST_DATABASE_URL database name must end with _test")
        if self.redis_mode == "required":
            if self.redis_url is None:
                raise ValueError("REDIS_URL is required when REDIS_MODE=required")
            if urlsplit(self.redis_url).scheme not in {"redis", "rediss"}:
                raise ValueError("REDIS_URL must use redis or rediss")
        if self.environment == "production":
            if self.api_docs_enabled is True:
                raise ValueError("API_DOCS_ENABLED must remain false in production unless explicitly reviewed")
            if not self.release_version:
                raise ValueError("RELEASE_VERSION is required in production")
            if not self.trusted_hosts or "*" in self.trusted_hosts:
                raise ValueError("TRUSTED_HOSTS must be explicit in production")
            if not self.cors_origins or "*" in self.cors_origins:
                raise ValueError("BACKEND_CORS_ORIGINS must be explicit in production")

    @staticmethod
    def _validate_database_url(value: str, name: str) -> None:
        parsed = urlsplit(value)
        if parsed.scheme != "postgresql+asyncpg" or not parsed.hostname or not parsed.path:
            raise ValueError(f"{name} must be a postgresql+asyncpg URL")
        if parsed.path == "/" or parsed.path == "":
            raise ValueError(f"{name} must include a database name")

    @property
    def docs_url(self) -> str | None:
        enabled = self.api_docs_enabled
        if enabled is None:
            enabled = self.environment in {"local", "test"}
        return "/docs" if enabled else None

    @property
    def redoc_url(self) -> str | None:
        return "/redoc" if self.docs_url is not None else None


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
