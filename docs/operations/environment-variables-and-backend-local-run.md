# 环境变量分层与 Backend 本地运行手册

## 1. 适用范围

本文说明仓库根目录与 Backend、Web、Admin 三个应用目录中的环境变量文件分别由谁读取，并给出 Windows、PowerShell 和 VS Code 工作区下初始化、迁移、启动及检查 Backend 的标准步骤。

当前仓库仍处于 `empty` 工程骨架阶段，尚无 `apps/backend/app/main.py`、Alembic 运行环境和后端锁文件。本文中的 Backend 启动、迁移与测试命令需要等阶段 B 补齐运行源码后才能成功执行；当前不能把这些命令记为已验证通过。

## 2. 工作区与应用目录

VS Code 打开整个全栈仓库作为工作区，当前本机路径为：

```text
E:\fastapi\pinjie-fullstack-base
```

Backend 项目目录为：

```text
E:\fastapi\pinjie-fullstack-base\apps\backend
```

日常保持 VS Code 工作区根目录不变。需要运行后端命令时，只在对应终端进入 `apps\backend`，无需把 VS Code 重新打开到 Backend 子目录。

## 3. 环境变量文件职责

仓库包含四层环境变量模板，真实文件均被 Git 忽略：

| 层级 | 模板 | 本地真实文件 | 读取者 | 主要职责 |
| --- | --- | --- | --- | --- |
| 部署层 | 根 `.env.example` | 根 `.env` | Docker Compose、生产部署脚本 | 选择 Backend、Web、Admin 的不可变镜像 digest |
| Backend | `apps/backend/.env.example` | `apps/backend/.env` | Backend 配置系统、Backend 容器 | 数据库、Redis、JWT 密钥、运行环境和 CORS |
| Web | `apps/web/.env.example` | `apps/web/.env.local` | Next.js 开发、构建及服务端运行过程 | 服务端 Backend 地址和浏览器公开 API 地址 |
| Admin | `apps/admin/.env.example` | `apps/admin/.env.local` | Vite 开发与构建过程 | 浏览器公开 API 地址 |

`.env.example` 只保存可公开模板值并提交到 Git。`.env` 和 `.env.local` 保存当前环境的真实值，禁止提交、写入日志或复制到文档。

### 3.1 根目录 `.env`

根 `.env` 是部署控制文件，不是某个应用容器的运行配置。当前只保存三张镜像的完整不可变引用：

```dotenv
BACKEND_IMAGE=ghcr.io/example/backend@sha256:<64位十六进制摘要>
WEB_IMAGE=ghcr.io/example/web@sha256:<64位十六进制摘要>
ADMIN_IMAGE=ghcr.io/example/admin@sha256:<64位十六进制摘要>
```

`compose.prod.yml` 使用这些变量决定本次部署启动哪三个镜像。根 `.env` 中的值不会自动进入容器；只有 Compose 通过 `environment` 或 `env_file` 明确声明的变量才会进入容器。

本地 `compose.yml` 只启动 Redis，并不引用上述镜像变量，因此普通本地开发不需要创建根 `.env`。

生产部署工作流使用临时 `--env-file` 完成镜像校验、拉取和启动。三个容器全部验证成功后，才把临时文件原子替换为根 `.env`。该文件因此也是当前生产部署版本集合的本地记录，可用于追溯和回滚。

### 3.2 Backend `.env`

`apps/backend/.env` 保存 Backend 运行所需的真实配置，例如：

- `DATABASE_URL`
- `REDIS_URL`
- `SECRET_KEY`
- `ENVIRONMENT`
- `BACKEND_CORS_ORIGINS`

生产 `compose.prod.yml` 当前明确通过以下配置把该文件注入 Backend 容器：

```yaml
env_file:
  - apps/backend/.env
```

根 `.env` 决定启动哪个 Backend 镜像，`apps/backend/.env` 决定这个 Backend 容器如何连接数据库、Redis及如何运行。两者不能合并，避免部署版本和应用秘密形成同一职责边界。

### 3.3 Web `.env.local`

Web 使用 Next.js：

- `BACKEND_URL` 供 Next.js 服务端使用，不应暴露给浏览器。
- `NEXT_PUBLIC_API_URL` 会进入浏览器可读产物，只能填写公开地址，禁止保存密钥。

`NEXT_PUBLIC_*` 通常在构建阶段固化。服务端变量是否可以在容器运行时注入，取决于后续实现的读取位置和 Dockerfile。当前生产 Compose 尚未给 Web 配置 `env_file` 或 `environment`，阶段 B 必须结合 Web Dockerfile 和运行方式确定生产接线，不能假定 `apps/web/.env.local` 已自动进入容器。

### 3.4 Admin `.env.local`

Admin 使用 Vite，`VITE_*` 变量会进入浏览器可读的静态 JavaScript，主要在构建阶段生效。修改已构建容器中的 `.env.local` 通常不能改变现有静态产物。

生产环境优先评估使用同域相对路径，例如 `/api/v1`，再由 1Panel OpenResty 转发到 Backend，从而减少同一镜像因环境域名不同而重复构建。最终方案需要在阶段 B 的 Admin Dockerfile 和反向代理设计中确认。

当前生产 Compose 尚未给 Admin 配置 `env_file` 或 `environment`，不能把 Admin `.env.local` 表述为生产容器运行时配置。

## 4. 本地首次初始化

以下命令从全栈仓库根目录开始执行。

### 4.1 启动本地 Redis

```powershell
Set-Location E:\fastapi\pinjie-fullstack-base
docker compose up -d redis
docker compose exec redis redis-cli ping
```

预期 Redis 返回 `PONG`。PostgreSQL 使用本机服务，数据库和用户初始化步骤见[本地开发环境手册](local-dev-environment.md)。

### 4.2 进入 Backend 目录

```powershell
Set-Location E:\fastapi\pinjie-fullstack-base\apps\backend
```

从仓库根目录使用相对路径也可以：

```powershell
Set-Location apps\backend
```

### 4.3 安装 Python 与依赖

首次初始化或 Python 基线变化时执行：

```powershell
uv python install 3.12
uv python pin 3.12
uv sync
```

`uv sync` 在 `apps/backend/.venv` 创建项目虚拟环境并同步依赖。后续统一通过 `uv run` 执行命令，不要求手动激活 `.venv`。

### 4.4 创建 Backend 本地配置

```powershell
Copy-Item .env.example .env
```

至少核对：

```dotenv
ENVIRONMENT=development
DEBUG=true
DATABASE_URL=postgresql+asyncpg://pinjie_fullstack:<本地密码>@localhost:5432/pinjie_fullstack_dev
REDIS_URL=redis://localhost:6379/0
```

必须把模板中的 `SECRET_KEY` 改为仅供本地使用的随机值。不得在命令输出、截图、Issue、聊天记录或 Git 中暴露真实值。

## 5. Backend 启动顺序

当阶段 B 已补齐 `app/main.py`、Alembic 环境和 `uv.lock` 后，在 Backend 目录执行：

```powershell
uv sync --locked
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

含义如下：

1. `uv sync --locked` 按锁文件还原精确依赖，锁文件与声明不一致时立即失败。
2. `uv run alembic upgrade head` 把本地开发数据库升级到当前迁移版本。
3. `uv run uvicorn ...` 使用 Backend 项目 `.venv` 启动 FastAPI 开发服务。

启动后访问：

```text
http://localhost:8000
```

健康检查路径必须以阶段 B 实际实现的路由为准，当前不预设或伪造 `/health` 已存在。

### 是否需要手动激活虚拟环境

标准流程不需要执行：

```powershell
.\.venv\Scripts\Activate.ps1
```

`uv run` 会自动选择 `apps/backend/.venv`。手动激活只适合临时交互式调试，不能替代 `uv run`，也不应成为文档和自动化命令的前置条件。

## 6. Backend 本地检查

当后端进入 `ready` 状态后，在 `apps/backend` 目录运行：

```powershell
uv run ruff check .
uv run mypy app
uv run pytest tests/ -v
```

涉及数据库的测试必须连接名称以 `_test` 结尾的独立测试数据库。禁止使用开发数据库或生产数据库充当自动化测试数据库。

当前骨架缺少运行源码、测试、`uv.lock` 和 Alembic 运行环境，因此上述检查尚不适用。当前可执行的仓库治理检查仍从全栈根目录运行：

```powershell
Set-Location E:\fastapi\pinjie-fullstack-base
pnpm check:governance
```

## 7. VS Code 配置

VS Code 保持打开全栈仓库根目录，并将 Python 解释器选择为：

```text
E:\fastapi\pinjie-fullstack-base\apps\backend\.venv\Scripts\python.exe
```

该设置只影响编辑器的补全、类型分析和调试。终端命令仍使用 `uv run`，避免终端激活状态、系统 Python、Conda 和项目 `.venv` 混用。

推荐为 Backend、Web 和 Admin 分别打开独立终端，终端工作目录可以不同，VS Code 工作区根目录保持不变。

## 8. 1Panel 生产目录关系

当前生产部署目录至少包含：

```text
<DEPLOY_PATH>/
├── compose.prod.yml
├── .env
├── .deployment-version
└── apps/
    └── backend/
        └── .env
```

职责如下：

| 文件 | 作用 |
| --- | --- |
| 根 `.env` | 保存本次部署的三个不可变镜像引用 |
| `.deployment-version` | 保存完整 Commit SHA 与 Compose 文件哈希 |
| `apps/backend/.env` | 保存 Backend 生产运行配置和秘密 |

1Panel 负责 OpenResty、服务器资源和容器管理。使用 1Panel 页面启动 Compose 时，环境变量的解析和容器注入仍遵守 Docker Compose 规则，面板不会让根 `.env` 自动成为三个容器的运行环境。

Web 和 Admin 的生产构建变量及运行变量必须在阶段 B 中明确选择构建参数、Compose `environment`、专用 `env_file` 或相对 API 路径。方案落地前禁止依赖未声明的自动注入。

## 9. 常见误区

- 在仓库根目录直接运行 Backend 的 `uv` 命令，导致项目和虚拟环境定位错误。
- 每次启动前手动激活 `.venv`，随后又使用系统 Python 或 Conda 命令，形成环境混用。
- 把根 `.env` 当作 Backend 密钥文件，混入数据库密码或 JWT 密钥。
- 认为根 `.env` 中的变量会自动进入所有容器。
- 认为修改 Vite 容器旁的 `.env.local` 可以改变已构建的 Admin 静态文件。
- 把 `NEXT_PUBLIC_*`、`VITE_*` 当作安全变量，它们对浏览器用户可见。
- 当前仍处于空骨架阶段，却把无法执行的启动、迁移或测试命令记录为已经通过。
