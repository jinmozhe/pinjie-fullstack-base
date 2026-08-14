import json
import uuid
from datetime import UTC, datetime, timedelta

from redis.asyncio import Redis
from redis.exceptions import RedisError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.cache_keys import cache_keys
from app.core.config import Settings
from app.core.error_codes import ErrorCode
from app.core.exceptions import AppException
from app.core.identifiers import new_uuid7
from app.core.request_metadata import RequestMetadata
from app.core.security import PasswordManager, create_access_token, new_opaque_token, token_digest
from app.db.models import Admin, AdminRefreshToken, AdminSession, User, UserRefreshToken, UserSession
from app.db.repositories import AdminRepository, SecurityRepository, SessionRepository, UserRepository
from app.db.transaction import transaction_scope
from app.domains.admin.schemas import AdminConfirmIn, AdminConfirmOut
from app.domains.users.schemas import AccountDeleteIn, PasswordChangeIn, UserUpdateIn
from app.services.authentication import SessionArtifacts
from app.services.security_events import login_event


class UserAccountService:
    def __init__(
        self,
        *,
        session: AsyncSession,
        settings: Settings,
        password_manager: PasswordManager,
        metadata: RequestMetadata,
    ) -> None:
        self.session = session
        self.settings = settings
        self.password_manager = password_manager
        self.metadata = metadata
        self.users = UserRepository(session)
        self.sessions = SessionRepository(session)
        web_secret, _, web_hmac, _ = settings.authentication_secrets()
        self.jwt_secret = web_secret
        self.hmac_key = web_hmac

    async def update_profile(self, user_id: uuid.UUID, payload: UserUpdateIn) -> User:
        async with transaction_scope(self.session):
            user = await self.users.get(user_id, for_update=True)
            if user is None or user.deleted_at is not None:
                raise AppException(status_code=404, code=ErrorCode.USER_NOT_FOUND, message="User was not found")
            if "email" in payload.model_fields_set and payload.email:
                existing = await self.users.get_by_email(payload.email)
                if existing is not None and existing.id != user.id:
                    raise AppException(
                        status_code=409,
                        code=ErrorCode.STATE_CONFLICT,
                        message="Email is already in use",
                    )
            if "display_name" in payload.model_fields_set:
                user.display_name = payload.display_name.strip() if payload.display_name else None
            if "email" in payload.model_fields_set:
                user.email = payload.email
        return user

    async def change_password(
        self,
        *,
        user: User,
        login_session: UserSession,
        payload: PasswordChangeIn,
    ) -> SessionArtifacts:
        if not await self.password_manager.verify(payload.current_password, user.password_hash):
            raise AppException(
                status_code=401,
                code=ErrorCode.AUTH_INVALID_CREDENTIALS,
                message="Current password is incorrect",
            )
        new_hash = await self.password_manager.hash(payload.new_password)
        new_refresh = new_opaque_token()
        new_csrf = new_opaque_token()
        now = datetime.now(UTC)
        async with transaction_scope(self.session):
            locked = await self.users.get(user.id, for_update=True)
            current_session = await self.sessions.get_web(login_session.id, for_update=True)
            if locked is None or current_session is None or current_session.revoked_at is not None:
                raise AppException(
                    status_code=401,
                    code=ErrorCode.AUTH_SESSION_REVOKED,
                    message="Authentication session is no longer valid",
                )
            locked.password_hash = new_hash
            locked.credential_version += 1
            await self.sessions.revoke_web_for_user(locked.id, reason="password_changed", except_id=current_session.id)
            await self.sessions.revoke_web_refresh_tokens(current_session.id, reason="password_changed", now=now)
            idle = min(now + timedelta(days=self.settings.refresh_idle_ttl_days), current_session.absolute_expires_at)
            current_session.csrf_digest = token_digest(new_csrf, self.hmac_key)
            current_session.last_seen_at = now
            current_session.idle_expires_at = idle
            self.session.add(
                UserRefreshToken(
                    id=new_uuid7(),
                    session_id=current_session.id,
                    token_digest=token_digest(new_refresh, self.hmac_key),
                    issued_at=now,
                    expires_at=idle,
                    consumed_at=None,
                    revoked_at=None,
                    revoke_reason=None,
                    replaced_by_id=None,
                )
            )
            SecurityRepository(self.session).add_login_event(
                login_event(
                    principal_type="user",
                    principal_id=locked.id,
                    identifier_digest=None,
                    event_type="password_change",
                    succeeded=True,
                    reason_code="PASSWORD_CHANGED",
                    metadata=self.metadata,
                    now=now,
                )
            )
            credential_version = locked.credential_version
            absolute = current_session.absolute_expires_at
        access, access_expires = create_access_token(
            subject_id=user.id,
            session_id=login_session.id,
            credential_version=credential_version,
            audience="pinjie-web",
            issuer=self.settings.jwt_issuer,
            secret=self.jwt_secret,
            ttl_seconds=self.settings.web_access_ttl_seconds,
        )
        return SessionArtifacts(
            session_id=login_session.id,
            access_token=access,
            refresh_token=new_refresh,
            csrf_token=new_csrf,
            access_expires_at=access_expires,
            idle_expires_at=idle,
            absolute_expires_at=absolute,
        )

    async def revoke_session(self, *, user_id: uuid.UUID, session_id: uuid.UUID) -> bool:
        async with transaction_scope(self.session):
            target = await self.sessions.get_web_for_user(session_id, user_id)
            if target is None:
                raise AppException(status_code=404, code=ErrorCode.NOT_FOUND, message="Session was not found")
            return await self.sessions.revoke_web_session(session_id, reason="user_revoked")

    async def list_sessions(self, user_id: uuid.UUID) -> list[UserSession]:
        return await self.sessions.list_web(user_id)

    async def revoke_other_sessions(self, *, user_id: uuid.UUID, current_session_id: uuid.UUID) -> None:
        async with transaction_scope(self.session):
            await self.sessions.revoke_web_for_user(user_id, reason="user_revoked_others", except_id=current_session_id)

    async def delete_account(self, *, user: User, payload: AccountDeleteIn) -> None:
        if not await self.password_manager.verify(payload.current_password, user.password_hash):
            raise AppException(
                status_code=401,
                code=ErrorCode.AUTH_INVALID_CREDENTIALS,
                message="Current password is incorrect",
            )
        replacement_hash = await self.password_manager.hash(new_opaque_token())
        now = datetime.now(UTC)
        async with transaction_scope(self.session):
            locked = await self.users.get(user.id, for_update=True)
            if locked is None or locked.deleted_at is not None:
                raise AppException(status_code=404, code=ErrorCode.USER_NOT_FOUND, message="User was not found")
            locked.username = f"deleted-{locked.id.hex}"
            locked.email = None
            locked.display_name = None
            locked.password_hash = replacement_hash
            locked.is_active = False
            locked.credential_version += 1
            locked.deleted_at = now
            await self.sessions.revoke_web_for_user(locked.id, reason="account_deleted")


class AdminAccountService:
    def __init__(
        self,
        *,
        session: AsyncSession,
        session_factory: async_sessionmaker[AsyncSession],
        redis: Redis | None,
        settings: Settings,
        password_manager: PasswordManager,
        metadata: RequestMetadata,
    ) -> None:
        self.session = session
        self.session_factory = session_factory
        self.redis = redis
        self.settings = settings
        self.password_manager = password_manager
        self.metadata = metadata
        self.admins = AdminRepository(session)
        self.sessions = SessionRepository(session)
        _, admin_secret, _, admin_hmac = settings.authentication_secrets()
        self.jwt_secret = admin_secret
        self.hmac_key = admin_hmac

    async def change_password(
        self,
        *,
        admin: Admin,
        login_session: AdminSession,
        payload: PasswordChangeIn,
    ) -> SessionArtifacts:
        if not await self.password_manager.verify(payload.current_password, admin.password_hash):
            raise AppException(
                status_code=401,
                code=ErrorCode.AUTH_INVALID_CREDENTIALS,
                message="Current password is incorrect",
            )
        new_hash = await self.password_manager.hash(payload.new_password)
        new_refresh = new_opaque_token()
        new_csrf = new_opaque_token()
        now = datetime.now(UTC)
        async with transaction_scope(self.session):
            locked = await self.admins.get(admin.id, for_update=True)
            current_session = await self.sessions.get_admin(login_session.id, for_update=True)
            if locked is None or current_session is None or current_session.revoked_at is not None:
                raise AppException(
                    status_code=401,
                    code=ErrorCode.AUTH_SESSION_REVOKED,
                    message="Administrator session is no longer valid",
                )
            locked.password_hash = new_hash
            locked.credential_version += 1
            await self.sessions.revoke_admin_for_admin(
                locked.id, reason="password_changed", except_id=current_session.id
            )
            await self.sessions.revoke_admin_refresh_tokens(current_session.id, reason="password_changed", now=now)
            idle = min(now + timedelta(days=self.settings.refresh_idle_ttl_days), current_session.absolute_expires_at)
            current_session.csrf_digest = token_digest(new_csrf, self.hmac_key)
            current_session.last_seen_at = now
            current_session.idle_expires_at = idle
            self.session.add(
                AdminRefreshToken(
                    id=new_uuid7(),
                    session_id=current_session.id,
                    token_digest=token_digest(new_refresh, self.hmac_key),
                    issued_at=now,
                    expires_at=idle,
                    consumed_at=None,
                    revoked_at=None,
                    revoke_reason=None,
                    replaced_by_id=None,
                )
            )
            SecurityRepository(self.session).add_login_event(
                login_event(
                    principal_type="admin",
                    principal_id=locked.id,
                    identifier_digest=None,
                    event_type="password_change",
                    succeeded=True,
                    reason_code="PASSWORD_CHANGED",
                    metadata=self.metadata,
                    now=now,
                )
            )
            credential_version = locked.credential_version
            absolute = current_session.absolute_expires_at
        access, access_expires = create_access_token(
            subject_id=admin.id,
            session_id=login_session.id,
            credential_version=credential_version,
            audience="pinjie-admin",
            issuer=self.settings.jwt_issuer,
            secret=self.jwt_secret,
            ttl_seconds=self.settings.admin_access_ttl_seconds,
        )
        return SessionArtifacts(
            session_id=login_session.id,
            access_token=access,
            refresh_token=new_refresh,
            csrf_token=new_csrf,
            access_expires_at=access_expires,
            idle_expires_at=idle,
            absolute_expires_at=absolute,
        )

    async def create_confirmation(
        self,
        *,
        admin: Admin,
        login_session: AdminSession,
        payload: AdminConfirmIn,
    ) -> AdminConfirmOut:
        if not await self.password_manager.verify(payload.current_password, admin.password_hash):
            raise AppException(
                status_code=401,
                code=ErrorCode.AUTH_INVALID_CREDENTIALS,
                message="Current password is incorrect",
            )
        if self.redis is None:
            raise AppException(
                status_code=503,
                code=ErrorCode.SERVICE_UNAVAILABLE,
                message="Authentication service is temporarily unavailable",
            )
        token = new_opaque_token()
        key = cache_keys(self.settings).admin_confirmation(token_digest(token, self.hmac_key))
        value = json.dumps(
            {
                "admin_id": str(admin.id),
                "session_id": str(login_session.id),
                "action": payload.action.value,
            },
            separators=(",", ":"),
        )
        try:
            await self.redis.set(key, value, ex=300, nx=True)
        except RedisError as exc:
            raise AppException(
                status_code=503,
                code=ErrorCode.SERVICE_UNAVAILABLE,
                message="Authentication service is temporarily unavailable",
            ) from exc
        return AdminConfirmOut(
            confirmation_token=token,
            action=payload.action,
            expires_at=datetime.now(UTC) + timedelta(minutes=5),
        )


__all__ = ["AdminAccountService", "UserAccountService"]
