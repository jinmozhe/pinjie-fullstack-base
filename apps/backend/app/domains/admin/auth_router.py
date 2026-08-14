from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, Request, Response

from app.api.dependencies import (
    AdminAccountServiceDependency,
    AdminAuthServiceDependency,
    CurrentAdmin,
    get_current_admin,
    get_request_settings,
    require_admin_csrf,
    require_admin_csrf_pair,
    require_browser_origin,
)
from app.core.context import current_request_id
from app.core.cookies import ADMIN_COOKIES, clear_auth_cookies, set_auth_cookies
from app.core.error_codes import ErrorCode
from app.core.exceptions import AppException
from app.core.response import ResponseModel, success_response
from app.domains.auth.schemas import RefreshSessionOut
from app.domains.users.schemas import PasswordChangeIn
from app.services.authentication import SessionArtifacts

from .presenters import admin_read
from .schemas import AdminAuthSessionOut, AdminConfirmIn, AdminConfirmOut, AdminLoginIn, AdminRead

router = APIRouter(prefix="/admin/auth", tags=["admin-authentication"])


def _set_session_cookies(response: Response, request: Request, artifacts: SessionArtifacts) -> None:
    settings = get_request_settings(request)
    set_auth_cookies(
        response,
        names=ADMIN_COOKIES,
        access_token=artifacts.access_token,
        refresh_token=artifacts.refresh_token,
        csrf_token=artifacts.csrf_token,
        access_max_age=settings.admin_access_ttl_seconds,
        refresh_max_age=settings.refresh_idle_ttl_days * 86400,
        settings=settings,
    )


@router.post(
    "/login",
    response_model=ResponseModel[AdminAuthSessionOut],
    dependencies=[Depends(require_browser_origin)],
    summary="Sign in an administrator",
)
async def login(
    payload: AdminLoginIn,
    request: Request,
    response: Response,
    service: AdminAuthServiceDependency,
) -> ResponseModel[AdminAuthSessionOut]:
    admin, artifacts = await service.login(payload)
    _set_session_cookies(response, request, artifacts)
    return success_response(
        data=AdminAuthSessionOut(
            principal=admin_read(admin),
            session_id=artifacts.session_id,
            access_expires_at=artifacts.access_expires_at,
            idle_expires_at=artifacts.idle_expires_at,
            absolute_expires_at=artifacts.absolute_expires_at,
        ),
        request_id=current_request_id(),
        message="Authenticated",
    )


@router.post("/refresh", response_model=ResponseModel[RefreshSessionOut], summary="Rotate administrator refresh token")
async def refresh(
    request: Request,
    response: Response,
    service: AdminAuthServiceDependency,
    csrf_token: Annotated[str, Depends(require_admin_csrf_pair)],
    refresh_token: Annotated[str | None, Cookie(alias=ADMIN_COOKIES.refresh)] = None,
) -> ResponseModel[RefreshSessionOut]:
    request.state.clear_auth_profile = "admin"
    if not refresh_token:
        raise AppException(
            status_code=401,
            code=ErrorCode.AUTH_REQUIRED,
            message="Administrator refresh authentication is required",
            headers={"WWW-Authenticate": "Cookie"},
        )
    artifacts = await service.refresh(refresh_token, csrf_token)
    request.state.clear_auth_profile = None
    _set_session_cookies(response, request, artifacts)
    return success_response(
        data=RefreshSessionOut(
            session_id=artifacts.session_id,
            access_expires_at=artifacts.access_expires_at,
            idle_expires_at=artifacts.idle_expires_at,
            absolute_expires_at=artifacts.absolute_expires_at,
        ),
        request_id=current_request_id(),
        message="Session refreshed",
    )


@router.post("/logout", response_model=ResponseModel[bool], summary="Sign out the current administrator session")
async def logout(
    request: Request,
    response: Response,
    service: AdminAuthServiceDependency,
    csrf_token: Annotated[str, Depends(require_admin_csrf_pair)],
    refresh_token: Annotated[str | None, Cookie(alias=ADMIN_COOKIES.refresh)] = None,
) -> ResponseModel[bool]:
    request.state.clear_auth_profile = "admin"
    if not refresh_token:
        raise AppException(
            status_code=401,
            code=ErrorCode.AUTH_REQUIRED,
            message="Administrator refresh authentication is required",
            headers={"WWW-Authenticate": "Cookie"},
        )
    await service.logout(refresh_token, csrf_token)
    clear_auth_cookies(response, names=ADMIN_COOKIES, settings=get_request_settings(request))
    request.state.clear_auth_profile = None
    return success_response(data=True, request_id=current_request_id(), message="Logged out")


@router.get("/me", response_model=ResponseModel[AdminRead], summary="Get the current administrator")
async def get_me(current: Annotated[CurrentAdmin, Depends(get_current_admin)]) -> ResponseModel[AdminRead]:
    return success_response(data=admin_read(current.admin), request_id=current_request_id())


@router.post("/password", response_model=ResponseModel[RefreshSessionOut], summary="Change administrator password")
async def change_password(
    payload: PasswordChangeIn,
    request: Request,
    response: Response,
    service: AdminAccountServiceDependency,
    current: Annotated[CurrentAdmin, Depends(require_admin_csrf)],
) -> ResponseModel[RefreshSessionOut]:
    artifacts = await service.change_password(
        admin=current.admin,
        login_session=current.login_session,
        payload=payload,
    )
    _set_session_cookies(response, request, artifacts)
    return success_response(
        data=RefreshSessionOut(
            session_id=artifacts.session_id,
            access_expires_at=artifacts.access_expires_at,
            idle_expires_at=artifacts.idle_expires_at,
            absolute_expires_at=artifacts.absolute_expires_at,
        ),
        request_id=current_request_id(),
        message="Password changed",
    )


@router.post(
    "/confirm", response_model=ResponseModel[AdminConfirmOut], summary="Confirm a sensitive administrator action"
)
async def confirm(
    payload: AdminConfirmIn,
    response: Response,
    service: AdminAccountServiceDependency,
    current: Annotated[CurrentAdmin, Depends(require_admin_csrf)],
) -> ResponseModel[AdminConfirmOut]:
    result = await service.create_confirmation(
        admin=current.admin,
        login_session=current.login_session,
        payload=payload,
    )
    response.headers["Cache-Control"] = "no-store"
    return success_response(data=result, request_id=current_request_id(), message="Confirmed")


__all__ = ["router"]
