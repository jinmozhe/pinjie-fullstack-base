from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

from .error_codes import ErrorCode

T = TypeVar("T")


class ResponseModel(BaseModel, Generic[T]):
    model_config = ConfigDict(extra="forbid")

    code: str
    message: str
    data: T
    request_id: str


class ErrorResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str
    message: str
    details: Any | None = None
    request_id: str


def success_response(*, data: T, request_id: str, message: str = "OK") -> ResponseModel[T]:
    return ResponseModel(code=ErrorCode.OK, message=message, data=data, request_id=request_id)


class ValidationErrorDetail(BaseModel):
    loc: list[str | int] = Field(default_factory=list)
    msg: str
    type: str
