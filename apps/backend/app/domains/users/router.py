import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response

from app.api.dependencies import (
    CurrentUser,
    UserAccountServiceDependency,
    get_current_user,
    get_request_settings,
    require_web_csrf,
)
from app.core.context import current_request_id
from app.core.cookies import WEB_COOKIES, clear_auth_cookies, set_auth_cookies
from app.core.privacy import masked_ip
from app.core.response import ResponseModel, success_response
from app.db.models import UserSession
from app.domains.auth.schemas import RefreshSessionOut, UserPrincipalOut

from .schemas import AccountDeleteIn, ActionResult, PasswordChangeIn, SessionRead, UserUpdateIn

router = APIRouter(prefix="/users/me", tags=["users"])


def _session_read(item: UserSession, current_session_id: uuid.UUID) -> SessionRead:
    return SessionRead(
        id=item.id,
        device_name=item.device_name,
        ip_masked=masked_ip(item.ip_address),
        user_agent_summary=item.user_agent_summary,
        created_at=item.created_at,
        last_seen_at=item.last_seen_at,
        idle_expires_at=item.idle_expires_at,
        absolute_expires_at=item.absolute_expires_at,
        is_current=item.id == current_session_id,
        revoked_at=item.revoked_at,
    )


@router.get("", response_model=ResponseModel[UserPrincipalOut], summary="Get the current user")
async def get_me(
    current: Annotated[CurrentUser, Depends(get_current_user)],
) -> ResponseModel[UserPrincipalOut]:
    return success_response(data=UserPrincipalOut.model_validate(current.user), request_id=current_request_id())


@router.patch("", response_model=ResponseModel[UserPrincipalOut], summary="Update the current user profile")
async def update_me(
    payload: UserUpdateIn,
    service: UserAccountServiceDependency,
    current: Annotated[CurrentUser, Depends(require_web_csrf)],
) -> ResponseModel[UserPrincipalOut]:
    user = await service.update_profile(current.user.id, payload)
    return success_response(
        data=UserPrincipalOut.model_validate(user), request_id=current_request_id(), message="Profile updated"
    )


@router.post("/password", response_model=ResponseModel[RefreshSessionOut], summary="Change the current user password")
async def change_password(
    payload: PasswordChangeIn,
    request: Request,
    response: Response,
    service: UserAccountServiceDependency,
    current: Annotated[CurrentUser, Depends(require_web_csrf)],
) -> ResponseModel[RefreshSessionOut]:
    artifacts = await service.change_password(
        user=current.user,
        login_session=current.login_session,
        payload=payload,
    )
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


@router.get("/sessions", response_model=ResponseModel[list[SessionRead]], summary="List current user sessions")
async def list_sessions(
    service: UserAccountServiceDependency,
    current: Annotated[CurrentUser, Depends(get_current_user)],
) -> ResponseModel[list[SessionRead]]:
    sessions = await service.list_sessions(current.user.id)
    return success_response(
        data=[_session_read(item, current.login_session.id) for item in sessions],
        request_id=current_request_id(),
    )


@router.delete(
    "/sessions/{session_id}", response_model=ResponseModel[ActionResult], summary="Revoke a current user session"
)
async def revoke_session(
    session_id: uuid.UUID,
    request: Request,
    response: Response,
    service: UserAccountServiceDependency,
    current: Annotated[CurrentUser, Depends(require_web_csrf)],
) -> ResponseModel[ActionResult]:
    await service.revoke_session(user_id=current.user.id, session_id=session_id)
    if session_id == current.login_session.id:
        clear_auth_cookies(response, names=WEB_COOKIES, settings=get_request_settings(request))
    return success_response(data=ActionResult(), request_id=current_request_id(), message="Session revoked")


@router.post(
    "/sessions/revoke-others",
    response_model=ResponseModel[ActionResult],
    summary="Revoke all other current user sessions",
)
async def revoke_other_sessions(
    service: UserAccountServiceDependency,
    current: Annotated[CurrentUser, Depends(require_web_csrf)],
) -> ResponseModel[ActionResult]:
    await service.revoke_other_sessions(user_id=current.user.id, current_session_id=current.login_session.id)
    return success_response(data=ActionResult(), request_id=current_request_id(), message="Other sessions revoked")


@router.delete("", response_model=ResponseModel[ActionResult], summary="Delete and anonymize the current user account")
async def delete_account(
    payload: AccountDeleteIn,
    request: Request,
    response: Response,
    service: UserAccountServiceDependency,
    current: Annotated[CurrentUser, Depends(require_web_csrf)],
) -> ResponseModel[ActionResult]:
    await service.delete_account(user=current.user, payload=payload)
    clear_auth_cookies(response, names=WEB_COOKIES, settings=get_request_settings(request))
    return success_response(data=ActionResult(), request_id=current_request_id(), message="Account deleted")


__all__ = ["router"]
