import re
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.core.pagination import PageResult
from app.core.password_policy import PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH
from app.domains.auth.schemas import normalize_username

_ROLE_CODE = re.compile(r"^[a-z][a-z0-9_-]{2,99}$")


class AdminLoginIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str
    password: str = Field(min_length=1, max_length=PASSWORD_MAX_LENGTH, description="登录密码，最多 64 个字符")

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
    avatar: str | None = Field(default=None, description="管理员头像 URL 或站内资源路径")
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


class AdminCreateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str
    initial_password: str = Field(
        min_length=PASSWORD_MIN_LENGTH,
        max_length=PASSWORD_MAX_LENGTH,
        description="初始密码，长度为 6 至 64 个字符",
    )
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
    avatar: str | None = Field(default=None, max_length=500, description="管理员头像 URL 或站内资源路径")
    is_superuser: bool | None = None

    @model_validator(mode="after")
    def require_explicit_field(self) -> "AdminUpdateIn":
        if not self.model_fields_set:
            raise ValueError("at least one field is required")
        return self


class AdminProfileUpdateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    display_name: str | None = Field(default=None, max_length=100)
    avatar: str | None = Field(default=None, max_length=500, description="管理员头像 URL 或站内资源路径")

    @model_validator(mode="after")
    def require_explicit_field(self) -> "AdminProfileUpdateIn":
        if not self.model_fields_set:
            raise ValueError("at least one field is required")
        return self


class StatusUpdateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    is_active: bool


class AdminBulkStatusUpdateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    admin_ids: list[uuid.UUID] = Field(
        min_length=1,
        max_length=100,
        description="待批量更新状态的管理员唯一标识列表",
    )
    is_active: bool

    @field_validator("admin_ids")
    @classmethod
    def validate_unique_admin_ids(cls, value: list[uuid.UUID]) -> list[uuid.UUID]:
        if len(value) != len(set(value)):
            raise ValueError("admin_ids must be unique")
        return value


class _UserBulkTargetIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user_ids: list[uuid.UUID] = Field(
        min_length=1,
        max_length=100,
        description="待批量操作的用户唯一标识列表",
    )

    @field_validator("user_ids")
    @classmethod
    def validate_unique_user_ids(cls, value: list[uuid.UUID]) -> list[uuid.UUID]:
        if len(value) != len(set(value)):
            raise ValueError("user_ids must be unique")
        return value


class UserBulkDeleteIn(_UserBulkTargetIn):
    deletion_reason: str | None = Field(default=None, max_length=100, description="软删除原因，可为空")

    @field_validator("deletion_reason")
    @classmethod
    def normalize_deletion_reason(cls, value: str | None) -> str | None:
        normalized = value.strip() if value else None
        return normalized or None


class UserBulkStatusUpdateIn(_UserBulkTargetIn):
    is_active: bool = Field(description="批量操作后的用户启用状态")


class UserRestoreBatchIn(_UserBulkTargetIn):
    pass


class AdminUserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: uuid.UUID
    username: str
    display_name: str | None
    email: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = Field(description="账户进入回收站的时间")
    deleted_by_id: uuid.UUID | None = Field(description="执行软删除的主体唯一标识")
    deleted_by_type: str | None = Field(description="执行软删除的主体类型")
    deletion_reason: str | None = Field(description="账户删除原因代码")
    can_restore: bool = Field(description="当前是否允许恢复")


class RoleBulkDeleteIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role_ids: list[uuid.UUID] = Field(
        min_length=1,
        max_length=100,
        description="待批量操作的角色唯一标识列表",
    )

    @field_validator("role_ids")
    @classmethod
    def validate_unique_role_ids(cls, value: list[uuid.UUID]) -> list[uuid.UUID]:
        if len(value) != len(set(value)):
            raise ValueError("role_ids must be unique")
        return value


class RoleBulkStatusUpdateIn(RoleBulkDeleteIn):
    is_active: bool = Field(description="批量操作后的角色启用状态")


class BatchActionResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    completed_count: int = Field(ge=0, description="本次批量操作完成的目标数量")
    target_ids: list[uuid.UUID] = Field(description="本次批量操作处理的目标唯一标识列表")


class PasswordResetIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    new_password: str = Field(
        min_length=PASSWORD_MIN_LENGTH,
        max_length=PASSWORD_MAX_LENGTH,
        description="新密码，长度为 6 至 64 个字符",
    )


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
    request_body: str | None


AdminPage = PageResult[AdminRead]
RolePage = PageResult[RoleRead]
LoginEventPage = PageResult[LoginEventRead]
AuditEventPage = PageResult[AuditEventRead]
RequestLogPage = PageResult[RequestLogRead]
UserPage = PageResult[AdminUserRead]

__all__ = [
    "AdminAuthSessionOut",
    "AdminBulkStatusUpdateIn",
    "AdminCreateIn",
    "AdminLoginIn",
    "AdminPage",
    "AdminProfileUpdateIn",
    "AdminRead",
    "AdminRoleAssignIn",
    "AdminUpdateIn",
    "AdminUserRead",
    "AuditEventPage",
    "AuditEventRead",
    "BatchActionResult",
    "LoginEventPage",
    "LoginEventRead",
    "PasswordResetIn",
    "PermissionRead",
    "RoleCreateIn",
    "RoleBulkDeleteIn",
    "RoleBulkStatusUpdateIn",
    "RolePage",
    "RolePermissionAssignIn",
    "RoleRead",
    "RoleSummary",
    "RoleUpdateIn",
    "StatusUpdateIn",
    "RequestLogPage",
    "RequestLogRead",
    "UserPage",
    "UserBulkDeleteIn",
    "UserBulkStatusUpdateIn",
    "UserRestoreBatchIn",
]
