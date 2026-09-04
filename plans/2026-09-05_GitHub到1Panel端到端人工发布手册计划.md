# GitHub 到 1Panel 端到端人工发布手册计划

## 当前状态和结果

- 状态：已结束
- 结果：已完成；现有发布专题文档已同步真实流程，新增从 GitHub Actions 经 CNB、TCR 到 1Panel 的人工端到端操作手册
- 当前范围：同步现有发布专题文档与真实交付状态，并新增一份从 GitHub Actions 人工操作到 1Panel 完成生产更新的端到端 Runbook。
- 授权边界：用户已授权文档实施、提交和推送，并明确不执行验证；本任务没有触发工作流、镜像发布或生产操作。

## 关联需求

- `BASE-OPS-005`：三端生产镜像必须具有清晰、可执行的交付路径。
- `BASE-OPS-006`：部署步骤必须覆盖升级、健康检查、失败恢复和回滚。
- `BASE-OPS-007`：GitHub 验证、CNB 镜像发布与 1Panel 生产部署继续保持职责和授权分离。
- `BASE-OPS-009`：发布物绑定完整 Commit SHA，生产只使用不可变镜像 digest。
- `BASE-SEC-001`：操作手册不得记录真实密码、Token 或生产密钥。
- `BASE-SEC-004`：镜像发布、数据库迁移、生产更新和回滚必须保留独立确认边界。
- `BASE-SEC-006`：操作记录必须能够关联 GitHub Commit、CNB Build、TCR digest 和生产部署结果。
- `BASE-QUAL-001`：跳过、失败和未验证状态必须如实表达。
- `BASE-DOC-004`：跨文档同步工作通过本计划追踪。
- `BASE-DOC-006`：运维文档必须可导航、保持单一来源并与实际流程一致。

## 背景

项目已经具备 GitHub Actions、CNB 三端独立镜像构建、TCR 不可变发布和 1Panel 人工更新能力。现有操作信息分散在 GitHub Actions、容器构建、腾讯云账号、1Panel 和发布回滚等专题文档中，操作人员需要跨文档拼接完整顺序。

真实发布和生产部署已经完成，但两个 2026-09-04 活动计划及 `PROJECT_INDEX.md` 仍保留“真实发布待授权”等旧状态。文档状态需要依据已提供的 GitHub、CNB、TCR、1Panel 编排和三端健康检查证据回写。

## 目标

1. 新增一份面向人工操作人员的端到端 Runbook，覆盖 GitHub 点击、CNB 构建、TCR digest 获取、1Panel 更新、迁移、健康检查和回滚。
2. 明确 `strict` 与 `fast` 的选择规则、输入字段、成功证据和停止条件。
3. 明确单端变更、多端变更和强制全量构建的处理差异。
4. 明确 TCR 中 RepoTag、Commit SHA、镜像 digest 的用途，生产只复制完整 digest。
5. 明确首次部署与日常更新的不同步骤，包括数据库迁移、权限同步和初始管理员创建边界。
6. 将现有专题文档收敛为各自权威职责，并统一链接到端到端入口，避免复制多份完整流程。
7. 根据真实证据结束两份已完成的 2026-09-04 活动计划，更新项目阶段、计划索引和 Changelog。

## 非目标

- 不修改 GitHub Actions、CNB、Dockerfile、Compose、应用源码、数据库迁移或环境变量实现。
- 不触发 Full Validation、Handoff Source to CNB、CNB 构建、TCR 发布或 1Panel 生产更新。
- 不保存真实 `.env`、数据库密码、Redis 密码、TCR 凭证或 GitHub/CNB Token。
- 不把 1Panel 自动部署或 GitHub SSH 部署重新引入当前生产链路。
- 不删除、移动、重命名或替换任何既有计划文档。
- 不把专题文档中的账号权限、故障排查和架构边界全部复制到新 Runbook。

## 现状分析

- `docs/operations/github-actions-workflows.md` 已覆盖 Full Validation、源码交接和 CNB 发布，但内容以逐工作流解释为主。
- `docs/operations/container-build-and-run.md` 已覆盖镜像、Compose、迁移和健康检查，但不承担 GitHub 控制台逐步操作。
- `docs/operations/tencent-tcr-personal-cam-accounts.md` 已覆盖发布与拉取身份、服务器登录和权限验收。
- `docs/operations/1panel-production-runbook.md` 已覆盖共享 PostgreSQL、Redis、编排、OpenResty 和生产检查。
- `docs/operations/release-and-rollback.md` 已规定授权分离、不可变 digest 和回滚边界。
- `docs/README.md` 已登记上述专题文档，尚无端到端人工发布入口。
- 两份 2026-09-04 活动计划与 `PROJECT_INDEX.md` 的状态落后于已经完成的真实 GitHub、CNB、TCR 和 1Panel 操作。

## 方案设计

### 1. 新增端到端 Runbook

新增 `docs/operations/github-cnb-tcr-1panel-release-runbook.md`，采用操作人员视角编排以下阶段：

1. 确认本次批准的完整 Commit SHA 和受影响端。
2. 根据风险选择并运行 GitHub `CI - Full Validation`。
3. 在 GitHub 运行 `Handoff Source to CNB`，填写 `commit_sha`、`validation_mode` 和可选的快速模式原因。
4. 在 CNB 核对实际触发的单端或多端 Pipeline、扫描结果和单镜像发布证据。
5. 从 TCR 或发布证据取得每个受影响端的完整 `@sha256:` 引用。
6. 在服务器或 1Panel 中更新生产镜像变量并保存编排。
7. 首次部署或存在迁移时执行 Alembic 与权限同步；只有首次初始化时创建管理员。
8. 检查 Compose 状态、Backend 存活和就绪、Web、Admin 以及域名访问。
9. 保存发布记录，并在失败时按旧 digest 回滚目标端。

每一步都写明入口、填写项、期望结果、停止条件和证据，不包含真实密钥。

### 2. 专题文档职责收敛

- GitHub Actions 文档负责工作流内部机制、输入含义和失败排查，并链接到端到端 Runbook。
- 容器文档负责镜像、Compose、迁移和命令细节，并链接到端到端 Runbook。
- 腾讯云账号文档负责 CAM、TCR 凭证和拉取权限，不复制日常发布全流程。
- 1Panel 文档负责生产基础设施、编排、共享服务、OpenResty 和健康检查。
- 发布回滚文档负责审批、版本证据、不可变引用和回滚决策。

### 3. 状态与历史同步

依据已经提供的真实操作证据：

- 将 GitHub 双验证模式计划回写为已结束、已完成，并记录真实严格模式执行结果。
- 将 CNB 三端独立镜像计划回写为已结束、已完成，并记录 Backend、Web、Admin 独立构建、TCR digest 和 1Panel 更新结果；Backend 首次失败及后续修复只保留有长期价值的事实。
- 更新 `plans/INDEX.md` 和 `PROJECT_INDEX.md`，移除已结束计划的活动登记。
- 更新 `CHANGELOG.md`，把端到端人工发布手册及已完成真实发布作为已交付事实。

## 全栈影响矩阵

| 范围 | 是否涉及 | 工作内容 | 前置依赖 | 验证 |
| --- | --- | --- | --- | --- |
| Backend | 不涉及 | 不修改后端源码 | 无 | 不适用 |
| Admin | 不涉及 | 不修改管理端源码 | 无 | 不适用 |
| Web | 不涉及 | 不修改用户端源码 | 无 | 不适用 |
| API Client | 不涉及 | 不修改契约或生成代码 | 无 | 不适用 |
| Database | 不涉及 | 只说明迁移、权限同步和管理员初始化步骤 | 现有 Alembic 与脚本 | 文档命令和现有实现交叉核对 |
| Deployment | 涉及 | 收敛 GitHub、CNB、TCR、1Panel 人工发布和回滚步骤 | 当前工作流、CNB 配置、Compose 与生产证据 | 配置与文档交叉核对、治理检查 |
| Documentation | 涉及 | 新增 Runbook，同步专题文档、计划、索引和 Changelog | 用户确认 | Markdown、链接、文本和差异检查 |

## 实施顺序

1. 用户确认本计划范围和文档职责划分。
2. 逐项复读 GitHub Workflow、CNB 配置、Compose、迁移和管理员脚本，确认所有命令及界面字段来自当前实现。
3. 新增端到端人工发布 Runbook。
4. 更新五份专题运维文档，增加权威入口并消除过期或冲突描述。
5. 更新 `docs/README.md` 的运维导航。
6. 回写两份 2026-09-04 计划的真实结果，同步 `plans/INDEX.md`、`PROJECT_INDEX.md` 和 `CHANGELOG.md`。
7. 复读全部修改，检查 UTF-8 无 BOM、末尾换行、链接、命令、占位符和敏感信息。
8. 运行 Markdown、项目治理、文本卫生和 Git 差异检查。

## 影响文件

预计新增：

- `docs/operations/github-cnb-tcr-1panel-release-runbook.md`
- `plans/2026-09-05_GitHub到1Panel端到端人工发布手册计划.md`

预计修改：

- `docs/operations/github-actions-workflows.md`
- `docs/operations/container-build-and-run.md`
- `docs/operations/tencent-tcr-personal-cam-accounts.md`
- `docs/operations/1panel-production-runbook.md`
- `docs/operations/release-and-rollback.md`
- `docs/operations/database-backup-restore.md`
- `docs/operations/local-dev-environment.md`
- `docs/README.md`
- `plans/2026-09-04_GitHub源码交接双验证模式计划.md`
- `plans/2026-09-04_CNB三端独立镜像构建与发布证据改造计划.md`
- `plans/INDEX.md`
- `PROJECT_INDEX.md`
- `CHANGELOG.md`

## 风险与回滚

- **步骤重复造成漂移**：完整操作顺序只在新 Runbook 维护，专题文档保留机制、配置和排障细节并回链。
- **把快速模式表述为完整验证**：Runbook 必须明确 `fast` 跳过 Full Validation Artifact，不能记录为完整测试通过。
- **混淆 RepoTag 与 digest**：所有生产示例统一要求完整仓库地址和 `@sha256:`，RepoTag 只用于发现和追溯。
- **误触发生产副作用**：本文档任务只编辑仓库文件，不执行任何远端工作流、镜像发布或生产命令。
- **泄露凭据**：所有命令使用占位符或环境变量，不写入用户已经提供的真实密码和 Token。
- **状态证据不足**：只回写用户已提供且可核对的 Commit、Pipeline、digest、编排和健康检查结果；无法证明的事项保留为未验证。
- **回滚文档变更**：通过普通反向提交恢复，不改写 Git 历史，不影响生产系统。

## 验证清单

- [x] 用户已确认本计划并授权文档同步、提交和推送。
- [x] 新 Runbook 覆盖 GitHub、CNB、TCR、1Panel 全流程。
- [x] `strict`、`fast`、单端、多端、首次部署、日常更新和回滚边界清晰。
- [x] 所有界面名称、脚本参数和命令已与当前仓库实现交叉复读。
- [x] 五份专题文档与新 Runbook 职责清晰且互相可导航。
- [x] 两份旧活动计划和项目阶段与真实结果一致。
- [x] 文档未包含真实密码、Token、私有凭据或可变生产标签示例。
- [ ] 用户明确要求不执行检测，未运行本轮 `pnpm lint:md`、`pnpm check:governance`、`pnpm check:text` 和其他自动检查。
- [x] production build、Vitest、pytest、Playwright 和浏览器自动化未执行。

## 待确认问题

- 无。

## 用户确认记录

- 2026-09-05：用户要求同步所涉及的发布文档，并单独创建面向人工操作人员的 GitHub Actions 到 CNB、TCR、1Panel 端到端 Runbook；当前已按项目规则先创建计划，等待实施确认。
- 2026-09-05：用户明确该任务只做文档更新并同步到线上仓库，不需要运行检测；该指令同时授权完成文档实施、创建提交和推送，不授权任何工作流、镜像发布或生产操作。

## 实施结果

- 新增 `docs/operations/github-cnb-tcr-1panel-release-runbook.md`，以人工操作顺序覆盖 GitHub SHA 获取、`strict` 与 `fast`、Full Validation、源码交接、CNB 三端构建、TCR 单镜像证据、1Panel 拉取、首次初始化、日常更新、健康检查、停止条件、发布记录和回滚。
- GitHub Actions、容器、TCR、1Panel、发布回滚、数据库备份和本地环境文档已同步入口和当前生产边界。
- Redis 生产说明已与当前实际部署一致：使用 `default` 用户和独立逻辑库 `/1`，并明确逻辑库只隔离正常业务 Key，不构成权限边界。
- 旧 GHCR `Deploy Production` 已明确标记为禁用的历史实现，当前生产入口统一为 CNB、TCR 和 1Panel 人工更新。
- 两份 2026-09-04 活动计划已依据真实 GitHub、CNB、TCR、1Panel 和健康检查证据结束，项目阶段、计划索引、文档索引和 Changelog 已同步。
- 已人工复读当前 Workflow、CNB 配置、Compose、管理员脚本、发布证据 Schema 和全部变更差异；按用户要求未运行自动检测。

## 剩余问题

- 无。本次只完成仓库文档同步，未触发新的发布或生产操作。
