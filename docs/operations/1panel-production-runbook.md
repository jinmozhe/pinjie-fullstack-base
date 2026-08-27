# 1Panel 单机生产运行手册

## 1. 适用范围

本手册适用于使用 1Panel、OpenResty 和 `compose.prod.yml` 运行母版派生项目的单机生产环境。该部署等级提供固定镜像、健康检查、持久卷、备份恢复和受控回滚，不提供多机高可用、跨故障域容灾或零停机数据库迁移。

生产部署、迁移、恢复、回滚、Tag 和 Release 分别需要明确授权。母版只提供可执行基线，派生项目必须补充域名、RPO、RTO、容量、告警和责任人。

## 2. 部署前提

- Linux x86_64 主机已安装并维护 Docker Engine、Compose v2 和 1Panel。
- 1Panel OpenResty 独占公网 80/443，应用端口只绑定 `127.0.0.1`。
- Backend、Web、Admin 镜像已经过对应 Commit SHA 的质量门禁、SBOM 和安全扫描。
- 三张应用镜像使用完整 `@sha256:` digest，禁止使用 `latest`、分支标签或缺失版本回退。
- PostgreSQL 固定 `postgres:18.4-alpine`，Redis 固定 `redis:8.10.0-alpine`。
- 部署目录、真实 `.env`、备份和数据库凭据仅允许受控运维账号访问。

生产目录至少包含：

```text
<DEPLOY_PATH>/
├── compose.prod.yml
├── .env
└── apps/
    └── backend/
        └── .env
```

环境变量职责和最低配置见[环境变量分层与 Backend 本地运行手册](environment-variables-and-backend-local-run.md)。真实秘密不得写入仓库、命令日志、工单或聊天记录。

## 3. 配置检查

在发布候选代码上先运行：

```powershell
pnpm check:production-config
pnpm check:governance
```

在生产部署目录检查 Compose 展开结果：

```bash
docker compose --env-file .env -f compose.prod.yml config --quiet
```

检查项：

- `BACKEND_IMAGE`、`WEB_IMAGE`、`ADMIN_IMAGE` 均为批准的完整 digest。
- PostgreSQL 命名卷挂载到 `/var/lib/postgresql`。
- Backend `backend_uploads` 命名卷挂载到 `/app/storage`，公开根为 `/app/storage/uploads`。
- Backend 和 request-log-consumer 显式设置 `LOG_FILE_ENABLED=false`。
- `DATABASE_URL` 使用服务名 `postgres`，`REDIS_URL` 使用服务名 `redis`。
- `ENVIRONMENT=production`，Cookie、Trusted Host、CORS、代理 CIDR 和四个认证密钥满足生产约束。

PostgreSQL 17 及以下的现有卷通常使用 `/var/lib/postgresql/data`。已有实例升级到 PostgreSQL 18 前必须单独制定卷迁移和恢复方案，验证备份后创建新卷并恢复，禁止直接把旧卷改挂到新路径后启动。

## 4. 备份与迁移

发布前记录当前完整 Commit SHA、三张运行镜像 digest、Alembic revision 和备份标识。数据库结构变化时，先完成可恢复备份，再执行一次性迁移：

```bash
docker compose --env-file .env -f compose.prod.yml pull
docker compose --env-file .env -f compose.prod.yml run --rm backend alembic upgrade head
docker compose --env-file .env -f compose.prod.yml run --rm backend python -m scripts.sync_permissions --apply --confirm-database <生产数据库名>
docker compose --env-file .env -f compose.prod.yml run --rm backend python -m scripts.sync_permissions --check --confirm-database <生产数据库名>
```

应用启动不自动执行 Alembic。迁移失败时停止发布，保全原数据库和备份，不继续启动不兼容的新应用镜像。

用户回收站记录长期保留，不配置到期时间，也不运行匿名化脚本。具备 `users:restore` 权限的管理员可以随时恢复，恢复后账户仍保持停用。

## 5. 启动与健康检查

```bash
docker compose --env-file .env -f compose.prod.yml up -d --wait
docker compose --env-file .env -f compose.prod.yml ps
```

仅在 `REQUEST_LOG_MODE=metadata` 时启动请求日志消费者：

```bash
docker compose --env-file .env -f compose.prod.yml --profile request-logs up -d --wait
```

逐项确认：

- PostgreSQL 和 Redis 为 `healthy`。
- Backend `/health/live` 返回存活，`/health/ready` 返回就绪。
- Web 首页可访问，Admin `/healthz` 返回 `ok`。
- 运行容器使用批准的完整镜像 digest，进程用户为非 Root。
- Web 和 Admin 经同域 `/api/v1` 访问 Backend，认证 Cookie 包含 `HttpOnly`、`Secure` 和预期的 `SameSite`。
- 权限目录无漂移；启用请求日志时消费者能处理 Redis Stream 并写入 PostgreSQL。

## 6. OpenResty 接线

在 1Panel 中为批准域名启用 TLS，并分别代理到：

| 入口 | 上游 |
| --- | --- |
| Web | `http://127.0.0.1:3000` |
| Admin | `http://127.0.0.1:3001` |
| 独立 Backend 域名需要时 | `http://127.0.0.1:8000` |

转发时保留 `Host`、`X-Real-IP`、`X-Forwarded-For` 和 `X-Forwarded-Proto`。Backend 只信任 `TRUSTED_PROXY_CIDRS` 中明确登记的代理地址，禁止用全网段或通配值绕过来源校验。

## 7. 日志与观测

生产 Compose 默认关闭 Backend 文件日志，Backend 和请求日志消费者只写标准错误流，由 Docker 与 1Panel 收集。这样可以保持应用容器只读并避免未挂载的 `/app/logs` 写入失败。

确需文件日志时，必须同时完成：

1. 为 Backend 和请求日志消费者设置明确、独立且可写的持久挂载。
2. 把 `LOG_FILE_PATH` 指向挂载目录并显式设置 `LOG_FILE_ENABLED=true`。
3. 验证非 Root UID 具有最小写权限。
4. 配置轮转、保留、容量告警和清理责任人。

应用日志、审计日志和请求元数据承担不同职责。任何日志都不得记录 Cookie、Token、密码、完整连接串或未脱敏请求体。

## 8. 备份、恢复与回滚

1Panel 可以调度 PostgreSQL 备份和异地复制，但面板成功状态不能代替隔离恢复演练。详细校验见[数据库备份与恢复手册](database-backup-restore.md)。

统一文件资产启用后，还必须备份 `backend_uploads` 命名卷。数据库与文件卷使用同一备份窗口并共同记录标识；恢复时先停止写入，恢复 PostgreSQL 与文件卷，再抽样核对 `assets.file_key` 对应文件。只恢复数据库或只恢复文件卷会产生悬空元数据或孤儿文件，不能视为完整恢复。

应用回滚只能选择已经批准的旧镜像 digest，并先确认旧应用与当前数据库 revision 兼容。数据库回滚或覆盖恢复必须停止或隔离写入、保全当前数据库、确认恢复点与数据损失窗口，并取得专项授权。

回滚后重新执行健康检查、关键认证流程、权限检查和只读数据摘要校验。记录实际 Commit SHA、镜像 digest、数据库 revision、恢复点、RTO、RPO 和异常。

## 9. 停止边界

生产环境禁止把 `docker compose down -v` 作为日常停止命令。卷删除、数据库清理和备份删除都属于独立破坏性操作。仅停止应用时应先确认影响窗口，再使用明确服务名执行受控停止；恢复服务后重新运行健康检查。
