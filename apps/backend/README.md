# apps/backend

FastAPI 标准后端，基于 `pinjie-standard` 骨架。

## 技术栈

- FastAPI + SQLAlchemy 2.0 async + Alembic
- PostgreSQL + Redis
- Pydantic v2 + Loguru
- uv 包管理

## 本地启动

```powershell
uv python install 3.12
uv python pin 3.12
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

本项目使用 uv 管理 Python 版本、项目 `.venv`、依赖和命令运行，不要求激活 Conda 环境。环境变量职责、VS Code 工作区和后端启动顺序见[环境变量分层与 Backend 本地运行手册](../../docs/operations/environment-variables-and-backend-local-run.md)，完整的 Windows 环境、PostgreSQL 和 Docker Desktop Redis 初始化见[本地开发环境手册](../../docs/operations/local-dev-environment.md)。

## 环境变量

复制 `apps/backend/.env.example` 为 `apps/backend/.env` 并填入本地配置。真实 `.env` 不得提交到仓库。

## 通用领域范围

母版只包含以下领域：

- `domains/auth/`：认证（登录、Token 刷新、密码重置）
- `domains/users/`：C 端用户（个人中心、账号基础能力）
- `domains/admin/`：B 端 RBAC（管理员、角色、菜单、权限）
- `domains/system/`：系统工具（健康检查、日志、配置）

业务领域（如电商、CMS）通过派生仓库添加，不放入母版。
