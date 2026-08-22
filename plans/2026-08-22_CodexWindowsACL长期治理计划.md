# Codex Windows ACL 长期治理计划

## 当前状态和结果

- 状态：已结束
- 结果：已完成。长期采用 `elevated + Custom`、精确 uv Cache 可写根和代理环境过滤；Owner、uv、Node 子进程、工作区外写入、默认网络与显式直连正反向验证全部通过。没有真实 NTFS 失败，未修改 Owner。

## 关联需求

- `BASE-OPS-001`：保持 Windows 本地开发流程可复现，降低 Codex 持续维护中的权限中断。
- `BASE-SEC-004`：本地权限和 Owner 修复必须具有明确目标、预览、授权和回滚边界。
- `BASE-QUAL-004`：沙箱拒绝、Git 受保护路径、缓存路径和真实 ACL 失败必须显式区分，禁止静默绕过。
- `BASE-DOC-001`、`BASE-DOC-004`、`BASE-DOC-006`：使用同一份计划追踪治理变更，同步全项目索引和 `docs/` 权威运维入口。

## 背景

当前开发环境是 Windows 原生 ChatGPT/Codex 桌面端和 PowerShell，不是 Docker Desktop 或 WSL2 内的 Linux 容器。根据 2026-08-22 核验的 [OpenAI 官方 Windows sandbox 文档](https://learn.chatgpt.com/docs/windows/windows-sandbox)，Windows 原生沙箱提供两种实现：

- `elevated` 是官方首选的强隔离模式，使用专用低权限 Windows 用户、文件系统权限边界和防火墙规则。
- `unelevated` 是较弱的备选模式，使用从当前 Windows 用户派生的受限 Token 和 ACL 边界。

本机基线审计时用户级 `config.toml` 选择 `sandbox = "elevated"`。长周期开发中，Codex 命令创建或以临时文件替换项目文件时，可能使新文件的 Owner 成为 `CodexSandboxOffline`。当后续操作由当前用户、Git、pnpm、uv 或其他 Windows 工具执行时，Owner 混杂、缓存路径越界和 Codex 受保护路径容易被统称为“ACL 问题”，造成反复诊断、审批和工具切换。

## 目标

1. 建立 Windows 原生 Codex 沙箱、NTFS Owner/ACL、Codex 工作区边界、Git 受保护路径和依赖缓存的统一诊断模型。
2. 在不启用 `danger-full-access`、不对仓库递归授予 `FullControl` 的前提下，减少日常开发中的 Owner 混杂和重复审批。
3. 通过受控 A/B 验证决定是否将本机长期模式从 `elevated` 切换为 `unelevated`，保留可验证的回滚路径。
4. 将 Git 越界审批和真实 NTFS 权限失败分开处理，把受控 Git 写操作集中到任务交付阶段。
5. 把稳定结论写入现有权威运维文档，并提供可重复的诊断和修复步骤。

## 非目标

- 不将项目迁移到 WSL2，不改变现有 Windows 原生 uv、pnpm、PostgreSQL 和 Docker Desktop Redis 基线。
- 不启用 `danger-full-access`，不禁用工作区沙箱或网络审批。
- 不递归执行 `icacls /reset`、`/grant ... FullControl` 或删除 `CodexSandboxUsers` 与未知 SID ACE。
- 不把 `git commit`、`git push`、发布或生产操作加入无条件长期放行规则。
- 不修改 Backend、Admin、Web、API Client、数据库或生产部署行为。
- 不把单个开发者的机器路径或账户名写成母版硬约束。

## 现状分析

### 已核验的本机事实

- 仓库根目录 Owner 是当前 Windows 用户，ACL 未关闭继承。
- 仓库根 ACL 包含 `CodexSandboxUsers: Modify`，并存在两个无法解析为帐户名的显式 SID ACE。
- `CodexSandboxUsers` 当前包含 `CodexSandboxOffline` 和 `CodexSandboxOnline` 两个本地 Windows 用户。
- 当时存在的 264 个 Git 已跟踪路径中，242 个由当前用户拥有，22 个由 `CodexSandboxOffline` 拥有；没有已跟踪路径启用受保护 ACL。
- pnpm Store 位于仓库内 `.pnpm-store/v11`，已处于工作区可写范围。
- uv Cache 位于用户目录下的 `AppData/Local/uv/cache`，不属于默认工作区可写范围。
- 当前 Codex 任务使用 `workspace-write` 和自动审查；`.git/` 受保护，Git 写操作可能需要越界审批。

### 需要分类的四类现象

1. **Owner 混杂**：文件由 `CodexSandboxOffline` 拥有，但 DACL 仍可能允许当前用户修改；不得自动表述为访问拒绝。
2. **真实 NTFS ACL 失败**：存在显式 Deny、继承断开、缺失 Modify/Delete 或路径无法读写，需要针对失败路径修复。
3. **Codex 沙箱越界**：`.git/`、`.codex/`、用户级缓存或工作区外路径受到产品安全边界限制，不是 NTFS 损坏。
4. **命令授权边界**：Git 提交、推送、网络访问或高风险命令依据项目规则和 Codex Rules 单独审批，不得用广泛 ACL 放行替代。

## 方案设计

### 1. 基线留证与失败分类

- 保存当前 Codex Windows 沙箱模式、仓库根 Owner/DACL、已跟踪文件 Owner 分布、受保护 ACL 数量和未解析 SID 摘要，不记录真实凭据或完整个人 SID。
- 对每次“ACL 问题”先记录失败命令、准确路径、Windows 错误码和所属类别，禁止在未分类时执行全仓库递归修复。

### 2. 受控评估 `unelevated`

- 备份用户级 `config.toml` 中的当前相关配置，但不复制认证或秘密状态。
- 在用户确认实施后，将 Windows 原生沙箱候选模式设为 `unelevated`，保留 `workspace-write`、`on-request`、自动审查和默认断网边界。
- 重启 ChatGPT/Codex 桌面端后，在可删除的测试目录中验证新建、覆盖、重命名和删除后的 Owner，并运行 Git、pnpm 和 uv 的最小冒烟。
- 同时验证工作区外写入仍失败、网络仍需审批、`.git/` 写操作仍遵守项目独立授权。
- 只有当 Owner 稳定归当前用户、日常工具流程通过且安全边界未意外放宽时，才将 `unelevated` 作为本机长期模式；否则回滚为 `elevated`。

### 3. 最小可写根和 Codex Rules

- pnpm Store 继续使用仓库内被 Git 忽略的 `.pnpm-store/`，不放行整个用户目录。
- 仅在 uv 操作已证明因缓存路径反复越界时，才把当前用户的 uv Cache 目录加入 `sandbox_workspace_write.writable_roots`；不放行 `USERPROFILE`、`AppData` 或全局工具目录。
- 仅对可重复、目标稳定、无数据删除、无秘密传输且无对外副作用的精确命令前缀建立 `allow` Rule。
- `git commit`、`git push`、发布和生产命令继续按根规则独立授权，不通过用户级 Rule 绕过。

### 4. 一次性最小 Owner 归一

- 先以只读方式列出 Git 已跟踪且 Owner 匹配 `CodexSandbox*` 的现存文件。
- 只在用户再次确认准确文件清单后，通过 `icacls /setowner` 将这些文件 Owner 改为当前用户。
- 不更改 DACL、不修复未跟踪依赖目录、不删除 ACE、不追踪或输出完整个人 SID。
- 修复后重新统计 Owner 分布，并验证 Git、编辑器、pnpm 和 uv 对相关路径的读写、重命名和删除能力。

### 5. 开发和交付流程收敛

- 实施阶段只使用 `git status`、`git diff`、`git log` 和 `git show` 等只读 Git 操作核对差异。
- 不在任务中间反复暂存、提交或推送；交付阶段只在用户明确授权后使用同一份任务计划和 `git-sync` 集中执行。
- 遇到越界审批时优先判断是受保护路径、缓存路径、网络还是真实 ACL，不通过改 Owner 处理产品审批边界。

### 6. 文档单一来源

- `docs/operations/ai-assisted-development-workflow.md` 作为 Codex 权限模型、ACL 分类、日常工作流和故障处置的详细操作来源。
- `docs/operations/local-dev-environment.md` 只保留 Windows 原生 Codex 基线、安全选择和上述详细手册入口，不复制完整步骤。
- `docs/README.md` 仅更新两份现有运维文档的用途摘要，不新建平行 ACL 手册。
- `.agents/agents-index.md` 记录计划状态和当前治理事实，不复制运维正文。
- 本变更属于单机开发操作治理，不创建 ADR；若未来要求所有派生仓库强制使用某一 Codex 沙箱模式，再单独评估 ADR。

## 全栈影响矩阵

| 范围 | 是否涉及 | 工作内容 | 前置依赖 | 验证 |
| --- | --- | --- | --- | --- |
| Backend | 不涉及 | 不修改实现、依赖、配置或测试 | 无 | Git 差异确认无 Backend 变更 |
| Admin | 不涉及 | 不修改实现、依赖或构建配置 | 无 | Git 差异确认无 Admin 变更 |
| Web | 不涉及 | 不修改实现、依赖或构建配置 | 无 | Git 差异确认无 Web 变更 |
| API Client | 不涉及 | 不修改 OpenAPI 或生成客户端 | 无 | Git 差异确认无生成漂移 |
| Database | 不涉及 | 不修改 Model、Alembic 或数据 | 无 | 不执行数据库操作 |
| Deployment | 不涉及 | 仅评估开发者本机 Codex 配置，不改变 CI、镜像或生产 | 用户确认后才可改本机配置 | 工作区外写入和网络边界反向验证 |
| Documentation | 涉及 | 更新 AI 工作流、本地环境手册、文档索引、全项目索引、计划和 Changelog | 用户确认本计划 | Markdown、工作区、边界和治理门禁 |

## 实施顺序

1. 创建本计划，同步 `.agents/agents-index.md`，等待用户确认。
2. 确认后将计划转为“实施中”，复核 Git 差异和用户级 Codex 配置的非敏感字段。
3. 更新 `docs/operations/ai-assisted-development-workflow.md`、`docs/operations/local-dev-environment.md` 和 `docs/README.md`，先固化分类、安全边界、操作步骤和回滚。
4. 在精确授权后备份非敏感配置并受控切换 `unelevated`，重启桌面端。
5. 在新任务中执行 Owner、Git、pnpm、uv、工作区边界和网络边界验证，根据结果保留 `unelevated` 或回滚 `elevated`。
6. 当且仅当新模式不再产生沙箱 Owner 混杂时，请求一次性 Owner 归一授权，预览后仅修复 Git 已跟踪异常文件。
7. 运行文档与治理门禁，回写计划、索引、Changelog、验证证据和剩余风险。

## 影响文件

- `plans/2026-08-22_CodexWindowsACL长期治理计划.md`
- `.agents/agents-index.md`
- `docs/operations/ai-assisted-development-workflow.md`
- `docs/operations/local-dev-environment.md`
- `docs/README.md`
- `CHANGELOG.md`
- 用户级 `CODEX_HOME/config.toml`（仓库外，需要单独精确授权，不进入 Git）

## 风险与回滚

- `unelevated` 的网络隔离弱于 `elevated`。验证必须同时包含功能正例和工作区外写入、默认断网反例；正例失败或反例未通过立即回滚 `elevated`。
- 本地回环代理可能绕过只针对外部套接字的防火墙边界。网络反例必须同时检查代理环境继承、默认请求和显式直连；通过 `shell_environment_policy.filters` 精确排除代理变量，不修改宿主系统代理。
- 配置修改可能因桌面端动态权限模式而被会话覆盖。必须在重启后读取当前任务的实际沙箱与审批上下文，不仅凭 `config.toml` 文本判断。
- Owner 修复需要管理员权限，且可能影响正在运行的进程。执行前必须停止相关项目进程、生成准确清单并仅修改 Owner；回滚为重新运行原生沙箱设置并恢复原模式。
- 将过宽命令前缀写入 Rules 可能绕过合理审批。仅保留可证明的最小前缀，任何提交、推送、删除和外部副作用仍按任务授权。
- 若官方 Codex 沙箱语义变化，先重新查阅 OpenAI Docs，再修订本手册，不保留无期限的历史兼容分支。

## 验证清单

- [x] 已核验 OpenAI Docs 中 Windows 原生 `elevated` 和 `unelevated` 语义。
- [x] 已完成本机仓库根 ACL、沙箱本地用户、已跟踪文件 Owner 分布和缓存路径的只读基线审计。
- [x] 用户已确认本计划和 `unelevated` 受控评估路线。
- [x] 长期运维正文、本地环境入口和文档索引已同步，且没有复制完整事实。
- [x] `unelevated` 下新建、覆盖、重命名和删除测试文件的 Owner 符合预期。
- [x] Git 只读命令正常，Git 写入和独立交付授权边界未放宽。
- [x] pnpm Store 可用；选择 Custom 模式后，uv Cache 在精确可写根下可用。
- [x] 工作区外写入仍失败。
- [x] `elevated` 下代理变量未进入命令环境，默认代理路径和显式直连网络访问均受限或要求审批。
- [x] 已确认 `elevated` 会继续产生沙箱 Owner；没有真实 NTFS 失败，不执行无效且会复发的一次性 Owner 归一。
- [x] `pnpm lint:md` 通过。
- [x] `pnpm check:workspace`、`pnpm check:boundaries` 和 `pnpm check:governance` 通过。
- [x] `git diff --check` 通过，当前差异只包含本计划范围内的文档；最终仍需在重启验证后复核。

## 待确认问题

- 无。最终验证未发现真实 NTFS 失败，因此不需要也不申请 Owner 归一。

## 用户确认记录

- 2026-08-22：用户要求先将 Codex Windows ACL 长期治理结论沉淀到项目文档，创建并关联计划与索引，目标是解决长期反复的 ACL 和审批摩擦。
- 2026-08-22：用户明确确认按本计划继续实施，包括先更新权威运维文档并执行 `unelevated` 受控评估；Owner 修复仍以验证后生成的准确清单为独立确认边界。
- 2026-08-22：用户完成最终重启并保持“自定义（`config.toml`）”，授权继续完成最终验证和计划收口。

## 实施结果

- 已创建本计划并同步 `.agents/agents-index.md`。
- 用户已确认计划，计划进入实施中。
- 已更新 `docs/operations/ai-assisted-development-workflow.md`，建立 Windows 原生 Codex、四类失败模型、候选配置、正反向验证、Owner 归一和 Git 收敛的详细操作来源。
- 已更新 `docs/operations/local-dev-environment.md` 和 `docs/README.md`，保留本地环境基线和详细手册入口；已同步 `CHANGELOG.md`。
- 切换前确认 pnpm Store 位于仓库内 `.pnpm-store/v11`；`uv cache dir` 位于用户目录，旧沙箱执行最小 `uv run` 时在 Cache 内复现 Windows `os error 5`。
- 已对用户级 `config.toml` 进行带唯一性校验的最小更新：显式保留 `workspace-write`、`on-request`、自动审查和默认断网，仅增加准确 uv Cache 可写根，并把 Windows 候选模式从 `elevated` 切换为 `unelevated`；未修改模型、插件、MCP、项目、Provider 或凭据字段。
- 用户级 `config.toml` 已通过 Python 标准库 TOML 解析和目标字段断言；实际沙箱生效情况仍以桌面端重启后的新任务为准。
- 重启后确认 `unelevated` 使用当前用户派生的受限 Token，仓库内创建、覆盖和重命名 Owner 均为当前用户，工作区外写入被拒绝。
- 桌面端“帮我批准”模式没有采用 `sandbox_workspace_write.writable_roots`；切换为“自定义（`config.toml`）”后，uv Cache 普通写入和 `uv run` 均通过，证明权限菜单会覆盖用户级自定义边界。
- `unelevated` 自定义模式下 Node 子进程出现 `EPERM`，导致治理门禁无法运行；结合官方将其定义为较弱 fallback，拒绝该候选并将 `[windows].sandbox` 回滚为 `elevated`。
- 回滚后确认 `elevated` 的直接公网套接字被防火墙阻断，但默认 PowerShell 请求仍通过继承的 `HTTP_PROXY` 和 `HTTPS_PROXY` 访问 `127.0.0.1:10808` 并返回 200；临时移除代理变量后默认请求也被阻断，证明根因是宿主回环代理绕过，与 `unelevated` 无直接因果关系。
- 已在用户级 `config.toml` 增加 `shell_environment_policy.filters`，精确排除 `HTTP_PROXY`、`HTTPS_PROXY` 和 `ALL_PROXY`，未修改宿主系统代理或其他配置；TOML 解析、目标字段断言和重启后实际生效验证均通过。
- 桌面端重启后自动生成了新的顶层 `notify`，同时暴露旧值误归入 `[sandbox_workspace_write]`；已删除旧嵌套项并通过 TOML 解析确认 `notify` 只存在于顶层，未修改通知值或其他无关配置。
- 已运行 `pnpm lint:md`、`pnpm check:workspace`、`pnpm check:boundaries`、`pnpm check:governance` 和 `git diff --check`，全部通过。
- 尚未修改 Codex Rules 或 NTFS Owner。
- 最终重启后确认三个代理变量均未进入命令环境；当前身份为 `CodexSandboxOffline`，仓库内创建、覆盖、重命名和清理成功，Owner 保持沙箱账户且不影响操作。
- 最终重启后确认 uv Cache、`uv run` 和 Node 子进程正常；工作区外写入被 `UnauthorizedAccessException` 阻断，默认网络请求和显式 `-NoProxy` 直连均被 Windows 网络边界阻断。

## 剩余问题

- 无。未来只有出现可复现的真实 NTFS 失败时，才按准确路径重新诊断并另行确认修复。
