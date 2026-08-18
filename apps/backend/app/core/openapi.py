from typing import Any

OPENAPI_TAGS = [
    {"name": "用户认证", "description": "用户注册、登录、刷新会话和退出登录接口。"},
    {"name": "用户账户", "description": "当前用户资料、密码、登录会话和账户管理接口。"},
    {"name": "管理员认证", "description": "管理员登录、刷新会话、修改密码和敏感操作确认接口。"},
    {"name": "后台管理", "description": "用户、管理员、角色、权限和安全审计管理接口。"},
    {"name": "系统", "description": "面向应用调用方的公共系统状态接口。"},
    {"name": "健康检查", "description": "面向运行平台的存活与就绪探针。"},
]

_RESPONSE_DESCRIPTIONS = {
    "Successful Response": "请求成功",
    "Validation Error": "请求参数校验失败",
}


def localize_openapi_schema(schema: dict[str, Any]) -> dict[str, Any]:
    paths = schema.get("paths", {})
    if not isinstance(paths, dict):
        return schema
    for path_item in paths.values():
        if not isinstance(path_item, dict):
            continue
        for operation in path_item.values():
            if not isinstance(operation, dict):
                continue
            responses = operation.get("responses", {})
            if not isinstance(responses, dict):
                continue
            for response in responses.values():
                if not isinstance(response, dict):
                    continue
                description = response.get("description")
                if isinstance(description, str):
                    response["description"] = _RESPONSE_DESCRIPTIONS.get(description, description)
    return schema


__all__ = ["OPENAPI_TAGS", "localize_openapi_schema"]
