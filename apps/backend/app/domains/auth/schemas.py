import re
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

_USERNAME_PATTERN = re.compile(r"^[a-z0-9._-]{3,50}$")


def normalize_username(value: str) -> str:
    normalized = value.strip().lower()
    if not _USERNAME_PATTERN.fullmatch(normalized):
        raise ValueError("username must be 3-50 lowercase letters, digits, dot, underscore, or hyphen")
    return normalized


class UserRegisterIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str
    password: str = Field(min_length=12, max_length=128)
    display_name: str | None = Field(default=None, max_length=100)
    email: str | None = Field(default=None, max_length=320)

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        return normalize_username(value)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        return value.strip().lower() if value else None


class UserLoginIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str
    password: str = Field(min_length=1, max_length=128)

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        return normalize_username(value)


class UserPrincipalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: uuid.UUID
    username: str
    display_name: str | None
    email: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class UserAuthSessionOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    principal: UserPrincipalOut
    session_id: uuid.UUID
    access_expires_at: datetime
    idle_expires_at: datetime
    absolute_expires_at: datetime


class RefreshSessionOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    session_id: uuid.UUID
    access_expires_at: datetime
    idle_expires_at: datetime
    absolute_expires_at: datetime


__all__ = [
    "RefreshSessionOut",
    "UserAuthSessionOut",
    "UserLoginIn",
    "UserPrincipalOut",
    "UserRegisterIn",
    "normalize_username",
]
