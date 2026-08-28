# VS Code Ruff 工作区隔离配置计划

## 当前状态和结果

- 状态：已结束
- 结果：已完成

## 关联需求

- 无。本计划属于 Windows 本地开发工具稳定性配置，不改变产品能力。

## 背景

VS Code Ruff 扩展默认从 Backend 虚拟环境加载 `ruff.exe`。Windows 会阻止 uv 在该进程运行期间替换同一文件，导致依赖同步失败。

## 目标

- 让 VS Code Ruff 扩展使用扩展内置的 Ruff。
- 避免编辑器长期占用 `apps/backend/.venv/Scripts/ruff.exe`。
- 保持项目命令和 CI 继续使用 `uv.lock` 锁定的 Ruff 版本。

## 非目标

- 不修改 Backend 依赖声明或锁定版本。
- 不改变 Ruff 规则、质量门禁或 CI 工作流。

## 现状分析

- 仓库当前没有 `.vscode/settings.json`。
- Ruff 扩展默认 `ruff.importStrategy` 为 `fromEnvironment`。
- 已确认运行中的 Ruff Server 来自 Backend 虚拟环境，并阻止 `uv sync --locked` 替换文件。

## 方案设计

在工作区设置中配置 `"ruff.importStrategy": "useBundled"`。编辑器诊断使用扩展内置 Ruff，命令行检查继续通过 uv 执行项目锁定版本。

## 全栈影响矩阵

| 范围 | 是否涉及 | 工作内容 | 前置依赖 | 验证 |
| --- | --- | --- | --- | --- |
| Backend | 涉及 | 隔离编辑器 Ruff 与 Backend 虚拟环境 Ruff | VS Code Ruff 扩展 | JSON 解析和工作区门禁 |
| Admin | 不涉及 | 无 | 无 | 无 |
| Web | 不涉及 | 无 | 无 | 无 |
| API Client | 不涉及 | 无 | 无 | 无 |
| Database | 不涉及 | 无 | 无 | 无 |
| Deployment | 不涉及 | 无 | 无 | 无 |
| Documentation | 涉及 | 补充 VS Code Ruff 与 uv 的使用边界 | 工作区配置 | Markdown 检查 |

## 实施顺序

1. 新增 VS Code 工作区设置。
2. 更新 uv 使用指南、项目索引和 Changelog。
3. 验证 JSON、Markdown 和工作区治理门禁。

## 影响文件

- `.vscode/settings.json`（由 `.gitignore` 忽略，仅本机生效）
- `docs/operations/uv使用指南.md`
- `plans/2026-08-24_VSCodeRuff工作区隔离配置计划.md`
- `PROJECT_INDEX.md`

## 风险与回滚

- 风险：扩展内置 Ruff 与项目锁定版本可能不同，编辑器提示和 CI 结果可能存在差异。
- 控制：项目验收始终以 `uv run --locked ruff check .` 和 CI 为准。
- 回滚：删除工作区设置中的 `ruff.importStrategy` 后重新加载 VS Code 窗口。

## 验证清单

- [x] `.vscode/settings.json` 可被 JSON 解析。
- [x] `pnpm lint:md` 通过。
- [x] `pnpm check:workspace` 通过。
- [x] `pnpm check:boundaries` 通过。

## 待确认问题

- 无。

## 用户确认记录

- 2026-08-24：用户明确要求在 VS Code 工作区加入 `"ruff.importStrategy": "useBundled"` 并设置完成。

## 实施结果

- 已新增由 Git 忽略的本机 VS Code 工作区设置，Ruff 扩展改用扩展内置版本。
- 已在 uv 使用指南中明确编辑器诊断与项目锁定 Ruff 的职责边界和重载步骤。
- JSON 解析、Markdown、工作区状态和模块边界检查全部通过。

## 剩余问题

- 无。
