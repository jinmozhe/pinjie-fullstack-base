# 环境变量分层与 Backend 本地运行手册

## 1. 适用范围

本文说明仓库根目录与 Backend、Web、Admin 三个应用目录中的环境变量文件分别由谁读取，并给出 Windows、PowerShell 和 VS Code 工作区下初始化、迁移、启动及检查 Backend 的标准步骤。

阶段 B 已提供运行基础设施，阶段 C 已提供认证、用户、管理员、RBAC、安全事件、审计和请求元数据能力。本文描述当前可执行的本地流程。

## 2. 工作区与应用目录

VS Code 打开整个全栈仓库作为工作区，当前本机路径为：

```text
D:\Projects\pinjie-fullstack-base
```

Backend 项目目录为：

```text
D:\Projects\pinjie-fullstack-base\apps\backend
```

日常保持 VS Code 工作区根目录不变。需要运行后端命令时，只在对应终端进入 `apps\backend`，无需把 VS Code 重新打开到 Backend 子目录。

## 3. 环境变量文件职责

仓库包含四层环境变量模板，真实文件均被 Git 忽略：

| 层级 | 模板 | 本地真实文件 | 读取者 | 主要职责 |
| --- | --- | --- | --- | --- |
| 部署层 | 根 `.env.example` | 根 `.env` | Docker Compose、生产部署脚本 | 选择三端不可变镜像 digest 并初始化 PostgreSQL 容器 |
| Backend | `apps/backend/.env.example` | `apps/backend/.env` | Backend 配置系统、Backend 容器与运维脚本 | 数据库、Redis、认证 Secret、Cookie、安全边界和日志保留 |
| Web | `apps/web/.env.example` | `apps/web/.env.local` | Next.js 开发、构建及服务端运行过程 | 服务端 Backend 地址和浏览器公开 API 地址 |
| Admin | `apps/admin/.env.example` | `apps/admin/.env.local` | Umi Max 开发与构建过程 | 浏览器公开 API 地址 |

`.env.example` 只保存可公开模板值并提交到 Git。`.env` 和 `.env.local` 保存当前环境的真实值，禁止提交、写入日志或复制到文档。

### 3.1 根目录 `.env`

根 `.env` 是部署控制文件，不是某个应用容器的通用运行配置。当前保存三张镜像的完整不可变引用和 PostgreSQL 初始化变量：

```dotenv
BACKEND_IMAGE=ghcr.io/example/backend@sha256:<64位十六进制摘要>
WEB_IMAGE=ghcr.io/example/web@sha256:<64位十六进制摘要>
ADMIN_IMAGE=ghcr.io/example/admin@sha256:<64位十六进制摘要>
POSTGRES_USER=pinjie_fullstack
POSTGRES_PASSWORD=<生产密钥>
POSTGRES_DB=pinjie_fullstack_prod
```

`compose.prod.yml` 使用这些变量决定本次部署启动哪三个镜像并初始化 PostgreSQL。根 `.env` 中的值不会自动进入应用容器；只有 Compose 通过 `environment` 或 `env_file` 明确声明的变量才会进入容器。

本地 `compose.yml` 只启动 Redis，并不引用上述镜像变量，因此普通本地开发不需要创建根 `.env`。

生产部署工作流使用临时 `--env-file` 完成镜像校验、拉取和启动。应用服务验证成功后，才把临时文件原子替换为根 `.env`。该文件因此也是当前生产部署版本集合的本地记录，可用于追溯和回滚。

### 3.2 Backend `.env`

`apps/backend/.env` 保存 Backend 运行所需的真实配置，例如：

- `DATABASE_URL`
- `REDIS_URL`
- `ENVIRONMENT`
- `BACKEND_CORS_ORIGINS`
- `WEB_JWT_SECRET` 与 `ADMIN_JWT_SECRET`
- `WEB_TOKEN_HMAC_KEY` 与 `ADMIN_TOKEN_HMAC_KEY`
- `AUTH_COOKIE_SECURE`、注册模式、Token 与 Session 期限
- 请求元数据模式及安全日志保留期
- Loguru 控制台与本地文件日志开关、路径、轮转大小和保留周期

文件日志默认写入 Backend 工作目录下的 `logs/app_{time:YYYY-MM-DD}.log`，使用异步队列、50 MB 轮转、10 天保留和 ZIP 压缩。日志文件不进入 Git；只读容器或只允许标准错误流的部署必须显式设置 `LOG_FILE_ENABLED=false`。

生产 `compose.prod.yml` 当前明确通过以下配置把该文件注入 Backend 容器：

```yaml
env_file:
  - apps/backend/.env
```

根 `.env` 决定启动哪个 Backend 镜像，`apps/backend/.env` 决定这个 Backend 容器如何连接数据库、Redis及如何运行。两者不能合并，避免部署版本和应用秘密形成同一职责边界。

### 3.3 Web `.env.local`

Web 使用 Next.js：

- `BACKEND_URL` 供 Next.js 服务端使用，不应暴露给浏览器。
- Web 浏览器使用同域 `/api/v1`，只有 `BACKEND_INTERNAL_URL` 由服务端读取，不进入浏览器公开变量。

Web 生产容器通过 Compose 的 `BACKEND_INTERNAL_URL=http://backend:8000` 连接 Backend，浏览器仍访问同域 `/api/v1`。

### 3.4 Admin `.env.local`

Admin 使用 Umi Max，`VITE_*` 变量会进入浏览器可读的静态 JavaScript，主要在构建阶段由 `config/config.ts` 注入。修改已构建容器中的 `.env.local` 通常不能改变现有静态产物。

Admin 使用同域相对路径 `/api/v1`，开发服务器和生产 Nginx 都代理到 Backend。

Admin 生产镜像不依赖运行时公开 API 环境变量，代理目标由容器网络中的 `backend` 服务名确定。

## 4. 本地首次初始化

以下命令从全栈仓库根目录开始执行。

### 4.1 启动本地 Redis

```powershell
Set-Location D:\Projects\pinjie-fullstack-base
docker compose up -d redis
docker compose exec redis redis-cli ping
```

预期 Redis 返回 `PONG`。PostgreSQL 使用本机服务，数据库和用户初始化步骤见[本地开发环境手册](local-dev-environment.md)。

### 4.2 进入 Backend 目录

```powershell
Set-Location D:\Projects\pinjie-fullstack-base\apps\backend
```

从仓库根目录使用相对路径也可以：

```powershell
Set-Location apps\backend
```

### 4.3 安装 Python 与依赖

首次初始化或 Python 基线变化时执行：

```powershell
uv python install 3.14
uv python pin 3.14
uv sync
```

本项目只使用标准 CPython 3.14，不使用 free-threaded `3.14t`。执行 `uv run python -c "import sys; assert sys.version_info[:2] == (3, 14); print(sys.version)"` 确认解释器；生产 Backend 容器自带已固定的 Python 运行时，1Panel 宿主机 Python 下拉选项不参与版本选择。

`uv sync` 在 `apps/backend/.venv` 创建项目虚拟环境并同步依赖。后续统一通过 `uv run` 执行命令，不要求手动激活 `.venv`。

### 4.4 创建 Backend 本地配置

```powershell
Copy-Item .env.example .env
```

至少核对：

```dotenv
ENVIRONMENT=local
DEBUG=true
DATABASE_URL=postgresql+asyncpg://pinjie_fullstack:<本地密码>@localhost:5432/pinjie_fullstack_dev
REDIS_URL=redis://localhost:6379/0
REDIS_MODE=required
```

还必须为 `WEB_JWT_SECRET`、`ADMIN_JWT_SECRET`、`WEB_TOKEN_HMAC_KEY` 和 `ADMIN_TOKEN_HMAC_KEY` 设置四个彼此不同、至少 32 个 UTF-8 字节的随机值。生产值由 Secret 管理系统生成和注入；本地值也不能沿用模板、写入截图、Issue、聊天记录或 Git。

生产环境还必须设置 `AUTH_COOKIE_SECURE=true`、明确的 `TRUSTED_HOSTS`、`BACKEND_CORS_ORIGINS`、`TRUSTED_PROXY_CIDRS` 和 `RELEASE_VERSION`。配置系统发现弱 Secret、通配域名、安全 Cookie 关闭或关键依赖缺失时拒绝启动。

## 5. Backend 启动顺序

在 Backend 目录执行：

```powershell
uv sync --locked
uv run alembic upgrade head
uv run python -m scripts.sync_permissions --apply --confirm-database pinjie_fullstack_dev
uv run uvicorn app.main:app --reload --port 8000
```

含义如下：

1. `uv sync --locked` 按锁文件还原精确依赖，锁文件与声明不一致时立即失败。
2. `uv run alembic upgrade head` 把本地开发数据库升级到当前迁移版本。
3. 权限同步脚本把源码权限目录写入数据库。日常核对使用 `--check`，只有明确需要同步时才使用 `--apply`。
4. `uv run uvicorn ...` 使用 Backend 项目 `.venv` 启动 FastAPI 开发服务。

启动后访问：

```text
http://localhost:8000
```

运维探针为 `/health/live` 和 `/health/ready`，业务中立状态接口为 `/api/v1/system/status`。

首次创建超级管理员时，在 Backend 目录交互执行：

```powershell
uv run python -m scripts.create_initial_admin --username initial-admin --confirm-database pinjie_fullstack_dev
```

脚本不提供默认密码，交互输入不会回显。账号已经存在时默认拒绝；显式重置必须同时提供 `--reset-existing` 与 `--confirm-reset`，并会递增凭据版本、撤销已有会话。命令中的数据库名必须与 `DATABASE_URL` 完全一致。

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
uv run ruff format --check .
uv run mypy app
uv run lint-imports
uv run python -m compileall -q app scripts tests
uv run python -c "from app.main import app; print('APP_IMPORT_OK', len(app.openapi().get('paths', {})))"
uv run pytest tests/ -v
```

涉及数据库的测试必须连接名称以 `_test` 结尾的独立测试数据库。禁止使用开发数据库或生产数据库充当自动化测试数据库。
默认 pytest 配置会同时统计 `app` 的行与分支覆盖率，综合结果低于 90% 时命令失败；本地和 Backend CI 使用同一门禁。

涉及迁移时还需在隔离 `_test` 数据库执行两次升级与一致性检查：

```powershell
uv run alembic upgrade head
uv run alembic upgrade head
uv run alembic check
```

全仓库治理检查从根目录运行：

```powershell
Set-Location D:\Projects\pinjie-fullstack-base
pnpm check:governance
```

### 6.1 权限、日志和请求元数据工具

以下命令都先校验运行配置与数据库名，`--confirm-database` 必须与 `DATABASE_URL` 中的数据库名完全一致：

```powershell
# 权限目录检查，存在漂移时退出码非零
uv run python -m scripts.sync_permissions --check --confirm-database pinjie_fullstack_dev

# 查看超过保留期的记录数量，不删除数据
uv run python -m scripts.cleanup_security_logs --confirm-database pinjie_fullstack_dev

# 经审批后应用保留期清理
uv run python -m scripts.cleanup_security_logs --apply --confirm-database pinjie_fullstack_dev
```

`REQUEST_LOG_MODE=disabled` 是默认值。启用 `metadata` 后，必须单独运行消费者：

```powershell
uv run python -m scripts.consume_request_logs
```

本地排查可以增加 `--once`、`--batch-size` 或 `--reclaim-idle-ms`。该 Worker 持久化白名单元数据；错误 JSON 请求的入参最多保存 4096 个字符，敏感字段会替换为 `***`，登录、改密和二次确认等敏感路由不会保存入参。响应体、Cookie、Authorization 和 Token 永不进入日志。

## 7. VS Code 配置

VS Code 保持打开全栈仓库根目录，并将 Python 解释器选择为：

```text
D:\Projects\pinjie-fullstack-base\apps\backend\.venv\Scripts\python.exe
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
| 根 `.env` | 保存本次部署的三个不可变镜像引用和 PostgreSQL 初始化变量 |
| `.deployment-version` | 保存完整 Commit SHA 与 Compose 文件哈希 |
| `apps/backend/.env` | 保存 Backend 生产运行配置和秘密 |

1Panel 负责 OpenResty、服务器资源和容器管理。使用 1Panel 页面启动 Compose 时，环境变量的解析和容器注入仍遵守 Docker Compose 规则，面板不会让根 `.env` 自动成为三个容器的运行环境。

Web 和 Admin 的生产接线已经固定为同域 `/api/v1` 代理与 Web 的 `BACKEND_INTERNAL_URL`，禁止依赖未声明的自动注入。

应用启动不会自动执行 Alembic、同步权限或创建管理员。生产发布必须在启动新版本前执行受控迁移与权限同步；初始管理员只通过一次性显式命令创建。启用请求元数据时，Compose 还需开启 `request-logs` Profile 运行独立消费者。

## 9. 常见误区

- 在仓库根目录直接运行 Backend 的 `uv` 命令，导致项目和虚拟环境定位错误。
- 每次启动前手动激活 `.venv`，随后又使用系统 Python 或 Conda 命令，形成环境混用。
- 把根 `.env` 当作 Backend 密钥文件，混入数据库密码。
- 认为根 `.env` 中的变量会自动进入所有容器。
- 认为修改 Umi 构建容器旁的 `.env.local` 可以改变已构建的 Admin 静态文件。
- 把 `NEXT_PUBLIC_*`、`VITE_*` 当作安全变量，它们对浏览器用户可见。
- 复用 C/B JWT Secret 或 Token HMAC Key，或者把模板值直接带入生产。
- 只启动 Backend 请求进程，却忘记在 `REQUEST_LOG_MODE=metadata` 时运行请求日志消费者。
- 没有数据库凭据时，仍然把 PostgreSQL 集成测试或跨栈 E2E 记录为已经通过。
