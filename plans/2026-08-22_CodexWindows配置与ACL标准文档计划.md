# Codex Windows 配置与 ACL 标准文档计划

## 当前状态和结果

- 状态：已结束
- 结果：已完成。独立标准文档、既有入口去重、文档索引、全项目索引和 Changelog 已同步，全部文档与治理门禁通过。

## 关联需求

- `BASE-OPS-001`：保持 Windows 本地开发流程可复现，降低 Codex 长期开发中的权限中断。
- `BASE-SEC-004`：本地权限、沙箱、Owner 和 ACL 修复必须具有明确目标、授权和回滚边界。
- `BASE-QUAL-004`：沙箱拒绝、Git 受保护路径、缓存越界和真实 NTFS 失败必须显式区分。
- `BASE-DOC-001`、`BASE-DOC-004`、`BASE-DOC-006`：建立单一权威文档，并同步计划、文档索引和当前事实入口。

## 背景

`plans/2026-08-22_CodexWindowsACL长期治理计划.md` 已完成本机 Windows 原生 Codex 的 A/B 验证，确定长期采用 `elevated + Custom (config.toml)`、精确 uv Cache 可写根和代理环境变量过滤。现有详细内容位于 `docs/operations/ai-assisted-development-workflow.md` 第 26 节，但该章节同时承担 AI 规则读取和交付流程说明，不适合作为 `config.toml`、Windows 沙箱、ACL 故障链路及跨电脑迁移的完整独立标准。

用户进一步确认需要一份独立文档，覆盖用户级配置位置、同机多项目复用、不同电脑迁移、新机初始化、验证、诊断、修复和回滚，并避免把个人路径、凭据或本机信任状态误当成可直接复制的项目配置。

## 目标

1. 新建 `docs/operations/codex-windows-config-acl-governance.md`，作为 Codex Windows 配置、沙箱和 ACL 治理的唯一详细操作来源。
2. 固化 `elevated + Custom (config.toml)` 的推荐基线、适用前提、安全边界和配置模板。
3. 明确用户级 `~/.codex/config.toml` 与项目级 `<repo>/.codex/config.toml` 的作用域、覆盖关系、信任要求和使用条件。
4. 建立从首次初始化、同机多项目复用到跨电脑迁移的完整链路，明确哪些字段可以迁移、哪些状态必须在新电脑重建。
5. 建立 Owner 混杂、真实 NTFS ACL 失败、Codex 沙箱越界、Git 受保护路径、缓存越界、网络和命令审批的分类诊断与最小修复流程。
6. 将既有文档收敛为摘要和入口，避免同一主题存在多份详细正文。

## 非目标

- 不在本计划中修改用户级 `C:\Users\<current-user>\.codex\config.toml` 或任何电脑的实际系统配置。
- 不提交包含用户名、Token、Provider、认证状态、通知命令、旧项目绝对路径或信任记录的个人配置副本。
- 不要求每个仓库创建项目级 `.codex/config.toml`；只有项目确有不同于用户基线的最小覆盖需求时才使用。
- 不将项目迁移到 WSL2、Docker 或 Dev Container，不改变当前 Windows 原生开发基线。
- 不启用 `danger-full-access`，不递归重置整个仓库 ACL，不授予整个用户目录、`AppData` 或磁盘 `FullControl`。
- 不修改 Backend、Admin、Web、API Client、数据库、CI、镜像或生产部署行为。
- 不创建 ADR；本任务整理现有本地运维事实，不新增强制全栈架构决策。

## 现状分析

### 已确认事实

- OpenAI 官方配置参考将用户级配置放在 `~/.codex/config.toml`，并允许受信任项目通过 `<repo>/.codex/config.toml` 提供项目级覆盖。
- OpenAI 官方 Windows sandbox 文档将 `elevated` 作为首选实现，将 `unelevated` 作为隔离较弱的备选实现。
- 当前仓库没有项目级 `.codex/config.toml`，同一 Windows 用户下的多个普通项目可以共享用户级配置。
- 当前本机已经验证 `elevated + Custom`、精确 uv Cache 可写根和代理变量过滤可同时满足 Node 子进程、uv Cache、工作区外写入和网络边界要求。
- `CodexSandbox*` 是 `elevated` 模式的专用低权限账户；文件 Owner 为该账户但实际读写正常时，不属于真实 ACL 故障。
- 当前详细正文分散在 AI 工作流和本地环境文档中，跨电脑迁移与可迁移字段边界尚未形成完整标准。

### 跨电脑迁移风险

- 直接复制整份用户级 `config.toml` 可能携带秘密、Provider、通知命令、插件或 MCP 配置、旧用户名路径和旧项目状态。
- 新电脑的用户名、uv Cache 位置、Codex 安装状态、沙箱本地账户、Windows 防火墙和仓库信任状态不能通过复制配置可靠迁移。
- 即使配置文本一致，新电脑仍必须重新登录、完成 `elevated` 沙箱初始化、选择 Custom、信任仓库并运行正反向验证。

## 方案设计

### 1. 独立权威文档结构

新文档按以下链路组织：

1. 适用范围、术语和非目标。
2. 官方语义与本机验证事实的证据分层。
3. 用户级和项目级 `config.toml` 的位置、作用域、优先级、信任和安全边界。
4. `elevated + Custom (config.toml)` 推荐配置模板及 UI 选项关系。
5. `workspace-write`、最小 `writable_roots`、uv/pnpm Cache、代理变量过滤和默认网络边界。
6. `.git/`、`.agents/`、`.codex/` 等受保护路径与命令审批边界。
7. 单机首次初始化、桌面端重启和正反向验收。
8. 同机多项目复用与项目级配置的例外条件。
9. 跨电脑迁移清单、脱敏模板、新机重建项和验收清单。
10. 故障分类、诊断决策树、最小 Owner/ACL 修复、回滚和升级复核。
11. 禁止操作、剩余风险、官方资料和项目内关联入口。

### 2. 推荐配置模板边界

文档提供不含秘密的示例片段，核心保留：

```toml
approval_policy = "on-request"
approvals_reviewer = "auto_review"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = false
writable_roots = [
  "C:\\Users\\<current-user>\\AppData\\Local\\uv\\cache",
]

[shell_environment_policy.filters]
HTTP_PROXY = "exclude"
HTTPS_PROXY = "exclude"
ALL_PROXY = "exclude"

[windows]
sandbox = "elevated"
```

模板只表达经过验证的沙箱和 ACL 相关字段。实际使用前必须通过 `uv cache dir` 取得准确路径，并按新电脑用户名修正；不得把模板扩展为整份个人配置备份。

### 3. 跨电脑迁移标准

- 允许迁移经过人工审查和脱敏的沙箱、审批、最小可写根及代理过滤片段。
- 禁止迁移 Token、认证状态、Provider 秘密、通知命令、旧机器绝对路径、项目信任记录和不明用途字段。
- 新电脑按“安装与登录、管理员批准初始化 `elevated`、定位 uv Cache、生成本机片段、选择 Custom、信任仓库、执行正反向验证”的顺序重建。
- 拉取仓库代码不会自动完成用户级 Codex 配置；仓库默认也不携带项目级 `.codex/config.toml`。
- 同一电脑同一用户下，用户级配置默认适用于其他工作区；只有存在可证明的项目差异时，才在受信任仓库中增加最小项目级覆盖并纳入项目评审。

### 4. 故障处理标准

- 先收集失败命令、准确路径、错误码、当前权限模式和实际生效配置，再分类。
- Owner 不同但操作正常时不修复；真实 ACL 失败只针对准确失败路径处理。
- 缓存越界通过最小 `writable_roots` 解决，不放行整个用户目录。
- `.git/` 等受保护路径和 Git 写入审批按产品安全边界处理，不通过 ACL 放宽绕过。
- 只有证据确认 DACL 或 Owner 是根因，并取得具体路径授权后，才执行最小 `icacls` 修复。
- 配置变更后必须重启桌面端，并同时验证工作区内正例、工作区外写入反例和默认网络反例。

### 5. 文档去重和关联

- `docs/operations/codex-windows-config-acl-governance.md` 保存完整标准。
- `docs/operations/ai-assisted-development-workflow.md` 第 26 节缩减为概述、任务路由和新文档入口。
- `docs/operations/local-dev-environment.md` 只保留 Windows 原生 Codex 基线和新文档入口。
- `docs/README.md` 增加新文档索引，并修正既有文档用途摘要。
- `.agents/agents-index.md` 将 Codex Windows 权限与 ACL 治理的权威来源指向新文档。
- `CHANGELOG.md` 记录已交付的标准文档与权威来源收敛，不复制操作正文。
- 原 ACL 治理计划保留历史实施事实，不修改为当前操作手册。

## 全栈影响矩阵

| 范围 | 是否涉及 | 工作内容 | 前置依赖 | 验证 |
| --- | --- | --- | --- | --- |
| Backend | 不涉及 | 不修改实现、配置、依赖或测试 | 无 | Git 差异确认无 Backend 变更 |
| Admin | 不涉及 | 不修改实现、配置、依赖或测试 | 无 | Git 差异确认无 Admin 变更 |
| Web | 不涉及 | 不修改实现、配置、依赖或测试 | 无 | Git 差异确认无 Web 变更 |
| API Client | 不涉及 | 不修改 OpenAPI 或生成客户端 | 无 | Git 差异确认无契约与生成文件变化 |
| Database | 不涉及 | 不修改 Model、Alembic 或数据 | 无 | 不执行数据库操作 |
| Deployment | 不涉及 | 不修改 CI、镜像、部署和生产配置 | 无 | Git 差异确认无 Deployment 变更 |
| Documentation | 涉及 | 新建独立标准文档，收敛旧正文并同步索引、计划和 Changelog | 用户确认本计划 | Markdown、工作区、边界、治理门禁和链接检查 |

## 实施顺序

1. 创建本计划并同步 `.agents/agents-index.md`，等待用户确认。
2. 用户确认后将计划状态改为“实施中”，复核 OpenAI 官方配置、Windows sandbox、审批与权限文档。
3. 新建独立标准文档，完整写入配置、迁移、验证、诊断、修复和回滚链路。
4. 缩减 AI 工作流第 26 节和本地环境章节，改为概述与新文档入口。
5. 同步 `docs/README.md`、`.agents/agents-index.md` 和 `CHANGELOG.md`，建立唯一权威来源和双向导航。
6. 复读全部变更，检查链接、模板路径、官方事实与本机验证事实没有混淆。
7. 运行 Markdown、工作区、模块边界、治理和 Git 差异检查，回写计划结果并结束计划。

## 影响文件

- `plans/2026-08-22_CodexWindows配置与ACL标准文档计划.md`
- `.agents/agents-index.md`
- `docs/operations/codex-windows-config-acl-governance.md`
- `docs/operations/ai-assisted-development-workflow.md`
- `docs/operations/local-dev-environment.md`
- `docs/README.md`
- `CHANGELOG.md`

## 风险与回滚

- OpenAI 产品设置可能随桌面端版本变化。实施时只引用官方可核验语义，并把本机验证结果标明日期和环境，不把 UI 文案当成永久 API 契约。
- 迁移章节若边界不清，可能诱导复制秘密或错误路径。模板必须保持脱敏，迁移清单必须区分“可迁移片段”和“必须重建状态”。
- 新旧文档同时保留详细正文会形成漂移。回滚方式是恢复旧章节摘要，但不删除已创建的计划；正式文档创建后仍应通过入口收敛保持单一来源。
- 项目级配置可能覆盖用户安全基线。文档必须明确受信任项目要求、最小覆盖原则和代码评审责任。
- 任何实际本机配置、ACL、Owner 或管理员操作都不属于本计划实施范围；需要执行时必须另行取得精确授权。

## 验证清单

- [x] 已读取全项目索引、计划规范、既有 ACL 计划和现有文档入口。
- [x] 已核验本计划需要新建独立文档并调整权威来源。
- [x] 用户已确认本计划。
- [x] 已复核 OpenAI 官方配置、Windows sandbox、审批与权限文档。
- [x] 新文档覆盖配置层级、Custom、`elevated`、缓存、代理、受保护路径和审批边界。
- [x] 新文档覆盖单机初始化、同机多项目和跨电脑迁移完整链路。
- [x] 新文档覆盖正反向验证、故障决策树、最小修复、禁止操作和回滚。
- [x] 旧详细正文已缩减为入口，未形成两份权威事实。
- [x] `docs/README.md`、`.agents/agents-index.md` 和 `CHANGELOG.md` 已同步。
- [x] `pnpm lint:md` 通过。
- [x] `pnpm check:workspace`、`pnpm check:boundaries` 和 `pnpm check:governance` 通过。
- [x] `git diff --check` 通过，差异仅包含本计划范围内的文档。

## 待确认问题

- 无。计划按“独立权威文档、既有详细章节收敛为入口、不修改实际本机配置”的边界实施。

## 用户确认记录

- 2026-08-22：用户要求将 `config.toml`、`elevated + Custom (config.toml)`、跨电脑迁移和所有 ACL 处理链路整理为一份独立标准文档。
- 2026-08-22：用户明确回复“确认执行”，授权按本计划建立独立权威文档并同步既有入口、索引和 Changelog。

## 实施结果

- 已创建本计划并同步 `.agents/agents-index.md`。
- 已根据 OpenAI Docs 复核用户级与项目级配置、Windows 沙箱、审批安全和 beta 权限配置边界。
- 已新增 `docs/operations/codex-windows-config-acl-governance.md`，作为 `config.toml`、`elevated + Custom`、多项目、跨电脑迁移和 ACL 全链路的唯一详细操作来源。
- 已将 `docs/operations/ai-assisted-development-workflow.md` 第 26 节收敛为任务路由，将 `docs/operations/local-dev-environment.md` 收敛为本地开发摘要和入口。
- 已同步 `docs/README.md`、`.agents/agents-index.md` 和 `CHANGELOG.md`，旧 ACL 计划继续保留历史 A/B 验证事实。
- 已运行 `pnpm lint:md`、`pnpm check:workspace`、`pnpm check:boundaries`、`pnpm check:governance` 和 `git diff --check`，全部通过。

## 剩余问题

- 无。
