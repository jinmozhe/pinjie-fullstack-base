import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Header, Query, Request

from app.api.dependencies import (
    AdminManagementServiceDependency,
    CurrentAdmin,
    consume_admin_confirmation,
    require_admin_confirmation,
    require_admin_csrf,
    require_permission,
)
from app.core.context import current_request_id
from app.core.privacy import masked_ip
from app.core.response import ResponseModel, success_response
from app.db.models import AdminSession, UserSession
from app.domains.auth.schemas import UserPrincipalOut
from app.domains.users.schemas import ActionResult, SessionRead, UserUpdateIn

from .permissions import PermissionCode
from .presenters import admin_read, role_read
from .schemas import (
    AdminCreateIn,
    AdminPage,
    AdminRead,
    AdminRoleAssignIn,
    AdminUpdateIn,
    AuditEventPage,
    ConfirmationAction,
    LoginEventPage,
    PasswordResetIn,
    PermissionRead,
    RequestLogPage,
    RoleCreateIn,
    RolePage,
    RolePermissionAssignIn,
    RoleRead,
    RoleUpdateIn,
    StatusUpdateIn,
    UserPage,
)

router = APIRouter(prefix="/admin", tags=["administration"])


def _session_read(item: UserSession | AdminSession) -> SessionRead:
    return SessionRead(
        id=item.id,
        device_name=item.device_name,
        ip_masked=masked_ip(item.ip_address),
        user_agent_summary=item.user_agent_summary,
        created_at=item.created_at,
        last_seen_at=item.last_seen_at,
        idle_expires_at=item.idle_expires_at,
        absolute_expires_at=item.absolute_expires_at,
        is_current=False,
        revoked_at=item.revoked_at,
    )


@router.get(
    "/users",
    response_model=ResponseModel[UserPage],
    dependencies=[Depends(require_permission(PermissionCode.USERS_READ))],
    summary="List users",
)
async def list_users(
    service: AdminManagementServiceDependency,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    search: Annotated[str | None, Query(max_length=100)] = None,
) -> ResponseModel[UserPage]:
    result = await service.list_users(page=page, page_size=page_size, search=search)
    return success_response(data=result, request_id=current_request_id())


@router.get(
    "/users/{user_id}",
    response_model=ResponseModel[UserPrincipalOut],
    dependencies=[Depends(require_permission(PermissionCode.USERS_READ))],
    summary="Get a user",
)
async def get_user(user_id: uuid.UUID, service: AdminManagementServiceDependency) -> ResponseModel[UserPrincipalOut]:
    return success_response(
        data=UserPrincipalOut.model_validate(await service.get_user(user_id)), request_id=current_request_id()
    )


@router.patch(
    "/users/{user_id}",
    response_model=ResponseModel[UserPrincipalOut],
    dependencies=[Depends(require_admin_csrf), Depends(require_permission(PermissionCode.USERS_UPDATE))],
    summary="Update a user",
)
async def update_user(
    user_id: uuid.UUID,
    payload: UserUpdateIn,
    service: AdminManagementServiceDependency,
) -> ResponseModel[UserPrincipalOut]:
    user = await service.update_user(user_id, payload)
    return success_response(
        data=UserPrincipalOut.model_validate(user), request_id=current_request_id(), message="User updated"
    )


@router.patch(
    "/users/{user_id}/status",
    response_model=ResponseModel[UserPrincipalOut],
    dependencies=[Depends(require_permission(PermissionCode.USERS_UPDATE))],
    summary="Change a user status",
)
async def set_user_status(
    user_id: uuid.UUID,
    payload: StatusUpdateIn,
    request: Request,
    service: AdminManagementServiceDependency,
    current: Annotated[CurrentAdmin, Depends(require_admin_csrf)],
    confirmation_token: Annotated[str | None, Header(alias="X-Admin-Confirmation")] = None,
) -> ResponseModel[UserPrincipalOut]:
    if not payload.is_active:
        await consume_admin_confirmation(request, current, ConfirmationAction.USER_DISABLE, confirmation_token)
    user = await service.set_user_status(user_id, payload)
    return success_response(
        data=UserPrincipalOut.model_validate(user), request_id=current_request_id(), message="User status updated"
    )


@router.put(
    "/users/{user_id}/credentials/password",
    response_model=ResponseModel[ActionResult],
    dependencies=[
        Depends(require_permission(PermissionCode.USERS_CREDENTIALS_RESET)),
        Depends(require_admin_confirmation(ConfirmationAction.USER_PASSWORD_RESET)),
    ],
    summary="Reset a user password",
)
async def reset_user_password(
    user_id: uuid.UUID,
    payload: PasswordResetIn,
    service: AdminManagementServiceDependency,
) -> ResponseModel[ActionResult]:
    await service.reset_user_password(user_id, payload)
    return success_response(data=ActionResult(), request_id=current_request_id(), message="Password reset")


@router.get(
    "/users/{user_id}/sessions",
    response_model=ResponseModel[list[SessionRead]],
    dependencies=[Depends(require_permission(PermissionCode.USERS_SESSIONS_READ))],
    summary="List user sessions",
)
async def list_user_sessions(
    user_id: uuid.UUID, service: AdminManagementServiceDependency
) -> ResponseModel[list[SessionRead]]:
    return success_response(
        data=[_session_read(item) for item in await service.list_user_sessions(user_id)],
        request_id=current_request_id(),
    )


@router.delete(
    "/users/{user_id}/sessions/{session_id}",
    response_model=ResponseModel[ActionResult],
    dependencies=[
        Depends(require_permission(PermissionCode.USERS_SESSIONS_REVOKE)),
        Depends(require_admin_confirmation(ConfirmationAction.USER_SESSION_REVOKE)),
    ],
    summary="Revoke a user session",
)
async def revoke_user_session(
    user_id: uuid.UUID,
    session_id: uuid.UUID,
    service: AdminManagementServiceDependency,
) -> ResponseModel[ActionResult]:
    await service.revoke_user_session(user_id, session_id)
    return success_response(data=ActionResult(), request_id=current_request_id(), message="Session revoked")


@router.post(
    "/users/{user_id}/sessions/revoke-all",
    response_model=ResponseModel[ActionResult],
    dependencies=[
        Depends(require_permission(PermissionCode.USERS_SESSIONS_REVOKE)),
        Depends(require_admin_confirmation(ConfirmationAction.USER_SESSION_REVOKE)),
    ],
    summary="Revoke all user sessions",
)
async def revoke_all_user_sessions(
    user_id: uuid.UUID, service: AdminManagementServiceDependency
) -> ResponseModel[ActionResult]:
    await service.revoke_all_user_sessions(user_id)
    return success_response(data=ActionResult(), request_id=current_request_id(), message="Sessions revoked")


@router.get(
    "/admins",
    response_model=ResponseModel[AdminPage],
    dependencies=[Depends(require_permission(PermissionCode.ADMINS_READ))],
    summary="List administrators",
)
async def list_admins(
    service: AdminManagementServiceDependency,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> ResponseModel[AdminPage]:
    return success_response(
        data=await service.list_admins(page=page, page_size=page_size), request_id=current_request_id()
    )


@router.post(
    "/admins",
    response_model=ResponseModel[AdminRead],
    status_code=201,
    dependencies=[
        Depends(require_permission(PermissionCode.ADMINS_CREATE)),
        Depends(require_admin_confirmation(ConfirmationAction.ADMIN_CREATE)),
    ],
    summary="Create an administrator",
)
async def create_admin(payload: AdminCreateIn, service: AdminManagementServiceDependency) -> ResponseModel[AdminRead]:
    return success_response(
        data=admin_read(await service.create_admin(payload)),
        request_id=current_request_id(),
        message="Administrator created",
    )


@router.get(
    "/admins/{admin_id}",
    response_model=ResponseModel[AdminRead],
    dependencies=[Depends(require_permission(PermissionCode.ADMINS_READ))],
    summary="Get an administrator",
)
async def get_admin(admin_id: uuid.UUID, service: AdminManagementServiceDependency) -> ResponseModel[AdminRead]:
    return success_response(data=admin_read(await service.get_admin(admin_id)), request_id=current_request_id())


@router.patch(
    "/admins/{admin_id}",
    response_model=ResponseModel[AdminRead],
    dependencies=[Depends(require_permission(PermissionCode.ADMINS_UPDATE))],
    summary="Update an administrator",
)
async def update_admin(
    admin_id: uuid.UUID,
    payload: AdminUpdateIn,
    request: Request,
    service: AdminManagementServiceDependency,
    current: Annotated[CurrentAdmin, Depends(require_admin_csrf)],
    confirmation_token: Annotated[str | None, Header(alias="X-Admin-Confirmation")] = None,
) -> ResponseModel[AdminRead]:
    if payload.is_superuser is not None:
        await consume_admin_confirmation(
            request, current, ConfirmationAction.ADMIN_SUPERUSER_CHANGE, confirmation_token
        )
    return success_response(
        data=admin_read(await service.update_admin(admin_id, payload)),
        request_id=current_request_id(),
        message="Administrator updated",
    )


@router.patch(
    "/admins/{admin_id}/status",
    response_model=ResponseModel[AdminRead],
    dependencies=[Depends(require_permission(PermissionCode.ADMINS_UPDATE))],
    summary="Change an administrator status",
)
async def set_admin_status(
    admin_id: uuid.UUID,
    payload: StatusUpdateIn,
    service: AdminManagementServiceDependency,
    _: Annotated[CurrentAdmin, Depends(require_admin_confirmation(ConfirmationAction.ADMIN_STATUS_CHANGE))],
) -> ResponseModel[AdminRead]:
    return success_response(
        data=admin_read(await service.set_admin_status(admin_id, payload)),
        request_id=current_request_id(),
        message="Administrator status updated",
    )


@router.put(
    "/admins/{admin_id}/credentials/password",
    response_model=ResponseModel[ActionResult],
    dependencies=[
        Depends(require_permission(PermissionCode.ADMINS_CREDENTIALS_RESET)),
        Depends(require_admin_confirmation(ConfirmationAction.ADMIN_PASSWORD_RESET)),
    ],
    summary="Reset an administrator password",
)
async def reset_admin_password(
    admin_id: uuid.UUID,
    payload: PasswordResetIn,
    service: AdminManagementServiceDependency,
) -> ResponseModel[ActionResult]:
    await service.reset_admin_password(admin_id, payload)
    return success_response(data=ActionResult(), request_id=current_request_id(), message="Password reset")


@router.put(
    "/admins/{admin_id}/roles",
    response_model=ResponseModel[AdminRead],
    dependencies=[
        Depends(require_permission(PermissionCode.ADMINS_ROLES_ASSIGN)),
        Depends(require_admin_confirmation(ConfirmationAction.ADMIN_ROLES_ASSIGN)),
    ],
    summary="Assign administrator roles",
)
async def assign_admin_roles(
    admin_id: uuid.UUID,
    payload: AdminRoleAssignIn,
    service: AdminManagementServiceDependency,
) -> ResponseModel[AdminRead]:
    return success_response(
        data=admin_read(await service.assign_admin_roles(admin_id, payload)),
        request_id=current_request_id(),
        message="Roles assigned",
    )


@router.get(
    "/admins/{admin_id}/sessions",
    response_model=ResponseModel[list[SessionRead]],
    dependencies=[Depends(require_permission(PermissionCode.ADMINS_SESSIONS_READ))],
    summary="List administrator sessions",
)
async def list_admin_sessions(
    admin_id: uuid.UUID, service: AdminManagementServiceDependency
) -> ResponseModel[list[SessionRead]]:
    return success_response(
        data=[_session_read(item) for item in await service.list_admin_sessions(admin_id)],
        request_id=current_request_id(),
    )


@router.post(
    "/admins/{admin_id}/sessions/revoke-all",
    response_model=ResponseModel[ActionResult],
    dependencies=[
        Depends(require_permission(PermissionCode.ADMINS_SESSIONS_REVOKE)),
        Depends(require_admin_confirmation(ConfirmationAction.ADMIN_SESSIONS_REVOKE)),
    ],
    summary="Revoke all administrator sessions",
)
async def revoke_all_admin_sessions(
    admin_id: uuid.UUID, service: AdminManagementServiceDependency
) -> ResponseModel[ActionResult]:
    await service.revoke_all_admin_sessions(admin_id)
    return success_response(data=ActionResult(), request_id=current_request_id(), message="Sessions revoked")


@router.get(
    "/roles",
    response_model=ResponseModel[RolePage],
    dependencies=[Depends(require_permission(PermissionCode.ROLES_READ))],
    summary="List roles",
)
async def list_roles(
    service: AdminManagementServiceDependency,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> ResponseModel[RolePage]:
    return success_response(
        data=await service.list_roles(page=page, page_size=page_size), request_id=current_request_id()
    )


@router.post(
    "/roles",
    response_model=ResponseModel[RoleRead],
    status_code=201,
    dependencies=[Depends(require_admin_csrf), Depends(require_permission(PermissionCode.ROLES_CREATE))],
    summary="Create a role",
)
async def create_role(payload: RoleCreateIn, service: AdminManagementServiceDependency) -> ResponseModel[RoleRead]:
    return success_response(
        data=role_read(await service.create_role(payload)), request_id=current_request_id(), message="Role created"
    )


@router.get(
    "/roles/{role_id}",
    response_model=ResponseModel[RoleRead],
    dependencies=[Depends(require_permission(PermissionCode.ROLES_READ))],
    summary="Get a role",
)
async def get_role(role_id: uuid.UUID, service: AdminManagementServiceDependency) -> ResponseModel[RoleRead]:
    return success_response(data=role_read(await service.get_role(role_id)), request_id=current_request_id())


@router.patch(
    "/roles/{role_id}",
    response_model=ResponseModel[RoleRead],
    dependencies=[Depends(require_permission(PermissionCode.ROLES_UPDATE))],
    summary="Update a role",
)
async def update_role(
    role_id: uuid.UUID,
    payload: RoleUpdateIn,
    request: Request,
    service: AdminManagementServiceDependency,
    current: Annotated[CurrentAdmin, Depends(require_admin_csrf)],
    confirmation_token: Annotated[str | None, Header(alias="X-Admin-Confirmation")] = None,
) -> ResponseModel[RoleRead]:
    if payload.is_active is False:
        await consume_admin_confirmation(request, current, ConfirmationAction.ROLE_DELETE, confirmation_token)
    return success_response(
        data=role_read(await service.update_role(role_id, payload)),
        request_id=current_request_id(),
        message="Role updated",
    )


@router.delete(
    "/roles/{role_id}",
    response_model=ResponseModel[ActionResult],
    dependencies=[
        Depends(require_permission(PermissionCode.ROLES_DELETE)),
        Depends(require_admin_confirmation(ConfirmationAction.ROLE_DELETE)),
    ],
    summary="Delete an unused role",
)
async def delete_role(role_id: uuid.UUID, service: AdminManagementServiceDependency) -> ResponseModel[ActionResult]:
    await service.delete_role(role_id)
    return success_response(data=ActionResult(), request_id=current_request_id(), message="Role deleted")


@router.put(
    "/roles/{role_id}/permissions",
    response_model=ResponseModel[RoleRead],
    dependencies=[
        Depends(require_permission(PermissionCode.ROLES_PERMISSIONS_ASSIGN)),
        Depends(require_admin_confirmation(ConfirmationAction.ROLE_PERMISSIONS_ASSIGN)),
    ],
    summary="Assign role permissions",
)
async def assign_role_permissions(
    role_id: uuid.UUID,
    payload: RolePermissionAssignIn,
    service: AdminManagementServiceDependency,
) -> ResponseModel[RoleRead]:
    return success_response(
        data=role_read(await service.assign_role_permissions(role_id, payload)),
        request_id=current_request_id(),
        message="Permissions assigned",
    )


@router.get(
    "/permissions",
    response_model=ResponseModel[list[PermissionRead]],
    dependencies=[Depends(require_permission(PermissionCode.PERMISSIONS_READ))],
    summary="List the source-controlled permission catalog",
)
async def list_permissions(
    service: AdminManagementServiceDependency,
) -> ResponseModel[list[PermissionRead]]:
    return success_response(data=await service.list_permissions(), request_id=current_request_id())


@router.get(
    "/security/login-events",
    response_model=ResponseModel[LoginEventPage],
    dependencies=[Depends(require_permission(PermissionCode.SECURITY_LOGIN_EVENTS_READ))],
    summary="List authentication security events",
)
async def list_login_events(
    service: AdminManagementServiceDependency,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> ResponseModel[LoginEventPage]:
    return success_response(
        data=await service.list_login_events(page=page, page_size=page_size), request_id=current_request_id()
    )


@router.get(
    "/security/audit-events",
    response_model=ResponseModel[AuditEventPage],
    dependencies=[Depends(require_permission(PermissionCode.SECURITY_AUDIT_EVENTS_READ))],
    summary="List administrator audit events",
)
async def list_audit_events(
    service: AdminManagementServiceDependency,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> ResponseModel[AuditEventPage]:
    return success_response(
        data=await service.list_audit_events(page=page, page_size=page_size), request_id=current_request_id()
    )


@router.get(
    "/system/request-logs",
    response_model=ResponseModel[RequestLogPage],
    dependencies=[Depends(require_permission(PermissionCode.SYSTEM_REQUEST_LOGS_READ))],
    summary="List optional request metadata logs",
)
async def list_request_logs(
    service: AdminManagementServiceDependency,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> ResponseModel[RequestLogPage]:
    return success_response(
        data=await service.list_request_logs(page=page, page_size=page_size), request_id=current_request_id()
    )


__all__ = ["router"]
