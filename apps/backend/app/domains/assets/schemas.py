import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field

from app.core.pagination import PageResult


class UploadScene(StrEnum):
    AVATAR = "avatar"
    ARTICLE = "article"
    PRODUCT = "product"
    DOCUMENT = "document"
    ATTACHMENT = "attachment"
    TEMP = "temp"


class UploaderType(StrEnum):
    ADMIN = "admin"
    USER = "user"
    SYSTEM = "system"


class AssetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: uuid.UUID = Field(description="文件资产唯一标识")
    uploader_type: UploaderType = Field(description="上传主体类型")
    uploader_id: uuid.UUID | None = Field(description="上传主体唯一标识，系统任务可为空")
    storage_driver: str = Field(description="保存文件的存储驱动代码")
    file_key: str = Field(description="存储驱动中的相对文件键")
    original_name: str = Field(description="上传时经过路径剥离的原始文件名")
    mime_type: str = Field(description="服务端探测得到的真实 MIME 类型")
    file_size: int = Field(description="文件大小，单位为字节")
    file_hash: str = Field(description="文件内容的 SHA-256 哈希值")
    url: str = Field(description="文件的公开访问 URL 或站内路径")
    scene: UploadScene = Field(description="受控的文件使用场景")
    created_at: datetime = Field(description="创建时间")
    updated_at: datetime = Field(description="最近更新时间")


AssetPage = PageResult[AssetRead]

__all__ = ["AssetPage", "AssetRead", "UploaderType", "UploadScene"]
