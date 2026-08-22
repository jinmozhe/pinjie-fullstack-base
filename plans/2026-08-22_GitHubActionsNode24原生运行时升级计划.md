# GitHub Actions Node.js 24 原生运行时升级计划

## 当前状态和结果

| 字段 | 当前值 |
| --- | --- |
| 状态 | 已结束 |
| 结果 | 已完成 |
| 创建日期 | 2026-08-22 |
| 影响范围 | Deployment、Documentation |

## 关联需求

- `BASE-OPS-003`、`BASE-OPS-007`、`BASE-OPS-008`：质量门禁、发布分离和失败关闭必须使用受支持且可核验的运行时。
- `BASE-SEC-005`：供应链 Action 必须固定完整 Commit SHA，并通过明确评审升级。

## 背景

GitHub-hosted Runner 自 2026-06-16 起默认使用 Node.js 24 执行 JavaScript
Actions。本项目自身使用 Node.js 24，但当前固定的十个旧版 Action 提交仍在各自
`action.yml` 中声明 `runs.using: node20`。GitHub Runner 会兼容覆盖为 Node.js 24 并产生
迁移告警，因此当前成功结果不能替代原生 Node.js 24 Action 升级。

用户要求消除 Node.js 20 兼容执行和告警。仓库继续保留完整 Commit SHA Pinning，不通过
移除版本、使用浮动标签或设置 `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION` 绕过告警。

## 目标

1. 将七个工作流中直接声明 `node20` 的十个 Action 升级到原生 `node24` 的最新正式 Release。
2. 所有 `uses:` 继续固定完整 40 位 Commit SHA，并保留可读的 Release 版本注释。
3. 保持工作流触发条件、权限、输入、发布分离、安全扫描和生产部署行为不变。
4. 本地验证工作流文本、治理门禁和上游元数据，推送后再用 GitHub Actions 证明告警消失。

## 非目标

- 不升级项目 Node.js 24 LTS 基线到 Node.js 26 Current。
- 不修改 pnpm、应用依赖、OpenAPI、API Client、数据库或应用源码。
- 不取消完整 SHA Pinning，不允许浮动 Major Tag。
- 不发布 GHCR、不创建 Tag 或 Release、不执行生产部署或生产数据库操作。
- 未取得独立授权前不提交或推送本次修改。

## 现状分析

当前七个工作流共有十五个直接 Action 仓库引用。其中五个使用 `node24`、Composite 或
Docker 运行方式，以下十个固定提交直接声明 `node20`：

| Action | 当前注释版本 | 目标 Release | 目标 Commit SHA | 目标运行时 |
| --- | --- | --- | --- | --- |
| `actions/checkout` | `v4` | `v7.0.1` | `3d3c42e5aac5ba805825da76410c181273ba90b1` | `node24` |
| `actions/setup-node` | `v4` | `v7.0.0` | `820762786026740c76f36085b0efc47a31fe5020` | `node24` |
| `pnpm/action-setup` | `v4` | `v6.0.10` | `0977fd99725f1db4007ccb2928dbb4e90d06cc86` | `node24` |
| `gitleaks/gitleaks-action` | `v2` | `v3.0.0` | `e0c47f4f8be36e29cdc102c57e68cb5cbf0e8d1e` | `node24` |
| `actions/dependency-review-action` | `v4` | `v5.0.0` | `a1d282b36b6f3519aa1f3fc636f609c47dddb294` | `node24` |
| `docker/setup-buildx-action` | `v3` | `v4.3.0` | `37fe631027851001ddb9b187196cc803df7f5f0e` | `node24` |
| `docker/login-action` | `v3` | `v4.6.0` | `dbcb813823bdd20940b903addbd779551569679f` | `node24` |
| `docker/build-push-action` | `v6` | `v7.3.0` | `53b7df96c91f9c12dcc8a07bcb9ccacbed38856a` | `node24` |
| `actions/upload-artifact` | `v4` | `v7.0.1` | `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` | `node24` |
| `actions/download-artifact` | `v4` | `v8.0.1` | `3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c` | `node24` |

目标版本和 Commit SHA 已通过 GitHub Release、Git Tag 对象与目标提交的 `action.yml`
交叉核对。完整 SHA Pinning 的远端策略允许这些既有 Action 仓库，不需要扩大允许列表。

## 方案设计

1. 在全部七个工作流中统一替换相同 Action 的固定 SHA 和版本注释，禁止同一仓库出现新旧混用。
2. 保留每个 Action 的现有输入、权限和步骤顺序；若新 Major 已删除或改变现有输入，停止实施并回到本计划记录差异，不静默删减行为。
3. 读取修改后每个固定提交的 Action 元数据，要求所有直接 JavaScript Action 均为 `node24`，其他引用只能是 Composite 或 Docker。
4. 运行仓库既有 Markdown、治理、工作区、边界和生产配置门禁。
5. 后续取得提交和推送授权后，等待四个自动工作流成功，检查所有 Job annotations 不再出现 Node.js 20 迁移告警；PR 专属与人工工作流按实际授权另行验证。

## 全栈影响矩阵

| 范围 | 是否涉及 | 工作内容 | 前置依赖 | 验证 |
| --- | --- | --- | --- | --- |
| Backend | 不涉及 | 不修改 Backend 源码或依赖 | 无 | 工作区和边界检查 |
| Admin | 不涉及 | 不修改 Admin 源码或依赖 | 无 | 工作区和边界检查 |
| Web | 不涉及 | 不修改 Web 源码或依赖 | 无 | 工作区和边界检查 |
| API Client | 不涉及 | 不修改契约或生成客户端 | 无 | Git 差异检查 |
| Database | 不涉及 | 不修改模型、迁移或数据 | 无 | Git 差异检查 |
| Deployment | 涉及 | 升级七个工作流中的十个 Action 固定 SHA | GitHub Release 与元数据 | 静态审计、治理门禁、线上 Actions |
| Documentation | 涉及 | 同步计划、索引、工作流说明和 Changelog | 实施与验证事实 | `pnpm lint:md` |

## 实施顺序

1. 创建本计划并登记到全项目索引，等待用户确认十项 Action 升级范围。
2. 用户确认后将计划和索引更新为“实施中”。
3. 复读十个目标 Release 的升级说明，确认现有输入与行为可继续使用。
4. 一次性更新七个工作流中的固定 SHA 和版本注释。
5. 执行 Action 元数据审计和完整 SHA Pinning 检查。
6. 同步 GitHub Actions 运维说明、项目索引、Changelog 和计划结果。
7. 运行 Markdown、治理、工作区、边界、生产配置与 Git 差异检查。
8. 未经独立授权不提交或推送；取得授权后通过线上四组自动门禁和 annotations 复核完成最终验收。

## 影响文件

- `.github/workflows/ci-governance.yml`
- `.github/workflows/ci-backend.yml`
- `.github/workflows/ci-frontend.yml`
- `.github/workflows/ci-e2e.yml`
- `.github/workflows/security.yml`
- `.github/workflows/publish-images.yml`
- `.github/workflows/deploy-production.yml`
- `docs/operations/github-actions-workflows.md`
- `docs/architecture/project-structure.md`
- `.agents/agents-index.md`
- `CHANGELOG.md`
- `plans/2026-08-22_GitHubActionsNode24原生运行时升级计划.md`

## 风险与回滚

- 风险：十个 Action 包含跨 Major 升级，输入默认值、Runner 要求、Artifact 格式或发布行为可能变化。
- 控制：升级前逐项复读 Release 说明；保留现有输入和最小权限；自动 CI、PR 专属、人工发布和部署能力分别记录验证边界。
- 风险：只验证自动 Push 工作流不能证明 PR 专属、镜像发布和生产部署工作流已经执行。
- 控制：静态元数据审计覆盖全部七个工作流；未执行的线上路径明确记录，不伪装为通过。
- 回滚：按 Action 分组恢复本计划记录的原固定 SHA 和版本注释，不改变应用代码、依赖锁文件、Git 历史或远端安全策略。

## 验证清单

- [x] 当前固定 Action 元数据全量审计完成，识别十个直接 `node20` Action。
- [x] 十个目标 Release、完整 Commit SHA 和 `runs.using: node24` 已交叉核对。
- [x] 七个工作流不存在直接声明 `node20` 的固定 Action。
- [x] 所有 `uses:` 保持完整 40 位 Commit SHA，版本注释与目标 Release 一致。
- [x] 工作流触发器、权限、输入、步骤和安全门禁未被弱化。
- [x] `pnpm lint:md` 通过。
- [x] `pnpm check:governance`、`pnpm check:workspace` 和 `pnpm check:boundaries` 通过。
- [x] 本任务差异只包含计划授权的工作流、文档、索引和计划；工作区既有其他修改保持原样。
- [x] 推送后的四个自动工作流成功且 Node.js 20 annotations 为 0。
- [x] PR 专属、Browser E2E、Publish Images 和 Deploy Production 的未执行边界如实记录。

## 待确认问题

- 无。

## 用户确认记录

- 2026-08-22：用户确认要消除 Node.js 20 兼容执行和告警，并要求执行修复。由于全量审计发现范围包含十个跨 Major Action，等待用户确认本计划列出的完整升级边界后开始修改工作流。
- 2026-08-22：用户确认按计划一次性升级全部十个 Node.js 20 Action，计划进入“实施中”。
- 2026-08-22：用户调用 `$git-sync`，明确授权提交并推送本任务修改。

## 实施结果

- 七个工作流中的十个旧版 Action 已统一升级到计划固定的原生 Node.js 24 正式版本，
  工作流触发器、权限、输入和步骤顺序保持不变。
- 十个目标 Release、Tag Commit SHA、Action 元数据和现有输入已交叉核对。修改后十五个直接
  Action 中，JavaScript Action 全部声明 `node24`，其余为 Composite 或 Docker，直接
  `node20` 数量为 0。
- 七个工作流共 48 处 `uses:` 全部固定完整 40 位 Commit SHA，十个升级目标在所有引用处
  版本一致，未设置 `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION`。
- `pnpm lint:md`、`pnpm check:governance`、`pnpm check:workspace`、
  `pnpm check:boundaries` 和 `git diff --check` 均通过。
- 实施提交 `8e4a225bc5ff1d04b507379497fbc8356e7c7757` 已推送到 `origin/main`。
  Governance `32543607320`、Security `32543607358`、Backend `32543607369` 和
  Frontend `32543607366` 全部成功；13 项 Check Run 无失败，全部 annotations 为 0，
  Node.js 20 迁移告警为 0。
- 未发布镜像、未创建 Tag 或 Release、未部署生产，也未操作生产数据库。

## 剩余风险

- 本计划范围内没有未完成的实施项。
- PR 专属 Dependency Review、人工 Browser E2E、Publish Images 和 Deploy Production
  本轮未执行；静态元数据审计覆盖这些工作流，其真实执行仍应在对应 PR、跨栈复核、发布
  或部署授权成立时验证。
