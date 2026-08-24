# Codex Windows gh Keyring 宿主执行治理计划

## 当前状态和结果

- 状态：已结束
- 结果：已完成。认证型 `gh` 命令的 Windows Keyring 宿主执行、准确审批、远端副作用授权和明文 Token 禁止边界已同步到根规则、权威运维文档、索引与 Changelog，文档和治理门禁通过。

## 关联需求

- 无。此次调整属于 Windows 本地开发环境的 Codex、GitHub CLI 与凭据边界治理，不改变产品能力。

## 背景

当前 Windows 原生 Codex 使用 `elevated + Custom (config.toml)`、`workspace-write`、默认联网和 Windows Keyring 保存 GitHub CLI 凭据。

本机已验证：普通宿主 PowerShell 中的 `gh auth status`、`gh api user --jq .login` 和认证型 GitHub Actions 查询可以读取当前登录凭据；Codex 沙箱内的 `gh auth status` 与 `gh api user` 仍会使用旧凭据并返回 `401`。现有证据将问题收窄为 Windows Keyring 的执行上下文隔离，不代表宿主用户的 GitHub Token 再次失效。

现有规则只覆盖 Schannel 系统 HTTPS 客户端的准确宿主升级，没有明确覆盖 `gh` 与 Windows Keyring。后续任务可能重复在沙箱中执行认证检查，并把预期的隔离结果误报为登录失效。

## 目标

1. 在根 `AGENTS.md` 固化认证型 `gh` 命令直接申请准确宿主执行的长期规则。
2. 在 Codex Windows 权威运维文档记录事实边界、诊断方法、执行步骤、审批语义和安全限制。
3. 明确 AGENTS 行为约束、单次宿主升级、可选窄范围规则和远端操作授权之间的职责差异。
4. 禁止通过明文 Token、宽泛 `gh` 放行或长期完整访问绕过 Windows Keyring 隔离。

## 非目标

- 不修改 Windows Keyring、GitHub Token、`GH_TOKEN`、用户级 `config.toml` 或全局 `.rules`。
- 不执行 `gh auth login/logout`、提交、推送、工作流触发、发布、部署、删除或权限修改。
- 不把全部 `gh` 命令加入长期允许规则。
- 不把当前本机现象表述为所有 Windows 环境或 GitHub CLI 版本的普遍缺陷。

## 现状分析

- OpenAI 官方文档将沙箱技术边界与审批策略区分管理；`workspace-write + on-request` 支持按准确命令申请越界执行。
- OpenAI 官方 `.rules` 采用命令参数前缀匹配，可允许、逐次提示或禁止宿主执行请求；宽泛前缀会扩大授权范围。
- 根 `AGENTS.md` 已规定 Schannel 边界只升级准确宿主命令，但没有覆盖依赖 Windows Keyring 的 GitHub CLI。
- `docs/operations/codex-windows-config-acl-governance.md` 是当前项目 Codex Windows 权限、网络与 ACL 治理的唯一权威文档，适合承载详细操作步骤。

## 方案设计

### 1. 根规则

在根 `AGENTS.md` 增加稳定约束：当前 Windows 原生 Codex 环境中，依赖当前 `gh` 登录态或 Windows Keyring 的命令禁止先在沙箱内验证，必须通过 Codex 审批机制以宿主身份执行准确单条命令。

同时明确宿主升级只解决凭据读取边界，不授予远端副作用；认证变更和远端写操作仍需独立明确授权。

### 2. 权威运维文档

在 `docs/operations/codex-windows-config-acl-governance.md` 增加 GitHub CLI 与 Windows Keyring 专节，说明：

- 已验证现象和判定条件。
- `sandbox_permissions = "require_escalated"` 的工具执行语义。
- 用户审批、自动审查和可选 `.rules` 前缀规则的职责。
- 适合窄范围放行的只读命令，以及禁止宽泛放行的命令类别。
- 禁止明文 Token 和完整访问绕过。

### 3. 治理同步

同步 `docs/README.md`、`.agents/agents-index.md`、`CHANGELOG.md` 和本计划实施结果。权威文档路径不变，索引用途增加 GitHub CLI Keyring 边界。

## 全栈影响矩阵

| 范围 | 是否涉及 | 工作内容 | 前置依赖 | 验证 |
| --- | --- | --- | --- | --- |
| Backend | 不涉及 | 无 | 无 | 不运行应用测试 |
| Admin | 不涉及 | 无 | 无 | 不运行应用测试 |
| Web | 不涉及 | 无 | 无 | 不运行应用测试 |
| API Client | 不涉及 | 无 | 无 | 不生成契约 |
| Database | 不涉及 | 无 | 无 | 不运行迁移 |
| Deployment | 不涉及 | 无 | 无 | 不运行部署检查 |
| Documentation | 涉及 | 更新根规则、Codex Windows 权威文档、计划、索引和 Changelog | 用户已确认实施 | Markdown、工作区、边界、治理和文本卫生门禁 |

## 实施顺序

1. 创建计划并同步全项目索引。
2. 更新根 `AGENTS.md` 的长期执行规则。
3. 更新 Codex Windows 权威运维文档的事实、步骤、示例与安全边界。
4. 同步 Changelog、计划实施结果和索引状态。
5. 运行 Markdown、工作区、边界、治理、文本卫生和差异检查。

## 影响文件

- `plans/2026-08-24_CodexWindowsGhKeyring宿主执行治理计划.md`
- `.agents/agents-index.md`
- `AGENTS.md`
- `docs/operations/codex-windows-config-acl-governance.md`
- `docs/README.md`
- `CHANGELOG.md`

## 风险与回滚

- 风险：把宿主执行误解为 `gh` 远端写操作授权。通过根规则和命令分类明确分离。
- 风险：过宽 `.rules` 前缀使高风险 `gh` 子命令跳过审批。文档只提供精确只读前缀，并明确禁止 `pattern = ["gh"]` 和宽泛 `gh api` 放行。
- 风险：把本机现象写成上游确定根因。文档只记录已验证行为、判断依据和当前处理边界。
- 回滚：只恢复本次规则和文档差异；计划文件永久保留并按实际结果标记，不删除、移动或重命名。

## 验证清单

- [x] `pnpm lint:md`
- [x] `pnpm check:workspace`
- [x] `pnpm check:boundaries`
- [x] `pnpm check:governance`
- [x] 项目文本卫生脚本
- [x] `git diff --check`
- [x] 复读全部修改段落，检查 UTF-8、命令边界、链接、表格和规则一致性

## 待确认问题

- 无。用户已明确确认按建议直接实施。

## 用户确认记录

- 2026-08-24：用户明确要求按照已讨论的分层方案直接修改并确认执行。

## 实施结果

- 根 `AGENTS.md` 已增加长期规则：认证型 `gh` 跳过沙箱认证探测，直接以准确单条命令申请宿主用户 PowerShell 执行。
- 根规则继续要求 `gh auth login/logout` 和所有远端写操作独立授权，并禁止宽泛 `gh`、`gh api` 自动放行及明文 Token 绕过。
- Codex Windows 权威运维文档已增加本机对照事实、GitHub CLI Keyring 分类、`require_escalated` 执行步骤、职责分层、窄范围 `.rules` 示例、禁止项和升级复核条件。
- `docs/README.md`、`.agents/agents-index.md` 和 `CHANGELOG.md` 已同步新的文档用途、计划状态和已交付事实。
- 宿主上下文中的 `gh auth status` 与 `gh api user --jq .login` 验证通过，当前账户为 `jinmozhe`，凭据存储为 Windows Keyring。
- `pnpm lint:md`、`pnpm check:workspace`、宿主 `pnpm check:boundaries`、宿主 `pnpm check:governance`、项目文本卫生脚本和 `git diff --check` 均通过。边界与治理门禁首次在沙箱中因既有 `apps/backend/.pytest_cache` 读取 ACL 被阻断，未删除或修改该缓存，改用准确宿主命令复验通过。
- 文本卫生脚本的唯一告警来自既有 `.env.example` 公开占位值 `replace_with_a_strong_production_password`，人工复核确认不包含真实凭据。

## 剩余问题

- 桌面端打包目录中的 `codex.exe` 无法在当前任务内作为子进程启动，沙箱与宿主尝试均返回 Windows `Access is denied`，因此未实际运行 `codex execpolicy check`。文档中的 `.rules` 示例已按 2026-08-24 OpenAI Docs 的准确前缀语法拆分为三个独立只读规则，本任务未修改用户级 `.rules`，该验证缺口不影响根 `AGENTS.md` 行为规则。
- 当前 Keyring 上下文隔离仍是本机与当前桌面端的验证事实。Codex、GitHub CLI 或 Windows 凭据管理升级后，按权威文档重新对照验证；沙箱连续通过后删除宿主升级兜底。
