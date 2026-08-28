# 容器构建与运行手册

## 1. 适用范围

本文说明三个应用镜像的本地构建检查、阶段 C 初始化工具和生产 Compose 接线。真实镜像发布、生产部署和回滚仍需分别授权。

## 2. 构建前提

- 构建主机使用 Linux x86_64 或 Docker Desktop Linux 容器模式。
- Backend 使用标准 CPython 3.14，当前构建与运行阶段固定官方 `python:3.14.7-slim-trixie@sha256:ce40764625a4ff50df3548277632e7f96c4e77fe75fa848aae9885476e7df5a4`，工具来源固定 `uv:0.11.32@sha256:df4cae8f3a96d175e2e5f992e597550000edbe78fdc2594d5cd8de1a217f504c`，镜像内只安装 `uv.lock` 的运行依赖。
- Web 与 Admin 构建阶段及 Web 运行阶段固定 `node:24-alpine@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43`，Admin 运行阶段固定 `nginx:1.29-alpine@sha256:5616878291a2eed594aee8db4dade5878cf7edcb475e59193904b198d9b830de`。
- 根目录是三个 Dockerfile 的构建上下文，不能把应用子目录单独作为上下文。
- 生产 PostgreSQL 固定为 `postgres:18.4-alpine@sha256:9a8afca54e7861fd90fab5fdf4c42477a6b1cb7d293595148e674e0a3181de15`，Redis 固定为 `redis:8.10.0-alpine@sha256:978f0e01593e65eed801f2402944efcd936d43b5027e4908a7897baf88ed6241`。

## 3. 本地构建

从仓库根目录执行：

```powershell
docker build -f apps/backend/Dockerfile -t pinjie-fullstack-backend:local .
docker build -f apps/web/Dockerfile -t pinjie-fullstack-web:local .
docker build -f apps/admin/Dockerfile -t pinjie-fullstack-admin:local .
```

构建完成后检查镜像用户和架构：

```powershell
docker image inspect pinjie-fullstack-backend:local --format '{{.Architecture}} {{.Config.User}}'
docker image inspect pinjie-fullstack-web:local --format '{{.Architecture}} {{.Config.User}}'
docker image inspect pinjie-fullstack-admin:local --format '{{.Architecture}} {{.Config.User}}'
```

Backend、Web 和 Admin 应分别以非 root 用户运行。具体 UID 属于镜像实现细节，检查结果必须确认不是空值或 `0`。

阶段 B 收尾已在 Linux x86_64 容器模式成功构建并运行三张镜像。Backend、Web 和 Admin 分别以 `app`、`app` 和 `nginx` 非 Root 用户运行，内置健康检查均达到 `healthy`；该结果不代替发布时的 SBOM、来源证明、目标镜像扫描和生产部署验证。

## 4. 生产 Compose 配置

生产目录至少需要：

```text
<DEPLOY_PATH>/
├── compose.prod.yml
├── .env
└── apps/backend/.env
```

根 `.env` 只写三个完整镜像 digest 和 PostgreSQL 服务初始化变量：

```dotenv
BACKEND_IMAGE=ghcr.io/example/pinjie-fullstack-backend@sha256:<64位十六进制摘要>
WEB_IMAGE=ghcr.io/example/pinjie-fullstack-web@sha256:<64位十六进制摘要>
ADMIN_IMAGE=ghcr.io/example/pinjie-fullstack-admin@sha256:<64位十六进制摘要>
WEB_PUBLIC_ORIGIN=https://www.example.com
POSTGRES_USER=pinjie_fullstack
POSTGRES_PASSWORD=<生产密钥>
POSTGRES_DB=pinjie_fullstack_prod
```

`apps/backend/.env` 至少配置：

```dotenv
ENVIRONMENT=production
DATABASE_URL=postgresql+asyncpg://pinjie_fullstack:<生产密钥>@postgres:5432/pinjie_fullstack_prod
REDIS_MODE=required
REDIS_URL=redis://redis:6379/0
RELEASE_VERSION=<完整Commit SHA或发布版本>
TRUSTED_HOSTS=["api.example.com","admin.example.com","www.example.com"]
WEB_ORIGINS=["https://www.example.com"]
ADMIN_ORIGINS=["https://admin.example.com"]
SESSION_RETENTION_DAYS=30
WEB_JWT_SECRET=<至少32字节的独立密钥>
ADMIN_JWT_SECRET=<至少32字节的独立密钥>
WEB_TOKEN_HMAC_KEY=<至少32字节的独立密钥>
ADMIN_TOKEN_HMAC_KEY=<至少32字节的独立密钥>
AUTH_COOKIE_SECURE=true
REQUEST_LOG_MODE=disabled
LOG_FILE_ENABLED=false
UPLOAD_STORAGE_DRIVER=local
UPLOAD_BASE_URL=/static/uploads
UPLOAD_MAX_FILE_SIZE_MB=50
UPLOAD_ALLOWED_EXTENSIONS=jpg,jpeg,png,webp,gif,pdf,doc,docx,xls,xlsx,zip
UPLOAD_IO_CONCURRENCY=4
SETTINGS_MEDIA_ROOT=/app/storage/settings-media
SETTINGS_MEDIA_BASE_URL=/static/settings
```

真实密码、域名和应用镜像 digest 不得写入仓库。仓库中的基础镜像 digest 来自官方 registry manifest，并由生产配置正反例门禁检查所有 Dockerfile `FROM`、PostgreSQL、Redis 和应用镜像变量。生产 Compose 会对 Backend 和请求日志消费者强制覆盖 `LOG_FILE_ENABLED=false`，默认只写标准错误流。需要文件日志时必须同时提供明确的可写持久挂载、非 Root 权限、轮转和容量告警。1Panel OpenResty 负责公网 TLS 和域名转发，Compose 服务之间使用内部服务名通信。

PostgreSQL 18 的命名卷挂载到 `/var/lib/postgresql`。已有 PostgreSQL 17 及以下数据卷不能通过直接改挂载路径完成升级，必须先验证备份，再按独立迁移方案恢复到 PostgreSQL 18 新卷。

Backend 的 `backend_uploads` 命名卷挂载到 `/app/storage`，Compose 固定 `UPLOAD_LOCAL_ROOT=/app/storage/uploads` 与 `SETTINGS_MEDIA_ROOT=/app/storage/settings-media`。镜像内的 UID `10001` 必须能写入该卷；统一资产与配置媒体使用独立目录和私有补偿区，静态路由只暴露各自公开根。生产备份必须同时覆盖 PostgreSQL 和完整 `backend_uploads` 卷，并记录同一备份窗口。

系统设置迁移会以关闭状态创建公开注册配置。部署完成后由具备权限的管理员在 `/settings` 明确开启；生产环境不通过环境变量自动继承旧状态。配置媒体本地驱动只适用于单实例，或所有 Backend 实例共享同一可靠文件系统并具备写入协调的部署。

## 5. 迁移、权限与初始管理员

应用启动不自动修改数据库。首次部署或包含迁移的版本先执行：

```powershell
docker compose --env-file .env -f compose.prod.yml run --rm backend alembic upgrade head
docker compose --env-file .env -f compose.prod.yml run --rm backend python -m scripts.sync_permissions --apply --confirm-database pinjie_fullstack_prod
docker compose --env-file .env -f compose.prod.yml run --rm backend python -m scripts.sync_permissions --check --confirm-database pinjie_fullstack_prod
```

首次创建超级管理员时单独执行交互命令：

```powershell
docker compose --env-file .env -f compose.prod.yml run --rm backend python -m scripts.create_initial_admin --username initial-admin --confirm-database pinjie_fullstack_prod
```

命令中的数据库名必须与 `DATABASE_URL` 完全一致。脚本不提供默认密码；已有账号默认拒绝，重置还需显式提供 `--reset-existing --confirm-reset`，并会撤销既有会话。

## 6. 启动与验证

```powershell
docker compose --env-file .env -f compose.prod.yml config --quiet
docker compose --env-file .env -f compose.prod.yml pull
docker compose --env-file .env -f compose.prod.yml up -d --wait
docker compose --env-file .env -f compose.prod.yml ps
```

当 `REQUEST_LOG_MODE=metadata` 时使用 Profile 启动独立消费者：

```powershell
docker compose --env-file .env -f compose.prod.yml --profile request-logs up -d --wait
```

保持 `REQUEST_LOG_MODE=disabled` 时不要启动该 Profile。

逐项检查：

- Backend `/health/live` 返回 `alive`，`/health/ready` 返回 `ready`。
- Web 首页可以显示 Backend 状态。
- Admin `/healthz` 返回 `ok`，首页可以显示 Backend 状态。
- 运行容器的镜像引用与批准的完整 digest 一致。
- Web 与 Admin 使用同域 `/api/v1`，认证响应没有 Token 字段，生产 Cookie 包含 `HttpOnly`、`Secure` 和 `SameSite=Lax`。
- 权限目录 `--check` 无漂移；启用请求元数据时消费者能够消费 Redis Stream 并落库。
- 使用 Web 或 Admin 已认证会话上传测试头像，确认资产元数据落库、`/static/uploads/` 可读取、响应包含 `nosniff`，并确认容器重启后文件仍存在。

定期保留清理先执行 dry-run，核对数量并取得数据删除授权后再增加 `--apply`：

```powershell
docker compose --env-file .env -f compose.prod.yml run --rm backend python -m scripts.cleanup_security_logs --confirm-database pinjie_fullstack_prod
docker compose --env-file .env -f compose.prod.yml run --rm backend python -m scripts.cleanup_security_logs --apply --confirm-database pinjie_fullstack_prod
```

用户回收站没有到期清理或匿名化步骤，软删除记录长期保留并可由具备 `users:restore` 权限的管理员恢复。

## 7. 停止与回滚边界

验证用途的本地容器可执行 `docker compose down`。生产环境只使用发布与部署工作流提供的固定 digest，禁止使用 `latest`、分支标签或临时重建旧版本。数据库迁移和恢复需要单独的备份、评审与授权。

1Panel 的完整目录、配置、迁移、OpenResty、日志、备份和回滚步骤见[1Panel 单机生产运行手册](1panel-production-runbook.md)。
