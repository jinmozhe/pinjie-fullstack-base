# Windows 本地开发环境手册

> 文档归属：`docs/operations/local-dev-environment.md`
> 适用仓库：`pinjie-fullstack-base` 及其派生项目
> 架构决策：[ADR 0003：本地开发环境架构决策](../adr/0003-本地开发环境架构决策.md)
> 延伸阅读：[uv 使用指南](uv使用指南.md)；[pnpm 使用指南](pnpm使用指南.md)

根与三端 `.env` 的职责、VS Code 工作区方式和 Backend 的标准启动顺序见[环境变量分层与 Backend 本地运行手册](environment-variables-and-backend-local-run.md)。

## 一、最终方案

本地开发采用“本机应用进程 + 本机 PostgreSQL + Docker Desktop Redis”：

```text
Windows 本机
├── Backend：uv + 标准 CPython 3.14 + 项目 .venv，端口 8000
├── Web：pnpm + Next.js，端口 3000
├── Admin：pnpm + Umi Max，端口 3001
└── PostgreSQL：本机服务，端口 5432

Docker Desktop
└── Redis 8.10.0：根目录 compose.yml，端口 6379
```

Anaconda 或 Miniconda 不属于本项目的前置依赖。日常后端命令统一使用 `uv sync` 和 `uv run`，不要在主流程中混用 Conda 环境。

## 二、本地与生产环境区别

生产服务器为 Linux x86_64，由 1Panel 管理 Compose 和 OpenResty：

```text
1Panel
├── OpenResty
│   ├── api.yourdomain.com   → 127.0.0.1:8000
│   ├── admin.yourdomain.com → 127.0.0.1:3001
│   └── www.yourdomain.com   → 127.0.0.1:3000
├── PostgreSQL：`postgres:18.4-alpine` 容器，独立数据卷和用户
├── Redis：`redis:8.10.0-alpine` 容器，独立 AOF 数据卷
└── Compose：postgres、redis、backend、web、admin 容器
```

| 维度 | 本地开发 | 生产环境 |
| --- | --- | --- |
| 应用运行方式 | Windows 本机进程 | Docker 应用容器 |
| PostgreSQL | 本机安装，`localhost:5432` | Docker Compose `postgres:18.4-alpine` |
| Redis | Docker Desktop，`localhost:6379` | Docker Compose `redis:8.10.0-alpine` |
| HTTP 入口 | 直接访问 localhost | OpenResty 域名反向代理 |
| TLS | 不启用 | 1Panel 自动管理证书 |
| 环境变量 | 应用目录内本地文件 | 1Panel 或 Compose 注入 |
| 数据用途 | 开发和自动化测试 | 真实业务数据 |

生产 Compose 内 PostgreSQL 使用服务名 `postgres`，Redis 使用服务名 `redis`；容器内连接地址不能使用 `localhost`。

## 三、方案对比

### 方案 A：PostgreSQL 与 Redis 全部使用 Docker

```text
Docker Desktop
├── PostgreSQL 容器
└── Redis 容器

Windows 本机
├── Backend
├── Web
└── Admin
```

优点：数据库隔离完整，版本容易锁定，新人环境容易复制。

缺点：与本机 PostgreSQL 和生产单实例多数据库模式存在额外差异，需要管理独立端口、连接和数据卷。当前 `compose.yml` 没有 PostgreSQL 服务，不能直接使用此方案。

### 方案 B：本机 PostgreSQL、Docker Redis、应用本机运行（采用）

优点：本地与生产都采用 PostgreSQL 单实例多数据库思路；后端和前端热重载、调试路径短；Compose 只管理 Redis，职责清晰。

缺点：开发者需要维护本机 PostgreSQL 服务；删除项目时需要单独确认并删除数据库和用户。

### 方案 C：完整 Dev Container

优点：工具链和系统依赖隔离最彻底。

缺点：全栈 Monorepo 在 Windows 上的挂载、热重载、多端口调试和 IDE 集成更复杂，当前阶段不采用。

## 四、前置条件

安装并确认以下工具可用：

| 工具 | 要求 | 用途 |
| --- | --- | --- |
| Git | 当前稳定版本 | 版本控制 |
| uv | 当前稳定版本 | Python、虚拟环境和后端依赖 |
| Node.js | 24 或更高版本 | 前端运行时，使用当前 Active LTS 或后续受支持版本 |
| pnpm | 11.17.0 或更高的 11.x | Monorepo 依赖管理，与根 `packageManager` 保持一致 |
| PostgreSQL | 主版本尽量与生产一致 | 本地数据库 |
| Docker Desktop | 包含 Docker Compose | 本地 Redis |

在 PowerShell 中检查：

```powershell
git --version
uv --version
node --version
pnpm --version
psql --version
docker version
docker compose version
```

如果 Docker Desktop 尚未启动，先启动并等待引擎进入 Running 状态。

## 五、首次初始化

以下命令默认从仓库根目录 `pinjie-fullstack-base` 开始执行。

### 1. 安装前端依赖

```powershell
pnpm install
```

pnpm workspace 只在仓库根目录维护一份 `pnpm-lock.yaml`，不要进入各应用分别生成锁文件。

### 2. 初始化后端 Python 环境

```powershell
Set-Location apps/backend
uv python install 3.14
uv python pin 3.14
uv sync
Set-Location ../..
```

- `uv python pin 3.14` 负责生成或更新项目 Python 版本声明；项目只使用常规 CPython 构建，不使用 free-threaded `3.14t`。
- `uv sync` 默认创建 `apps/backend/.venv` 并同步项目依赖。
- `uv run` 后续直接在该项目环境中运行命令，无需手动激活。
- 如果当前 PowerShell 自动激活了 Conda base 环境，可以先执行 `conda deactivate`，或新开一个未激活 Conda 的 PowerShell。

使用 `uv run python -c "import sys; assert sys.version_info[:2] == (3, 14); print(sys.version)"` 确认实际解释器。生产由 Backend 容器携带 Python，1Panel 宿主机 Python 版本不参与本项目运行时选择。

### 3. 初始化本机 PostgreSQL

先确认 PostgreSQL Windows 服务已经启动，然后使用管理员账号连接：

```powershell
psql -U postgres
```

在 `psql` 中执行一次：

```sql
CREATE USER pinjie_fullstack WITH PASSWORD 'your_local_password';
CREATE DATABASE pinjie_fullstack_dev OWNER pinjie_fullstack;
CREATE USER pinjie_fullstack_test WITH PASSWORD 'your_test_password' CREATEDB;
CREATE DATABASE pinjie_fullstack_test OWNER pinjie_fullstack_test;
GRANT ALL PRIVILEGES ON DATABASE pinjie_fullstack_dev TO pinjie_fullstack;
GRANT ALL PRIVILEGES ON DATABASE pinjie_fullstack_test TO pinjie_fullstack_test;
```

`CREATEDB` 只授予本机测试角色，用于创建和删除名称以 `_test` 结尾的临时迁移与恢复数据库。开发角色和生产角色不需要该权限。

退出 `psql`：

```text
\q
```

真实本地密码只写入被 Git 忽略的 `.env`，不得写回 `.env.example` 或提交到仓库。

### 4. 创建应用环境变量文件

```powershell
Copy-Item apps/backend/.env.example apps/backend/.env
Copy-Item apps/web/.env.example apps/web/.env.local
Copy-Item apps/admin/.env.example apps/admin/.env.local
```

后端 `apps/backend/.env` 至少确认：

```dotenv
DATABASE_URL=postgresql+asyncpg://pinjie_fullstack:your_local_password@localhost:5432/pinjie_fullstack_dev
TEST_DATABASE_URL=postgresql+asyncpg://pinjie_fullstack_test:your_test_password@localhost:5432/pinjie_fullstack_test
REDIS_URL=redis://localhost:6379/0
TEST_REDIS_URL=redis://localhost:6379/15
```

前端公开变量会进入浏览器构建产物，禁止在 `NEXT_PUBLIC_` 或 `VITE_` 变量中保存密钥。

### 5. 启动 Redis

```powershell
docker compose up -d redis
docker compose ps
docker compose exec redis redis-cli ping
```

预期 Redis 返回：

```text
PONG
```

## 六、日常启动

建议使用三个独立 PowerShell 终端。Redis 由 Docker Desktop 后台运行。

### 终端一：Backend

```powershell
Set-Location apps/backend
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

访问地址：`http://localhost:8000`

### 终端二：Web

```powershell
pnpm --filter @pinjie/web dev
```

访问地址：`http://localhost:3000`

### 终端三：Admin

```powershell
pnpm --filter @pinjie/admin dev
```

访问地址：`http://localhost:3001`

也可以在根目录运行 `pnpm dev`，由 Turborepo 同时启动 Web 和 Admin。后端仍在独立终端中运行。

## 七、常用维护命令

### 后端

```powershell
Set-Location apps/backend
uv sync
uv run ruff check .
uv run mypy app
uv run pytest
```

新增依赖：

```powershell
uv add package-name
uv add --dev package-name
```

### 前端

```powershell
pnpm lint
pnpm lint:md
pnpm typecheck
pnpm build
```

### Redis

查看状态和日志：

```powershell
docker compose ps
docker compose logs redis
```

停止 Redis 但保留容器：

```powershell
docker compose stop redis
```

删除本项目 Redis 容器并保留命名数据卷：

```powershell
docker compose down
```

日常操作不要使用 `docker compose down -v`，该命令会删除 Redis 数据卷。

## 八、数据与迁移边界

正常开发过程中，本地测试数据不迁移到生产环境：

- 表结构通过 Alembic 迁移文件同步。
- 初始基础数据通过种子脚本填充。
- 生产数据不得下载到普通本地开发环境。

确需迁移指定的非敏感基础数据时，先确认表范围、外键顺序、脱敏和回滚方案，再执行受控导出。例如：

```powershell
pg_dump -U pinjie_fullstack -d pinjie_fullstack_dev -t categories --data-only --file seed.sql
```

生成的 `seed.sql` 可能包含业务数据，不得默认提交到 Git。

## 九、生产数据库初始化参考

生产环境密码通过 1Panel 安全注入，下面只保留模板值：

```sql
CREATE USER pinjie_fullstack WITH PASSWORD 'strong_production_password';
CREATE DATABASE pinjie_fullstack_prod OWNER pinjie_fullstack;
GRANT ALL PRIVILEGES ON DATABASE pinjie_fullstack_prod TO pinjie_fullstack;
```

生产部署、备份、恢复和 OpenResty 配置应记录在后续的 `docs/operations/1panel-production-runbook.md` 中。

## 十、常见问题

### `uv` 使用了错误的 Python 环境

```powershell
Set-Location apps/backend
uv run python -c "import sys; print(sys.executable)"
```

输出路径应位于 `apps/backend/.venv`。如果输出指向 Conda 环境，关闭当前终端中的 Conda 激活状态后重新执行 `uv sync`。

### 后端无法连接 PostgreSQL

依次检查 PostgreSQL Windows 服务、5432 端口、数据库用户、数据库名和 `apps/backend/.env` 中的 `DATABASE_URL`。

### 后端无法连接 Redis

```powershell
docker compose ps redis
docker compose exec redis redis-cli ping
```

如果容器未运行，执行 `docker compose up -d redis`。

### 前端依赖或 workspace 链接异常

在仓库根目录重新执行：

```powershell
pnpm install
pnpm typecheck
```

## 十一、Codex Windows 沙箱基线

本项目使用 Windows 原生 ChatGPT/Codex 桌面端和 PowerShell，不以 Docker 或 WSL 作为 Codex 文件操作的默认运行边界。OpenAI 官方将 `elevated` 作为更强的首选沙箱，将 `unelevated` 作为从当前用户派生受限 Token 的备选实现。

本项目长期使用 `elevated`。`CodexSandbox*` Owner 在 DACL 正常且工具操作成功时不属于故障，不通过 `unelevated`、`danger-full-access` 或全仓库递归 `FullControl` 消除 Owner 差异。本机验证中，`unelevated` 虽解决 Owner 与 uv Cache 写入，但 Node 子进程出现 `EPERM`，且隔离弱于官方首选，因此已回滚。

本项目 pnpm Store 应保持在仓库内被 Git 忽略的 `.pnpm-store/`。uv Cache 通过 `uv cache dir` 获取；只有确认该准确目录因沙箱越界反复失败时，才把它加入 `sandbox_workspace_write.writable_roots`，不得放行整个用户目录或 `AppData`。添加后，当前任务必须在输入框下方选择“自定义（`config.toml`）”，普通权限预设不会采用该额外根。

宿主机使用 `HTTP_PROXY`、`HTTPS_PROXY` 或 `ALL_PROXY` 指向本地回环代理时，必须通过 `shell_environment_policy.filters` 阻止 Codex 子进程继承这些变量，避免回环代理绕过默认断网；不修改宿主系统代理。修改沙箱模式或环境策略后必须完全重启桌面端并新建任务复验。

桌面端智能体环境保持“Windows 原生”，集成终端 Shell 建议选择 PowerShell。“设置 -> 常规”只保留默认权限，关闭“完整访问权限”开关；该开关只控制菜单可用模式，不代表当前任务已经选择某种权限。

配置示例、权限模式关系、Owner/ACL 分类、正反向验证和 Git 授权边界统一见 [AI 助手开发与文档读取指南的 Windows 原生 Codex 权限章节](ai-assisted-development-workflow.md#26-windows-原生-codex-权限与-acl-长期治理)。
