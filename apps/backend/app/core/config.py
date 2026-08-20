from functools import lru_cache
from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

Environment = Literal["local", "test", "production"]
RedisMode = Literal["disabled", "required"]
RegistrationMode = Literal["open", "closed"]
RequestLogMode = Literal["disabled", "metadata"]


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
    trusted_proxy_cidrs: list[str] = Field(default_factory=list, validation_alias="TRUSTED_PROXY_CIDRS")
    force_https: bool = Field(default=False, validation_alias="FORCE_HTTPS")
    api_docs_enabled: bool | None = Field(default=None, validation_alias="API_DOCS_ENABLED")
    release_version: str | None = Field(default=None, validation_alias="RELEASE_VERSION")
    log_level: str = Field(default="INFO", validation_alias="LOG_LEVEL")
    log_file_enabled: bool = Field(default=True, validation_alias="LOG_FILE_ENABLED")
    log_file_path: str | None = Field(
        default="logs/app_{time:YYYY-MM-DD}.log",
        validation_alias="LOG_FILE_PATH",
    )
    log_file_rotation: str = Field(default="50 MB", validation_alias="LOG_FILE_ROTATION")
    log_file_retention: str = Field(default="10 days", validation_alias="LOG_FILE_RETENTION")
    db_pool_size: int = Field(default=5, validation_alias="DB_POOL_SIZE", ge=1, le=50)
    db_max_overflow: int = Field(default=5, validation_alias="DB_MAX_OVERFLOW", ge=0, le=50)
    db_pool_timeout: float = Field(default=5.0, validation_alias="DB_POOL_TIMEOUT", gt=0, le=60)
    dependency_timeout: float = Field(default=2.0, validation_alias="DEPENDENCY_TIMEOUT", gt=0, le=30)
    jwt_issuer: str = Field(
        default="pinjie-fullstack-base", validation_alias="JWT_ISSUER", min_length=3, max_length=128
    )
    web_jwt_secret: str | None = Field(default=None, validation_alias="WEB_JWT_SECRET")
    admin_jwt_secret: str | None = Field(default=None, validation_alias="ADMIN_JWT_SECRET")
    web_token_hmac_key: str | None = Field(default=None, validation_alias="WEB_TOKEN_HMAC_KEY")
    admin_token_hmac_key: str | None = Field(default=None, validation_alias="ADMIN_TOKEN_HMAC_KEY")
    registration_mode: RegistrationMode = Field(default="closed", validation_alias="REGISTRATION_MODE")
    auth_cookie_secure: bool = Field(default=False, validation_alias="AUTH_COOKIE_SECURE")
    web_access_ttl_seconds: int = Field(default=900, validation_alias="WEB_ACCESS_TTL_SECONDS", ge=300, le=1800)
    admin_access_ttl_seconds: int = Field(
        default=600,
        validation_alias="ADMIN_ACCESS_TTL_SECONDS",
        ge=300,
        le=900,
    )
    refresh_idle_ttl_days: int = Field(default=7, validation_alias="REFRESH_IDLE_TTL_DAYS", ge=1, le=14)
    session_absolute_ttl_days: int = Field(default=30, validation_alias="SESSION_ABSOLUTE_TTL_DAYS", ge=2, le=90)
    password_hash_concurrency: int = Field(default=4, validation_alias="PASSWORD_HASH_CONCURRENCY", ge=1, le=16)
    request_log_mode: RequestLogMode = Field(default="disabled", validation_alias="REQUEST_LOG_MODE")
    security_event_retention_days: int = Field(
        default=180,
        validation_alias="SECURITY_EVENT_RETENTION_DAYS",
        ge=30,
        le=3650,
    )
    request_log_retention_days: int = Field(
        default=30,
        validation_alias="REQUEST_LOG_RETENTION_DAYS",
        ge=1,
        le=365,
    )
    request_log_stream_maxlen: int = Field(
        default=10000,
        validation_alias="REQUEST_LOG_STREAM_MAXLEN",
        ge=1000,
        le=1000000,
    )
    web_login_limit: int = Field(default=10, validation_alias="WEB_LOGIN_LIMIT", ge=1, le=100)
    admin_login_limit: int = Field(default=5, validation_alias="ADMIN_LOGIN_LIMIT", ge=1, le=20)
    login_window_seconds: int = Field(default=900, validation_alias="LOGIN_WINDOW_SECONDS", ge=60, le=3600)

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
        self.validate_database_runtime()
        if self.redis_mode == "required":
            if self.redis_url is None:
                raise ValueError("REDIS_URL is required when REDIS_MODE=required")
            if urlsplit(self.redis_url).scheme not in {"redis", "rediss"}:
                raise ValueError("REDIS_URL must use redis or rediss")
        else:
            raise ValueError("REDIS_MODE must be required while authentication is enabled")
        self._validate_authentication_secrets()
        self._validate_trusted_proxy_cidrs()
        if self.session_absolute_ttl_days <= self.refresh_idle_ttl_days:
            raise ValueError("SESSION_ABSOLUTE_TTL_DAYS must be greater than REFRESH_IDLE_TTL_DAYS")
        if self.environment == "production":
            if self.api_docs_enabled is True:
                raise ValueError("API_DOCS_ENABLED must remain false in production unless explicitly reviewed")
            if not self.release_version:
                raise ValueError("RELEASE_VERSION is required in production")
            if not self.trusted_hosts or "*" in self.trusted_hosts:
                raise ValueError("TRUSTED_HOSTS must be explicit in production")
            if not self.cors_origins or "*" in self.cors_origins:
                raise ValueError("BACKEND_CORS_ORIGINS must be explicit in production")
            if not self.auth_cookie_secure:
                raise ValueError("AUTH_COOKIE_SECURE must be true in production")
            if not self.trusted_proxy_cidrs:
                raise ValueError("TRUSTED_PROXY_CIDRS must be explicit in production")

    def validate_database_runtime(self) -> None:
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

    def _validate_authentication_secrets(self) -> None:
        named_values = {
            "WEB_JWT_SECRET": self.web_jwt_secret,
            "ADMIN_JWT_SECRET": self.admin_jwt_secret,
            "WEB_TOKEN_HMAC_KEY": self.web_token_hmac_key,
            "ADMIN_TOKEN_HMAC_KEY": self.admin_token_hmac_key,
        }
        values: list[str] = []
        for name, value in named_values.items():
            if value is None or len(value.encode("utf-8")) < 32:
                raise ValueError(f"{name} must contain at least 32 UTF-8 bytes")
            lowered = value.lower()
            if any(marker in lowered for marker in {"replace_with", "change_me", "example", "placeholder"}):
                raise ValueError(f"{name} must not use a template value")
            values.append(value)
        if len(set(values)) != len(values):
            raise ValueError("JWT and token HMAC keys must all be different")

    def _validate_trusted_proxy_cidrs(self) -> None:
        import ipaddress

        for value in self.trusted_proxy_cidrs:
            try:
                ipaddress.ip_network(value, strict=False)
            except ValueError as exc:
                raise ValueError(f"TRUSTED_PROXY_CIDRS contains an invalid network: {value}") from exc

    def authentication_secrets(self) -> tuple[str, str, str, str]:
        self._validate_authentication_secrets()
        assert self.web_jwt_secret is not None
        assert self.admin_jwt_secret is not None
        assert self.web_token_hmac_key is not None
        assert self.admin_token_hmac_key is not None
        return (
            self.web_jwt_secret,
            self.admin_jwt_secret,
            self.web_token_hmac_key,
            self.admin_token_hmac_key,
        )

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
