import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.config import Settings
from app.core.error_codes import ErrorCode
from app.core.exceptions import AppException
from app.core.identifiers import new_uuid7
from app.core.pagination import PageResult
from app.core.request_metadata import RequestMetadata
from app.core.security import PasswordManager
from app.db.models import Admin, AdminSession, Role, User, UserSession
from app.db.repositories import (
    AdminRepository,
    RequestLogRepository,
    SecurityRepository,
    SessionRepository,
    UserRepository,
)
from app.domains.admin.permissions import PERMISSION_CODES
from app.domains.admin.presenters import admin_read, role_read
from app.domains.admin.schemas import (
    AdminCreateIn,
    AdminRead,
    AdminRoleAssignIn,
    AdminUpdateIn,
    AuditEventPage,
    AuditEventRead,
    LoginEventPage,
    LoginEventRead,
    PasswordResetIn,
    PermissionRead,
    RequestLogPage,
    RequestLogRead,
    RoleCreateIn,
    RolePage,
    RolePermissionAssignIn,
    RoleUpdateIn,
    StatusUpdateIn,
    UserPage,
)
from app.domains.auth.schemas import UserPrincipalOut
from app.domains.users.schemas import UserUpdateIn
from app.services.security_events import AuditCoordinator


class AdminManagementService:
    def __init__(
        self,
        *,
        session: AsyncSession,
        session_factory: async_sessionmaker[AsyncSession],
        settings: Settings,
        password_manager: PasswordManager,
        metadata: RequestMetadata,
        actor_id: uuid.UUID,
    ) -> None:
        self.session = session
        self.settings = settings
        self.password_manager = password_manager
        self.users = UserRepository(session)
        self.admins = AdminRepository(session)
        self.sessions = SessionRepository(session)
        self.security = SecurityRepository(session)
        self.request_logs = RequestLogRepository(session)
        self.audit = AuditCoordinator(
            session=session,
            session_factory=session_factory,
            actor_id=actor_id,
            metadata=metadata,
        )
        self.actor_id = actor_id

    async def list_users(self, *, page: int, page_size: int, search: str | None) -> UserPage:
        items, total = await self.users.list_users(page=page, page_size=page_size, search=search)
        return UserPage.create(
            items=[UserPrincipalOut.model_validate(item) for item in items],
            page=page,
            page_size=page_size,
            total=total,
        )

    async def get_user(self, user_id: uuid.UUID) -> User:
        user = await self.users.get(user_id)
        if user is None or user.deleted_at is not None:
            raise AppException(status_code=404, code=ErrorCode.USER_NOT_FOUND, message="用户不存在")
        return user

    async def update_user(self, user_id: uuid.UUID, payload: UserUpdateIn) -> User:
        async def operation() -> User:
            user = await self.users.get(user_id, for_update=True)
            if user is None or user.deleted_at is not None:
                raise AppException(status_code=404, code=ErrorCode.USER_NOT_FOUND, message="用户不存在")
            if "email" in payload.model_fields_set and payload.email:
                existing = await self.users.get_by_email(payload.email)
                if existing is not None and existing.id != user.id:
                    raise AppException(status_code=409, code=ErrorCode.STATE_CONFLICT, message="邮箱已被使用")
            if "display_name" in payload.model_fields_set:
                user.display_name = payload.display_name.strip() if payload.display_name else None
            if "email" in payload.model_fields_set:
                user.email = payload.email
            return user

        return await self.audit.execute(
            action="users:update",
            target_type="user",
            target_id=user_id,
            changed_fields={"fields": sorted(payload.model_fields_set)},
            operation=operation,
        )

    async def set_user_status(self, user_id: uuid.UUID, payload: StatusUpdateIn) -> User:
        async def operation() -> User:
            user = await self.users.get(user_id, for_update=True)
            if user is None or user.deleted_at is not None:
                raise AppException(status_code=404, code=ErrorCode.USER_NOT_FOUND, message="用户不存在")
            if user.is_active != payload.is_active:
                user.is_active = payload.is_active
                user.credential_version += 1
                await self.sessions.revoke_web_for_user(user.id, reason="account_status_changed")
            return user

        return await self.audit.execute(
            action="users:status:update",
            target_type="user",
            target_id=user_id,
            changed_fields={"is_active": payload.is_active},
            operation=operation,
        )

    async def reset_user_password(self, user_id: uuid.UUID, payload: PasswordResetIn) -> None:
        password_hash = await self.password_manager.hash(payload.new_password)

        async def operation() -> None:
            user = await self.users.get(user_id, for_update=True)
            if user is None or user.deleted_at is not None:
                raise AppException(status_code=404, code=ErrorCode.USER_NOT_FOUND, message="用户不存在")
            user.password_hash = password_hash
            user.credential_version += 1
            await self.sessions.revoke_web_for_user(user.id, reason="password_reset")

        await self.audit.execute(
            action="users:credentials:reset",
            target_type="user",
            target_id=user_id,
            changed_fields={"password": "reset"},
            operation=operation,
        )

    async def list_user_sessions(self, user_id: uuid.UUID) -> list[UserSession]:
        await self.get_user(user_id)
        return await self.sessions.list_web(user_id)

    async def revoke_user_session(self, user_id: uuid.UUID, session_id: uuid.UUID) -> None:
        async def operation() -> None:
            target = await self.sessions.get_web_for_user(session_id, user_id)
            if target is None:
                raise AppException(status_code=404, code=ErrorCode.NOT_FOUND, message="会话不存在")
            await self.sessions.revoke_web_session(session_id, reason="admin_revoked")

        await self.audit.execute(
            action="users:sessions:revoke",
            target_type="user_session",
            target_id=session_id,
            changed_fields={"revoked": True},
            operation=operation,
        )

    async def revoke_all_user_sessions(self, user_id: uuid.UUID) -> None:
        async def operation() -> None:
            if await self.users.get(user_id) is None:
                raise AppException(status_code=404, code=ErrorCode.USER_NOT_FOUND, message="用户不存在")
            await self.sessions.revoke_web_for_user(user_id, reason="admin_revoked_all")

        await self.audit.execute(
            action="users:sessions:revoke-all",
            target_type="user",
            target_id=user_id,
            changed_fields={"sessions": "revoked_all"},
            operation=operation,
        )

    async def list_admins(self, *, page: int, page_size: int) -> PageResult[AdminRead]:
        items, total = await self.admins.list_admins(page=page, page_size=page_size)
        return PageResult[AdminRead].create(
            items=[admin_read(item) for item in items], page=page, page_size=page_size, total=total
        )

    async def get_admin(self, admin_id: uuid.UUID) -> Admin:
        admin = await self.admins.get(admin_id)
        if admin is None:
            raise AppException(status_code=404, code=ErrorCode.ADMIN_NOT_FOUND, message="管理员不存在")
        return admin

    async def create_admin(self, payload: AdminCreateIn) -> Admin:
        password_hash = await self.password_manager.hash(payload.initial_password)
        admin_id = new_uuid7()

        async def operation() -> Admin:
            if await self.admins.get_by_username(payload.username) is not None:
                raise AppException(status_code=409, code=ErrorCode.STATE_CONFLICT, message="用户名已被使用")
            roles = await self.admins.get_roles(list(dict.fromkeys(payload.role_ids)))
            if len(roles) != len(set(payload.role_ids)):
                raise AppException(status_code=422, code=ErrorCode.VALIDATION_ERROR, message="一个或多个角色无效")
            admin = Admin(
                id=admin_id,
                username=payload.username,
                display_name=payload.display_name.strip() if payload.display_name else None,
                password_hash=password_hash,
                is_active=payload.is_active,
                is_superuser=payload.is_superuser,
                credential_version=1,
            )
            admin.roles = roles
            self.admins.add(admin)
            return admin

        try:
            return await self.audit.execute(
                action="admins:create",
                target_type="admin",
                target_id=admin_id,
                changed_fields={
                    "created": True,
                    "is_active": payload.is_active,
                    "is_superuser": payload.is_superuser,
                    "role_count": len(set(payload.role_ids)),
                },
                operation=operation,
            )
        except IntegrityError as exc:
            raise AppException(status_code=409, code=ErrorCode.STATE_CONFLICT, message="用户名已被使用") from exc

    async def update_admin(self, admin_id: uuid.UUID, payload: AdminUpdateIn) -> Admin:
        async def operation() -> Admin:
            admin = await self.admins.get(admin_id, for_update=True)
            if admin is None:
                raise AppException(status_code=404, code=ErrorCode.ADMIN_NOT_FOUND, message="管理员不存在")
            if "display_name" in payload.model_fields_set:
                admin.display_name = payload.display_name.strip() if payload.display_name else None
            if "is_superuser" in payload.model_fields_set and payload.is_superuser is not None:
                if admin.id == self.actor_id:
                    raise AppException(
                        status_code=409,
                        code=ErrorCode.STATE_CONFLICT,
                        message="不能修改自己的超级管理员状态",
                    )
                if admin.is_superuser and not payload.is_superuser and admin.is_active:
                    await self._protect_last_superuser()
                if admin.is_superuser != payload.is_superuser:
                    admin.is_superuser = payload.is_superuser
                    admin.credential_version += 1
                    await self.sessions.revoke_admin_for_admin(admin.id, reason="superuser_status_changed")
            return admin

        return await self.audit.execute(
            action="admins:update",
            target_type="admin",
            target_id=admin_id,
            changed_fields={"fields": sorted(payload.model_fields_set)},
            operation=operation,
        )

    async def set_admin_status(self, admin_id: uuid.UUID, payload: StatusUpdateIn) -> Admin:
        async def operation() -> Admin:
            if admin_id == self.actor_id:
                raise AppException(status_code=409, code=ErrorCode.STATE_CONFLICT, message="不能修改自己的启用状态")
            admin = await self.admins.get(admin_id, for_update=True)
            if admin is None:
                raise AppException(status_code=404, code=ErrorCode.ADMIN_NOT_FOUND, message="管理员不存在")
            if admin.is_active and not payload.is_active and admin.is_superuser:
                await self._protect_last_superuser()
            if admin.is_active != payload.is_active:
                admin.is_active = payload.is_active
                admin.credential_version += 1
                await self.sessions.revoke_admin_for_admin(admin.id, reason="account_status_changed")
            return admin

        return await self.audit.execute(
            action="admins:status:update",
            target_type="admin",
            target_id=admin_id,
            changed_fields={"is_active": payload.is_active},
            operation=operation,
        )

    async def reset_admin_password(self, admin_id: uuid.UUID, payload: PasswordResetIn) -> None:
        password_hash = await self.password_manager.hash(payload.new_password)

        async def operation() -> None:
            if admin_id == self.actor_id:
                raise AppException(
                    status_code=409, code=ErrorCode.STATE_CONFLICT, message="请使用当前管理员修改密码接口"
                )
            admin = await self.admins.get(admin_id, for_update=True)
            if admin is None:
                raise AppException(status_code=404, code=ErrorCode.ADMIN_NOT_FOUND, message="管理员不存在")
            admin.password_hash = password_hash
            admin.credential_version += 1
            await self.sessions.revoke_admin_for_admin(admin.id, reason="password_reset")

        await self.audit.execute(
            action="admins:credentials:reset",
            target_type="admin",
            target_id=admin_id,
            changed_fields={"password": "reset"},
            operation=operation,
        )

    async def assign_admin_roles(self, admin_id: uuid.UUID, payload: AdminRoleAssignIn) -> Admin:
        async def operation() -> Admin:
            if admin_id == self.actor_id:
                raise AppException(status_code=409, code=ErrorCode.STATE_CONFLICT, message="不能修改自己的角色")
            admin = await self.admins.get(admin_id, for_update=True)
            if admin is None:
                raise AppException(status_code=404, code=ErrorCode.ADMIN_NOT_FOUND, message="管理员不存在")
            role_ids = list(dict.fromkeys(payload.role_ids))
            roles = await self.admins.get_roles(role_ids)
            if len(roles) != len(role_ids):
                raise AppException(status_code=422, code=ErrorCode.VALIDATION_ERROR, message="一个或多个角色无效")
            admin.roles = roles
            admin.credential_version += 1
            await self.sessions.revoke_admin_for_admin(admin.id, reason="roles_changed")
            return admin

        return await self.audit.execute(
            action="admins:roles:assign",
            target_type="admin",
            target_id=admin_id,
            changed_fields={"role_count": len(set(payload.role_ids))},
            operation=operation,
        )

    async def list_admin_sessions(self, admin_id: uuid.UUID) -> list[AdminSession]:
        await self.get_admin(admin_id)
        return await self.sessions.list_admin(admin_id)

    async def revoke_all_admin_sessions(self, admin_id: uuid.UUID) -> None:
        async def operation() -> None:
            if admin_id == self.actor_id:
                raise AppException(status_code=409, code=ErrorCode.STATE_CONFLICT, message="不能在此处撤销自己的会话")
            if await self.admins.get(admin_id) is None:
                raise AppException(status_code=404, code=ErrorCode.ADMIN_NOT_FOUND, message="管理员不存在")
            await self.sessions.revoke_admin_for_admin(admin_id, reason="admin_revoked_all")

        await self.audit.execute(
            action="admins:sessions:revoke-all",
            target_type="admin",
            target_id=admin_id,
            changed_fields={"sessions": "revoked_all"},
            operation=operation,
        )

    async def list_roles(self, *, page: int, page_size: int) -> RolePage:
        items, total = await self.admins.list_roles(page=page, page_size=page_size)
        return RolePage.create(items=[role_read(item) for item in items], page=page, page_size=page_size, total=total)

    async def get_role(self, role_id: uuid.UUID) -> Role:
        role = await self.admins.get_role(role_id)
        if role is None:
            raise AppException(status_code=404, code=ErrorCode.ROLE_NOT_FOUND, message="角色不存在")
        return role

    async def create_role(self, payload: RoleCreateIn) -> Role:
        role_id = new_uuid7()

        async def operation() -> Role:
            if await self.admins.get_role_by_code(payload.code) is not None:
                raise AppException(status_code=409, code=ErrorCode.STATE_CONFLICT, message="角色代码已被使用")
            role = Role(
                id=role_id,
                code=payload.code,
                name=payload.name.strip(),
                description=payload.description.strip() if payload.description else None,
                is_active=payload.is_active,
                permissions=[],
            )
            self.admins.add_role(role)
            return role

        return await self.audit.execute(
            action="roles:create",
            target_type="role",
            target_id=role_id,
            changed_fields={"created": True, "is_active": payload.is_active},
            operation=operation,
        )

    async def update_role(self, role_id: uuid.UUID, payload: RoleUpdateIn) -> Role:
        async def operation() -> Role:
            role = await self.admins.get_role(role_id, for_update=True)
            if role is None:
                raise AppException(status_code=404, code=ErrorCode.ROLE_NOT_FOUND, message="角色不存在")
            if "name" in payload.model_fields_set and payload.name is not None:
                role.name = payload.name.strip()
            if "description" in payload.model_fields_set:
                role.description = payload.description.strip() if payload.description else None
            security_changed = False
            if "is_active" in payload.model_fields_set and payload.is_active is not None:
                security_changed = role.is_active != payload.is_active
                role.is_active = payload.is_active
            if security_changed:
                await self._invalidate_role_admins(role.id)
            return role

        return await self.audit.execute(
            action="roles:update",
            target_type="role",
            target_id=role_id,
            changed_fields={"fields": sorted(payload.model_fields_set)},
            operation=operation,
        )

    async def delete_role(self, role_id: uuid.UUID) -> None:
        async def operation() -> None:
            role = await self.admins.get_role(role_id, for_update=True)
            if role is None:
                raise AppException(status_code=404, code=ErrorCode.ROLE_NOT_FOUND, message="角色不存在")
            if await self.admins.role_admin_count(role_id) > 0:
                raise AppException(status_code=409, code=ErrorCode.STATE_CONFLICT, message="角色仍分配给管理员")
            await self.admins.delete_role(role)

        await self.audit.execute(
            action="roles:delete",
            target_type="role",
            target_id=role_id,
            changed_fields={"deleted": True},
            operation=operation,
        )

    async def assign_role_permissions(self, role_id: uuid.UUID, payload: RolePermissionAssignIn) -> Role:
        codes = list(dict.fromkeys(payload.permission_codes))

        async def operation() -> Role:
            if any(code not in PERMISSION_CODES for code in codes):
                raise AppException(status_code=422, code=ErrorCode.VALIDATION_ERROR, message="权限代码未知")
            role = await self.admins.get_role(role_id, for_update=True)
            if role is None:
                raise AppException(status_code=404, code=ErrorCode.ROLE_NOT_FOUND, message="角色不存在")
            permissions = await self.admins.get_permissions_by_codes(codes)
            if len(permissions) != len(codes):
                raise AppException(
                    status_code=409,
                    code=ErrorCode.STATE_CONFLICT,
                    message="权限目录尚未同步",
                )
            role.permissions = permissions
            await self._invalidate_role_admins(role.id)
            return role

        return await self.audit.execute(
            action="roles:permissions:assign",
            target_type="role",
            target_id=role_id,
            changed_fields={"permission_count": len(codes)},
            operation=operation,
        )

    async def list_permissions(self) -> list[PermissionRead]:
        return [PermissionRead.model_validate(item) for item in await self.admins.list_permissions()]

    async def list_login_events(self, *, page: int, page_size: int) -> LoginEventPage:
        items, total = await self.security.list_login_events(page=page, page_size=page_size)
        return LoginEventPage.create(
            items=[LoginEventRead.model_validate(item) for item in items],
            page=page,
            page_size=page_size,
            total=total,
        )

    async def list_audit_events(self, *, page: int, page_size: int) -> AuditEventPage:
        items, total = await self.security.list_audit_events(page=page, page_size=page_size)
        return AuditEventPage.create(
            items=[AuditEventRead.model_validate(item) for item in items],
            page=page,
            page_size=page_size,
            total=total,
        )

    async def list_request_logs(self, *, page: int, page_size: int) -> RequestLogPage:
        if self.settings.request_log_mode != "metadata":
            raise AppException(
                status_code=409,
                code=ErrorCode.STATE_CONFLICT,
                message="请求元数据日志功能已关闭",
            )
        items, total = await self.request_logs.list_logs(page=page, page_size=page_size)
        return RequestLogPage.create(
            items=[RequestLogRead.model_validate(item) for item in items],
            page=page,
            page_size=page_size,
            total=total,
        )

    async def _protect_last_superuser(self) -> None:
        if await self.admins.count_active_superusers() <= 1:
            raise AppException(
                status_code=409,
                code=ErrorCode.LAST_SUPERUSER_PROTECTED,
                message="最后一名启用的超级管理员受保护",
            )

    async def _invalidate_role_admins(self, role_id: uuid.UUID) -> None:
        for admin in await self.admins.get_admins_by_role(role_id):
            admin.credential_version += 1
            await self.sessions.revoke_admin_for_admin(admin.id, reason="role_permissions_changed")


__all__ = ["AdminManagementService"]
