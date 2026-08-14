import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class UserUpdateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    display_name: str | None = Field(default=None, max_length=100)
    email: str | None = Field(default=None, max_length=320)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        return value.strip().lower() if value else None

    @model_validator(mode="after")
    def require_explicit_field(self) -> "UserUpdateIn":
        if not self.model_fields_set:
            raise ValueError("at least one field is required")
        return self


class PasswordChangeIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=12, max_length=128)


class AccountDeleteIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_password: str = Field(min_length=1, max_length=128)


class SessionRead(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: uuid.UUID
    device_name: str | None
    ip_masked: str | None
    user_agent_summary: str | None
    created_at: datetime
    last_seen_at: datetime
    idle_expires_at: datetime
    absolute_expires_at: datetime
    is_current: bool
    revoked_at: datetime | None


class ActionResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    completed: bool = True


__all__ = ["AccountDeleteIn", "ActionResult", "PasswordChangeIn", "SessionRead", "UserUpdateIn"]
