import argparse
import asyncio
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select

from app.core.config import get_settings
from app.core.resources import create_resources
from app.core.security import new_anonymized_username, new_opaque_token
from app.db.models import User
from app.db.transaction import transaction_scope
from scripts._database_target import validate_database_target


def _arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Preview or anonymize expired user recycle-bin records")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--confirm-database", required=True)
    return parser.parse_args()


async def _run(args: argparse.Namespace) -> None:
    settings = get_settings()
    validate_database_target(settings, args.confirm_database)
    cutoff = datetime.now(UTC) - timedelta(days=settings.user_recycle_bin_retention_days)
    predicate = (
        User.deleted_at.is_not(None),
        User.deleted_at < cutoff,
        User.anonymized_at.is_(None),
    )
    resources = create_resources(settings)
    try:
        async with resources.session_factory() as session:
            candidate_count = int((await session.scalar(select(func.count()).select_from(User).where(*predicate))) or 0)
            print(f"expired_users={candidate_count} cutoff={cutoff.isoformat()}")
            if not args.apply:
                print("Dry run only; no users anonymized")
                return
            replacement_hash = await resources.password_manager.hash(new_opaque_token())
            anonymized_at = datetime.now(UTC)
            async with transaction_scope(session):
                users = list(
                    (await session.scalars(select(User).where(*predicate).order_by(User.id).with_for_update())).all()
                )
                for user in users:
                    user.username = new_anonymized_username(user.id)
                    user.email = None
                    user.display_name = None
                    user.password_hash = replacement_hash
                    user.is_active = False
                    user.credential_version += 1
                    user.anonymized_at = anonymized_at
            print(f"User recycle-bin anonymization applied; anonymized_users={len(users)}")
    finally:
        await resources.close()


def main() -> None:
    asyncio.run(_run(_arguments()))


if __name__ == "__main__":
    main()
