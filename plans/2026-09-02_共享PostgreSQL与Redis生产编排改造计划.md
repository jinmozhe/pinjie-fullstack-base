# 共享 PostgreSQL 与 Redis 生产编排改造计划

## 当前状态和结果

- 状态：已结束
- 结果：已完成；本地生产编排、配置门禁、部署保护、ADR 和运维文档已改为 1Panel 共享 PostgreSQL 与 Redis，生产迁移未执行。

## 关联需求

- `BASE-DB-001`：生产 PostgreSQL 继续作为关系数据权威来源，并按项目隔离数据库和角色。
- `BASE-DB-005`：现有生产数据迁移必须具备备份、校验和回滚边界。
- `BASE-OPS-005`：三端应用继续通过容器化生产路径交付，真实凭据不进入镜像或仓库。
- `BASE-OPS-006`：共享基础设施切换必须支持安全升级和失败恢复。
- `BASE-OPS-010`：保持 1Panel 单机可恢复部署等级，不宣称高可用。
- `BASE-SEC-001`：数据库和 Redis 凭据只保存在服务器真实环境变量中。
- `BASE-SEC-004`：生产迁移、切换和旧容器清理分别取得明确授权。
- `BASE-DOC-004`：本次部署流程调整使用一份全栈计划覆盖配置、门禁和运维文档。

## 背景

当前 `compose.prod.yml` 为每个项目创建独立 PostgreSQL 和 Redis 容器。目标服务器已经由 1Panel 托管一套 PostgreSQL 18.4 和 Redis 8.10.0，二者位于外部 Docker 网络 `1panel-network`。用户确认希望整台服务器共享这两个实例，并通过 PostgreSQL 独立数据库与角色、Redis ACL 用户与 Key 前缀保持项目级逻辑隔离。

服务器只读核验已经确认：共享 PostgreSQL 和 Redis 仅绑定宿主机环回地址、数据目录持久化、外部网络存在，共享 PostgreSQL 中的 `pinjie_fullstack_prod` 为空；当前项目源数据库包含 16 张表且 Alembic revision 为 `20260829_01`。本计划只实施仓库侧改造，不执行生产迁移。

## 目标

1. 生产 Compose 只编排 Backend、Web、Admin 和可选请求日志消费者。
2. Backend 和请求日志消费者同时接入项目默认网络与外部 `1panel-network`。
3. 移除项目内 PostgreSQL、Redis 服务及其数据卷和初始化变量。
4. 保留 Backend Readiness 对共享 PostgreSQL 和 Redis 的 Fail Closed 检查。
5. 生产配置门禁拒绝重新引入项目内基础设施服务、缺失外部网络或错误的网络接线。
6. 自动部署流程不再读取 `POSTGRES_*`，也不在切换观察期自动删除旧基础设施容器。
7. 同步 ADR、环境变量、1Panel、容器运行、备份恢复和部署工作流文档。

## 非目标

- 不修改 Backend、Admin 或 Web 业务逻辑和公开 API。
- 不修改数据库模型、Alembic revision、OpenAPI 或 API Client。
- 不连接服务器，不创建 PostgreSQL 角色，不配置 Redis ACL，不迁移生产数据。
- 不停止、删除或重建任何生产容器、数据卷、数据库或备份。
- 不启用 GitHub SSH 自动部署，不发布镜像，不提交或推送 Git。
- 不改变 Windows 本地开发所使用的本机 PostgreSQL 和 Docker Desktop Redis。

## 现状分析

- 根 Compose 当前定义 `postgres`、`redis`、`backend`、`request-log-consumer`、`web` 和 `admin` 六个服务。
- Backend 和请求日志消费者通过 `depends_on` 绑定项目内 PostgreSQL 与 Redis。
- 根 `.env.example` 同时承担镜像选择和 PostgreSQL 容器初始化变量模板。
- 生产配置门禁要求 PostgreSQL、Redis 固定镜像和 PostgreSQL 18 命名卷。
- 自动部署工作流会提取 `POSTGRES_*`，并使用 `--remove-orphans`，与共享基础设施迁移和旧容器回滚观察期冲突。
- Backend 已通过 `DATABASE_URL`、`REDIS_URL` 接收依赖地址，Redis Key 已包含项目和环境命名空间，业务逻辑无需修改。

## 方案设计

### Compose 网络

- 保留 Compose 自动创建的项目默认网络，供 Backend、Web 和 Admin 相互通信。
- 声明外部网络 `infrastructure`，固定映射服务器网络 `1panel-network`。
- Backend 和请求日志消费者加入 `default` 与 `infrastructure`。
- Web 和 Admin 只加入 `default`，不直接访问数据库或 Redis。
- 共享 PostgreSQL 使用网络别名 `postgresql`，共享 Redis 使用网络别名 `redis`。

### 配置职责

- 根 `.env` 只保存三张不可变应用镜像引用和 `WEB_PUBLIC_ORIGIN`。
- `apps/backend/.env` 保存共享 PostgreSQL、Redis 的完整连接串及其他 Backend 生产配置。
- 生产连接串只在运维文档中使用占位符，不写入仓库真实值。

### 依赖与故障传播

- 移除对 Compose 内部 PostgreSQL、Redis 的 `depends_on`。
- Backend 继续通过 `/health/ready` 校验数据库、Redis 和设置媒体依赖；共享依赖不可用时容器保持不健康。
- Web 和 Admin 继续等待 Backend 健康，不绕过 Backend 访问基础设施。

### 生产迁移边界

- 服务器迁移必须在共享 PostgreSQL 备份、源数据库一致性备份和恢复校验之后执行。
- Redis 使用独立 ACL 用户、独立密码和项目 Key 前缀；ACL 持久化与默认用户回滚在服务器专项步骤中完成。
- 旧 PostgreSQL、Redis 容器和卷在观察期内保留，清理需要单独授权。

## 全栈影响矩阵

| 范围 | 是否涉及 | 工作内容 | 前置依赖 | 验证 |
| --- | --- | --- | --- | --- |
| Backend | 涉及 | 更新公开环境变量说明；不修改 Python 逻辑 | 现有 URL 配置和 Readiness | Backend 静态门禁按影响评估；确认源码无差异 |
| Admin | 不涉及 | 继续通过 Backend 访问数据 | Backend 健康 | 确认无源码和配置差异 |
| Web | 不涉及 | 继续通过 Backend 内部地址访问 API | Backend 健康 | 确认无源码和配置差异 |
| API Client | 不涉及 | 公开 API 无变化 | 无 | 确认生成契约无差异 |
| Database | 涉及 | 文档化独立数据库、角色、备份、恢复和回滚边界 | 后续生产迁移专项授权 | 本轮不执行真实数据库验证 |
| Deployment | 涉及 | 修改生产 Compose、门禁、门禁夹具和现有部署工作流 | 外部 `1panel-network` | PowerShell 门禁、Compose 解析、工作区与边界检查 |
| Documentation | 涉及 | 新增 ADR并更新现有生产运维文档、索引和 Changelog | 实现事实 | Markdown、文本卫生和链接复读 |

## 实施顺序

1. 创建本计划，登记 `plans/INDEX.md` 并同步 `PROJECT_INDEX.md` 活动计划。
2. 修改 `compose.prod.yml` 和根 `.env.example`。
3. 修改生产配置门禁及其正反向夹具。
4. 修正现有生产部署工作流的环境变量和旧容器保留边界。
5. 新增共享生产基础设施 ADR，并更新受影响架构与运维文档。
6. 运行本地轻量门禁，复读差异和文本编码。
7. 回写计划状态、实施结果、Changelog 和索引。

## 影响文件

- `compose.prod.yml`
- `.env.example`
- `.github/workflows/deploy-production.yml`
- `scripts/ci/check-production-compose.ps1`
- `scripts/ci/test-production-compose-guard.ps1`
- `docs/adr/0014-共享PostgreSQL与Redis生产基础设施决策.md`
- `docs/adr/0003-本地开发环境架构决策.md`
- `docs/architecture/project-structure.md`
- `docs/operations/environment-variables-and-backend-local-run.md`
- `docs/operations/local-dev-environment.md`
- `docs/operations/container-build-and-run.md`
- `docs/operations/1panel-production-runbook.md`
- `docs/operations/database-backup-restore.md`
- `docs/operations/github-actions-workflows.md`
- `docs/README.md`
- `README.md`
- `CHANGELOG.md`
- `plans/INDEX.md`
- `PROJECT_INDEX.md`
- 本计划

## 风险与回滚

- 外部网络缺失会导致 Compose 拒绝启动，生产迁移前必须检查 `1panel-network`。
- PostgreSQL 角色、数据库所有权或 Redis ACL 配置错误会使 Backend Readiness 失败，禁止以弱默认值继续启动。
- 自动部署使用 `--remove-orphans` 会提前删除旧回滚容器，本次移除该参数；旧资源清理由人工专项授权完成。
- 共享实例扩大故障影响范围，必须按项目隔离凭据、数据库、Redis Key，并统一容量、备份和恢复演练。
- 本地回滚使用精确 Git 差异恢复本计划文件；生产回滚不在本次实施范围内。

## 验证清单

- `pnpm check:production-config`
- `powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File scripts/ci/test-production-compose-guard.ps1`
- 使用公开占位值执行 `docker compose --env-file <临时文件> -f compose.prod.yml config --quiet`，环境具备 Docker Compose 时执行。
- `pnpm check:workspace`
- `pnpm check:boundaries`
- `pnpm lint:md`
- `powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\.codex\skills\project-hygiene\scripts\validate_text_hygiene.ps1" -Root .`
- 复读受影响文件和 `git diff --check`。
- Admin/Web production build、Vitest、pytest、Playwright 和真实数据库迁移按项目策略未授权，不执行。

## 待确认问题

无。

## 用户确认记录

- 2026-09-02：用户要求“实施本项目仓库修改，先处理本地。请直接创建计划文档，确认执行，直接实现”，明确授权创建计划并完成本地仓库实施。
- 本次授权不包含 Git 提交、推送、镜像发布、SSH、1Panel 或生产迁移。

## 实施结果

- `compose.prod.yml` 已移除项目内 PostgreSQL、Redis 服务及其数据卷；Backend 和请求日志消费者加入项目默认网络与外部 `1panel-network`，Web 和 Admin 保持在项目默认网络。
- 根 `.env.example` 只保留三张 TCR 完整 digest 镜像引用和 `WEB_PUBLIC_ORIGIN`；共享 PostgreSQL、Redis 连接串继续由服务器 `apps/backend/.env` 提供。
- 生产配置门禁已拒绝本地基础设施服务和卷、非外部基础设施网络、Backend 错误网络或 `depends_on`、Web/Admin 错接基础设施网络、可变应用镜像和缺失日志保护。
- GitHub `Deploy Production` 已停止提取 `POSTGRES_*`，保留 `WEB_PUBLIC_ORIGIN` 并移除日常部署中的 `--remove-orphans`；文档明确当前工作流仍使用 GHCR，完成 TCR 自动部署专项改造前必须保持部署开关关闭。
- 新增 ADR 0014，并同步项目结构、本地与生产环境差异、环境变量、容器运行、1Panel、备份恢复、发布回滚、GitHub Actions、根索引和文档索引。
- `docker compose --env-file .env.example -f compose.prod.yml config --quiet --no-env-resolution` 通过。Docker 对沙箱内用户配置读取发出权限警告，但命令退出码为 0，未影响 Compose 静态解析。
- `pnpm check:production-config` 和生产门禁正反向夹具通过。
- `pnpm check:workspace`、`pnpm check:boundaries`、`pnpm lint:md`、文本卫生检查及 `git diff --check` 全部通过。
- Admin/Web production build、Vitest、pytest、Playwright 和真实数据库迁移未获本次授权，未执行；本次没有修改应用源码或公开契约。

## 剩余问题

- 生产 PostgreSQL 数据迁移、Redis ACL 持久化配置、共享连接串切换、线上健康验证和旧容器清理等待后续独立授权。
- GitHub `Deploy Production` 仍校验并部署 GHCR。改为核对 CNB 发布清单和 TCR digest、使用独立 `tcr-puller` 并自动部署属于后续独立计划。
