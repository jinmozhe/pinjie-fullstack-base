from dataclasses import dataclass
from enum import StrEnum


@dataclass(frozen=True, slots=True)
class PermissionDefinition:
    code: str
    name: str
    description: str


class PermissionCode(StrEnum):
    USERS_READ = "users:read"
    USERS_UPDATE = "users:update"
    USERS_CREDENTIALS_RESET = "users:credentials:reset"
    USERS_SESSIONS_READ = "users:sessions:read"
    USERS_SESSIONS_REVOKE = "users:sessions:revoke"
    ADMINS_READ = "admins:read"
    ADMINS_CREATE = "admins:create"
    ADMINS_UPDATE = "admins:update"
    ADMINS_CREDENTIALS_RESET = "admins:credentials:reset"
    ADMINS_ROLES_ASSIGN = "admins:roles:assign"
    ADMINS_SESSIONS_READ = "admins:sessions:read"
    ADMINS_SESSIONS_REVOKE = "admins:sessions:revoke"
    ROLES_READ = "roles:read"
    ROLES_CREATE = "roles:create"
    ROLES_UPDATE = "roles:update"
    ROLES_DELETE = "roles:delete"
    ROLES_PERMISSIONS_ASSIGN = "roles:permissions:assign"
    PERMISSIONS_READ = "permissions:read"
    SECURITY_LOGIN_EVENTS_READ = "security:login-events:read"
    SECURITY_AUDIT_EVENTS_READ = "security:audit-events:read"
    SYSTEM_REQUEST_LOGS_READ = "system:request-logs:read"
    ASSETS_READ = "assets:read"
    ASSETS_DELETE = "assets:delete"


PERMISSION_CATALOG: tuple[PermissionDefinition, ...] = (
    PermissionDefinition("users:read", "查看用户", "查看用户列表和详情"),
    PermissionDefinition("users:update", "修改用户", "修改用户资料和状态"),
    PermissionDefinition("users:credentials:reset", "重置用户密码", "重置用户登录密码"),
    PermissionDefinition("users:sessions:read", "查看用户会话", "查看用户设备与会话"),
    PermissionDefinition("users:sessions:revoke", "撤销用户会话", "撤销用户一个或全部会话"),
    PermissionDefinition("admins:read", "查看管理员", "查看管理员列表和详情"),
    PermissionDefinition("admins:create", "创建管理员", "创建后台管理员"),
    PermissionDefinition("admins:update", "修改管理员", "修改管理员资料和状态"),
    PermissionDefinition("admins:credentials:reset", "重置管理员密码", "重置管理员登录密码"),
    PermissionDefinition("admins:roles:assign", "分配管理员角色", "修改管理员角色集合"),
    PermissionDefinition("admins:sessions:read", "查看管理员会话", "查看管理员会话"),
    PermissionDefinition("admins:sessions:revoke", "撤销管理员会话", "撤销管理员全部会话"),
    PermissionDefinition("roles:read", "查看角色", "查看角色和授权"),
    PermissionDefinition("roles:create", "创建角色", "创建后台角色"),
    PermissionDefinition("roles:update", "修改角色", "修改角色资料和状态"),
    PermissionDefinition("roles:delete", "删除角色", "删除未被使用的角色"),
    PermissionDefinition("roles:permissions:assign", "分配角色权限", "修改角色权限集合"),
    PermissionDefinition("permissions:read", "查看权限目录", "查看源码权限目录"),
    PermissionDefinition("security:login-events:read", "查看登录事件", "查看登录安全事件"),
    PermissionDefinition("security:audit-events:read", "查看审计事件", "查看高风险操作审计"),
    PermissionDefinition("system:request-logs:read", "查看请求日志", "查看启用后的请求元数据"),
    PermissionDefinition("assets:read", "查看文件资产", "查看统一文件与多媒体资产列表"),
    PermissionDefinition("assets:delete", "删除文件资产", "删除文件资产及其存储对象"),
)

PERMISSION_CODES = frozenset(item.code for item in PERMISSION_CATALOG)
CATALOG_VERSION = "2026-08-25"

__all__ = [
    "CATALOG_VERSION",
    "PERMISSION_CATALOG",
    "PERMISSION_CODES",
    "PermissionCode",
    "PermissionDefinition",
]
