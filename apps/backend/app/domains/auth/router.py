from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, Request, Response

from app.api.dependencies import (
    WebAuthServiceDependency,
    get_request_settings,
    require_browser_origin,
    require_web_csrf_pair,
)
from app.core.context import current_request_id
from app.core.cookies import WEB_COOKIES, clear_auth_cookies, set_auth_cookies
from app.core.error_codes import ErrorCode
from app.core.exceptions import AppException
from app.core.response import ResponseModel, success_response
from app.services.authentication import SessionArtifacts

from .schemas import RefreshSessionOut, UserAuthSessionOut, UserLoginIn, UserPrincipalOut, UserRegisterIn

router = APIRouter(prefix="/auth", tags=["authentication"])


def _set_session_cookies(response: Response, request: Request, artifacts: SessionArtifacts) -> None:
    settings = get_request_settings(request)
    set_auth_cookies(
        response,
        names=WEB_COOKIES,
        access_token=artifacts.access_token,
        refresh_token=artifacts.refresh_token,
        csrf_token=artifacts.csrf_token,
        access_max_age=settings.web_access_ttl_seconds,
        refresh_max_age=settings.refresh_idle_ttl_days * 86400,
        settings=settings,
    )


@router.post(
    "/register",
    response_model=ResponseModel[UserAuthSessionOut],
    status_code=201,
    dependencies=[Depends(require_browser_origin)],
    summary="Register a browser user account",
)
async def register(
    payload: UserRegisterIn,
    request: Request,
    response: Response,
    service: WebAuthServiceDependency,
) -> ResponseModel[UserAuthSessionOut]:
    user, artifacts = await service.register(payload)
    _set_session_cookies(response, request, artifacts)
    return success_response(
        data=UserAuthSessionOut(
            principal=UserPrincipalOut.model_validate(user),
            session_id=artifacts.session_id,
            access_expires_at=artifacts.access_expires_at,
            idle_expires_at=artifacts.idle_expires_at,
            absolute_expires_at=artifacts.absolute_expires_at,
        ),
        request_id=current_request_id(),
        message="Registered",
    )


@router.post(
    "/login",
    response_model=ResponseModel[UserAuthSessionOut],
    dependencies=[Depends(require_browser_origin)],
    summary="Sign in a browser user",
)
async def login(
    payload: UserLoginIn,
    request: Request,
    response: Response,
    service: WebAuthServiceDependency,
) -> ResponseModel[UserAuthSessionOut]:
    user, artifacts = await service.login(payload)
    _set_session_cookies(response, request, artifacts)
    return success_response(
        data=UserAuthSessionOut(
            principal=UserPrincipalOut.model_validate(user),
            session_id=artifacts.session_id,
            access_expires_at=artifacts.access_expires_at,
            idle_expires_at=artifacts.idle_expires_at,
            absolute_expires_at=artifacts.absolute_expires_at,
        ),
        request_id=current_request_id(),
        message="Authenticated",
    )


@router.post("/refresh", response_model=ResponseModel[RefreshSessionOut], summary="Rotate the browser refresh token")
async def refresh(
    request: Request,
    response: Response,
    service: WebAuthServiceDependency,
    csrf_token: Annotated[str, Depends(require_web_csrf_pair)],
    refresh_token: Annotated[str | None, Cookie(alias=WEB_COOKIES.refresh)] = None,
) -> ResponseModel[RefreshSessionOut]:
    request.state.clear_auth_profile = "web"
    if not refresh_token:
        raise AppException(
            status_code=401,
            code=ErrorCode.AUTH_REQUIRED,
            message="Refresh authentication is required",
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


@router.post("/logout", response_model=ResponseModel[bool], summary="Sign out the current browser session")
async def logout(
    request: Request,
    response: Response,
    service: WebAuthServiceDependency,
    csrf_token: Annotated[str, Depends(require_web_csrf_pair)],
    refresh_token: Annotated[str | None, Cookie(alias=WEB_COOKIES.refresh)] = None,
) -> ResponseModel[bool]:
    request.state.clear_auth_profile = "web"
    if not refresh_token:
        raise AppException(
            status_code=401,
            code=ErrorCode.AUTH_REQUIRED,
            message="Refresh authentication is required",
            headers={"WWW-Authenticate": "Cookie"},
        )
    await service.logout(refresh_token, csrf_token)
    clear_auth_cookies(response, names=WEB_COOKIES, settings=get_request_settings(request))
    request.state.clear_auth_profile = None
    return success_response(data=True, request_id=current_request_id(), message="Logged out")


__all__ = ["router"]
