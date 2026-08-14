# 容器构建与运行手册

## 1. 适用范围

本文说明阶段 B 三个应用镜像的本地构建检查和生产 Compose 接线。真实镜像发布、生产部署和回滚仍需分别授权。

## 2. 构建前提

- 构建主机使用 Linux x86_64 或 Docker Desktop Linux 容器模式。
- Backend 使用标准 CPython 3.14，镜像内只安装 `uv.lock` 的运行依赖。
- 根目录是三个 Dockerfile 的构建上下文，不能把应用子目录单独作为上下文。
- 生产 PostgreSQL 固定为 `postgres:18.4-alpine`，Redis 固定为 `redis:8.10.0-alpine`。

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
BACKEND_CORS_ORIGINS=["https://admin.example.com","https://www.example.com"]
```

真实密码、域名和镜像 digest 不得写入仓库。1Panel OpenResty 负责公网 TLS 和域名转发，Compose 服务之间使用内部服务名通信。

## 5. 启动与验证

```powershell
docker compose --env-file .env -f compose.prod.yml config --quiet
docker compose --env-file .env -f compose.prod.yml pull
docker compose --env-file .env -f compose.prod.yml up -d --wait
docker compose --env-file .env -f compose.prod.yml ps
```

逐项检查：

- Backend `/health/live` 返回 `alive`，`/health/ready` 返回 `ready`。
- Web 首页可以显示 Backend 状态。
- Admin `/healthz` 返回 `ok`，首页可以显示 Backend 状态。
- 运行容器的镜像引用与批准的完整 digest 一致。

## 6. 停止与回滚边界

验证用途的本地容器可执行 `docker compose down`。生产环境只使用发布与部署工作流提供的固定 digest，禁止使用 `latest`、分支标签或临时重建旧版本。数据库迁移和恢复需要单独的备份、评审与授权。
