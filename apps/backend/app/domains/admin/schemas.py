import re
import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.core.pagination import PageResult
from app.domains.auth.schemas import UserPrincipalOut, normalize_username

_ROLE_CODE = re.compile(r"^[a-z][a-z0-9_-]{2,99}$")


class ConfirmationAction(StrEnum):
    USER_DISABLE = "users:disable"
    USER_PASSWORD_RESET = "users:credentials:reset"
    USER_SESSION_REVOKE = "users:sessions:revoke"
    ADMIN_CREATE = "admins:create"
    ADMIN_SUPERUSER_CHANGE = "admins:superuser:change"
    ADMIN_STATUS_CHANGE = "admins:status:change"
    ADMIN_PASSWORD_RESET = "admins:credentials:reset"
    ADMIN_ROLES_ASSIGN = "admins:roles:assign"
    ADMIN_SESSIONS_REVOKE = "admins:sessions:revoke"
    ROLE_DELETE = "roles:delete"
    ROLE_PERMISSIONS_ASSIGN = "roles:permissions:assign"


class AdminLoginIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str
    password: str = Field(min_length=1, max_length=128)

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        return normalize_username(value)


class RoleSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: uuid.UUID
    code: str
    name: str


class AdminRead(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: uuid.UUID
    username: str
    display_name: str | None
    is_active: bool
    is_superuser: bool
    roles: list[RoleSummary]
    permissions: list[str]
    created_at: datetime
    updated_at: datetime


class AdminAuthSessionOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    principal: AdminRead
    session_id: uuid.UUID
    access_expires_at: datetime
    idle_expires_at: datetime
    absolute_expires_at: datetime


class AdminConfirmIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_password: str = Field(min_length=1, max_length=128)
    action: ConfirmationAction


class AdminConfirmOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    confirmation_token: str
    action: ConfirmationAction
    expires_at: datetime


class AdminCreateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str
    initial_password: str = Field(min_length=12, max_length=128)
    display_name: str | None = Field(default=None, max_length=100)
    is_active: bool = True
    is_superuser: bool = False
    role_ids: list[uuid.UUID] = Field(default_factory=list)

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        return normalize_username(value)


class AdminUpdateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    display_name: str | None = Field(default=None, max_length=100)
    is_superuser: bool | None = None

    @model_validator(mode="after")
    def require_explicit_field(self) -> "AdminUpdateIn":
        if not self.model_fields_set:
            raise ValueError("at least one field is required")
        return self


class StatusUpdateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    is_active: bool


class PasswordResetIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    new_password: str = Field(min_length=12, max_length=128)


class AdminRoleAssignIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role_ids: list[uuid.UUID]


class RoleCreateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    is_active: bool = True

    @field_validator("code")
    @classmethod
    def validate_code(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not _ROLE_CODE.fullmatch(normalized):
            raise ValueError("invalid role code")
        return normalized


class RoleUpdateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def require_explicit_field(self) -> "RoleUpdateIn":
        if not self.model_fields_set:
            raise ValueError("at least one field is required")
        return self


class RolePermissionAssignIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    permission_codes: list[str]


class PermissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: uuid.UUID
    code: str
    name: str
    description: str | None
    is_active: bool
    catalog_version: str


class RoleRead(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: uuid.UUID
    code: str
    name: str
    description: str | None
    is_active: bool
    permissions: list[str]
    created_at: datetime
    updated_at: datetime


class LoginEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: uuid.UUID
    principal_type: str
    principal_id: uuid.UUID | None
    event_type: str
    succeeded: bool
    reason_code: str
    ip_address: str | None
    user_agent_summary: str | None
    request_id: str
    occurred_at: datetime


class AuditEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: uuid.UUID
    actor_id: uuid.UUID | None
    action: str
    target_type: str
    target_id: uuid.UUID | None
    result: str
    changed_fields: dict[str, object]
    request_id: str
    occurred_at: datetime
    completed_at: datetime | None


class RequestLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: uuid.UUID
    request_id: str
    trace_id: str
    method: str
    route_template: str
    status_code: int
    duration_ms: int
    principal_type: str | None
    release_version: str | None
    occurred_at: datetime


AdminPage = PageResult[AdminRead]
RolePage = PageResult[RoleRead]
LoginEventPage = PageResult[LoginEventRead]
AuditEventPage = PageResult[AuditEventRead]
RequestLogPage = PageResult[RequestLogRead]
UserPage = PageResult[UserPrincipalOut]

__all__ = [
    "AdminAuthSessionOut",
    "AdminConfirmIn",
    "AdminConfirmOut",
    "AdminCreateIn",
    "AdminLoginIn",
    "AdminPage",
    "AdminRead",
    "AdminRoleAssignIn",
    "AdminUpdateIn",
    "AuditEventPage",
    "AuditEventRead",
    "ConfirmationAction",
    "LoginEventPage",
    "LoginEventRead",
    "PasswordResetIn",
    "PermissionRead",
    "RoleCreateIn",
    "RolePage",
    "RolePermissionAssignIn",
    "RoleRead",
    "RoleSummary",
    "RoleUpdateIn",
    "StatusUpdateIn",
    "RequestLogPage",
    "RequestLogRead",
    "UserPage",
]
