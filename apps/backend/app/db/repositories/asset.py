import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Asset


class AssetRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def add(self, asset: Asset) -> None:
        self._session.add(asset)

    async def get(self, asset_id: uuid.UUID, *, for_update: bool = False) -> Asset | None:
        statement = select(Asset).where(Asset.id == asset_id)
        if for_update:
            statement = statement.with_for_update()
        return (await self._session.execute(statement)).scalar_one_or_none()

    async def find_duplicate(
        self,
        *,
        uploader_type: str,
        uploader_id: uuid.UUID,
        scene: str,
        file_hash: str,
    ) -> Asset | None:
        statement = select(Asset).where(
            Asset.uploader_type == uploader_type,
            Asset.uploader_id == uploader_id,
            Asset.scene == scene,
            Asset.file_hash == file_hash,
        )
        return (await self._session.execute(statement)).scalar_one_or_none()

    async def list(self, *, page: int, page_size: int) -> tuple[list[Asset], int]:
        total = await self._session.scalar(select(func.count()).select_from(Asset))
        items = list(
            await self._session.scalars(
                select(Asset)
                .order_by(Asset.created_at.desc(), Asset.id.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        )
        return items, int(total or 0)

    async def delete(self, asset: Asset) -> None:
        await self._session.delete(asset)


__all__ = ["AssetRepository"]
