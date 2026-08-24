# GitSync 自动 PR 合并与 Actions 去重计划

## 当前状态和结果

- 状态：实施中
- 结果：待完成。

## 关联需求

- `BASE-OPS-007`：保持 CI、镜像发布和生产部署的授权与职责分离。
- `BASE-OPS-008`：Pull Request 必需检查失败时必须阻断合并。
- `BASE-SEC-005`：保留 Ruleset、依赖审查、秘密扫描和静态分析门禁。
- `BASE-DOC-004`：通过本计划记录范围、授权、实施和验证证据。

## 背景

`Protect main` Ruleset 已禁止日常直接推送，并要求 Pull Request、会话解决和 13 项状态检查。该安全边界有效，但当前 `$git-sync` 只负责暂存、提交和推送，后续创建 PR、等待检查、rebase 合并、删除分支和同步本地 `main` 仍需多次手工操作。

四个自动工作流当前同时监听所有分支的 push 和 Pull Request。功能分支推送后先运行一次完整检查，创建 PR 后又对同一变更运行一次，产生重复 Runner 消耗。合并后的 `main` push 仍必须保留，用于形成镜像发布要求的精确 Commit SHA 检查记录。

## 目标

1. 保留 `Protect main` Ruleset 及 13 项必需检查，不增加 bypass。
2. 启用 GitHub Auto-merge 和合并后自动删除分支。
3. 四个自动工作流只在目标为 `main` 的 Pull Request、push 到 `main` 时运行，Security 继续每周定时运行。
4. 用户显式调用 `$git-sync` 时，一次完成安全暂存、提交、推送、创建或更新 PR、rebase 自动合并、等待检查、删除分支和同步本地 `main`。
5. 任一必需检查失败或缺失时停止合并，保留 PR 和分支并报告失败检查。

## 非目标

- 不降低、删除或绕过 Ruleset、必需检查和安全扫描。
- 不自动创建或推送 Tag，不发布 Release 或 GHCR 镜像，不触发工作流，不部署或回滚生产。
- 不让普通“提交”或“推送”请求自动扩展为创建 PR 或合并。
- 不修改 Backend、Admin、Web、API Client、数据库或产品功能。

## 现状分析

- `Protect main` Ruleset ID 为 `21152538`，`bypass_actors=[]`，要求 Pull Request、解决评审会话和 13 项必需检查。
- 仓库允许 rebase merge，但 `allow_auto_merge=false`、`delete_branch_on_merge=false`。
- `ci-governance.yml`、`ci-backend.yml`、`ci-frontend.yml`、`security.yml` 的 `pull_request` 和 `push` 都没有分支过滤。
- `$git-sync` 当前只执行精确暂存、中文 Conventional Commit 和分支推送。
- Publish Images 要求同一 `main` Commit SHA 的四个成功 Push Run，因此合并后的 `main` push 检查不能取消。

## 方案设计

### 1. Actions 触发去重

四个自动工作流统一配置：

```yaml
on:
  pull_request:
    branches:
      - main
  push:
    branches:
      - main
```

`security.yml` 额外保留现有每周定时任务。功能分支 push 只上传提交，不运行整套自动检查；PR 创建或更新后运行合并门禁；合并到 `main` 后再次运行四个 Push 工作流，为发布阶段留下不可变 SHA 证据。

### 2. 远端仓库设置

通过 GitHub REST API 启用 `allow_auto_merge=true` 和 `delete_branch_on_merge=true`，保留 `allow_rebase_merge=true`。修改后重新读取设置和 Ruleset，确认未改变保护规则。

### 3. `$git-sync` 完整闭环

显式调用 Skill 时按以下顺序执行：

1. 检查分支、差异、上游和远端状态，保护任务范围外修改。
2. 在 `main` 时基于最新 `origin/main` 创建 `codex/*` 功能分支；已有功能分支时继续使用。
3. 运行当前计划要求的验证，只精确暂存本次任务文件并创建中文 Conventional Commit。
4. 推送功能分支，创建或更新目标为 `main` 的 Pull Request。
5. 设置 rebase Auto-merge，并由 GitHub 在 Ruleset 和必需检查满足后合并及删除远端分支。
6. 轮询检查与 PR 状态。检查失败、取消、缺失或 PR 无法合并时停止并报告。
7. 合并成功后切回 `main`，以 fast-forward 方式同步 `origin/main`，删除已合并的本地功能分支并复核本地远端一致性。

### 4. 授权边界

只有用户显式调用 `$git-sync` 才将上述完整闭环视为一次授权。普通“提交”“推送”“创建 PR”或“合并”仍按文字范围执行。Tag、Release、GHCR、`workflow_dispatch`、部署、生产变更和 Ruleset 调整继续单独授权。

## 全栈影响矩阵

| 范围 | 是否涉及 | 工作内容 | 前置依赖 | 验证 |
| --- | --- | --- | --- | --- |
| Backend | 不涉及 | 不修改 Python 实现、依赖或契约 | 无 | 确认 Backend 文件无差异 |
| Admin | 不涉及 | 不修改管理端实现和依赖 | 无 | 确认 Admin 文件无差异 |
| Web | 不涉及 | 不修改 Web 实现和依赖 | 无 | 确认 Web 文件无差异 |
| API Client | 不涉及 | 不修改 OpenAPI 和生成客户端 | 无 | 确认生成文件无差异 |
| Database | 不涉及 | 不修改模型、迁移和数据 | 无 | 不执行数据库操作 |
| Deployment | 涉及 | 调整 Actions 触发条件和 GitHub 合并设置 | Ruleset 保持 active | YAML、远端设置、PR 线上检查 |
| Documentation | 涉及 | 更新规则、Skill、运维文档、索引和 Changelog | 用户已确认完整授权语义 | Markdown、文本卫生和治理门禁 |

## 实施顺序

1. 创建并登记本计划，确认工作分支和工作区范围。
2. 修改四个自动工作流的分支过滤。
3. 更新根规则、AI 工作流指南和 GitHub Actions 运维文档。
4. 扩展个人 `$git-sync` Skill，并运行 Skill 结构校验。
5. 启用远端 Auto-merge 和自动删除分支，复核 Ruleset 未漂移。
6. 运行 Markdown、工作区、边界、治理、文本和 YAML 验证。
7. 回写计划、索引和 Changelog。
8. 使用升级后的 `$git-sync` 完成本次 PR、rebase 自动合并、删分支和本地 `main` 同步。

## 影响文件

- `.github/workflows/ci-governance.yml`
- `.github/workflows/ci-backend.yml`
- `.github/workflows/ci-frontend.yml`
- `.github/workflows/security.yml`
- `AGENTS.md`
- `docs/operations/ai-assisted-development-workflow.md`
- `docs/operations/github-actions-workflows.md`
- `.agents/agents-index.md`
- `CHANGELOG.md`
- `plans/2026-08-24_GitSync自动PR合并与Actions去重计划.md`
- `C:/Users/soman/.codex/skills/git-sync/SKILL.md`

## 风险与回滚

- 分支过滤配置错误可能让 PR 或 `main` 缺少检查。通过 YAML 解析、触发条件复读和本次真实 PR 验证；失败时回退四个 workflow 的触发块。
- Auto-merge 依赖仓库设置和 Ruleset 状态。设置失败时保留 PR，不手工绕过；可回滚 `allow_auto_merge` 和 `delete_branch_on_merge`。
- Skill 授权描述过宽可能误触发远端操作。通过精确触发词、显式非目标和失败关闭规则限制；普通请求继续按动作授权。
- 合并后本地存在任务外修改时，切换分支可能失败。Skill 必须停止并保留现场，禁止 stash、reset 或覆盖用户修改。
- 所有仓库文件以本计划开始前 Git 快照为回滚边界，不改写历史。个人 Skill 修改前保留可审阅差异，必要时按原内容恢复。

## 验证清单

- [x] 四个 workflow 只监听目标为 `main` 的 PR 和 push 到 `main`；Security 保留定时任务。
- [x] YAML 可解析，工作流名称和 13 项 required check context 不变。
- [x] 仓库设置为 `allow_auto_merge=true`、`allow_rebase_merge=true`、`delete_branch_on_merge=true`。
- [x] Ruleset `21152538` 保持 active、无 bypass、PR 规则和 13 项必需检查不变。
- [x] `$git-sync` Skill 结构校验通过，触发、失败关闭和排除授权明确。
- [x] `pnpm lint:md` 通过。
- [x] `pnpm check:workspace`、`pnpm check:boundaries`、`pnpm check:governance` 通过。
- [x] 文本卫生、`git diff --check` 和提交范围复核通过。
- [ ] 本次 PR 的必需检查通过后以 rebase 方式自动合并。
- [ ] 远端功能分支删除，本地 `main` 与 `origin/main` 一致。

## 待确认问题

- 无。用户已明确确认保留 Ruleset，并实施完整交付自动化。

## 用户确认记录

- 2026-08-24：用户确认保留 Ruleset，同时自动化分支、提交、推送、PR、检查等待、rebase 合并、分支清理和本地同步流程。

## 实施结果

- 四个自动工作流已增加 `main` 分支过滤。功能分支 push 不运行整套检查，目标为 `main` 的 PR 运行合并门禁，合并后的 `main` push 继续生成镜像发布证据；Security 的每周定时任务保持不变。
- GitHub 仓库已启用 Auto-merge 和合并后自动删除分支，rebase merge 保持开启。远端 API 复读确认三个设置均为 `true`。
- `Protect main` Ruleset `21152538` 复读确认仍为 active、`bypass_actors=[]`，删除保护、非快进保护、PR 规则和 13 项 required status checks 均未漂移。
- 根规则和两份运维文档已明确 `$git-sync` 完整授权语义、普通 Git 请求边界、失败关闭和发布生产排除项。
- 个人 `$git-sync` Skill 已扩展为完整交付闭环，并通过 skill-creator `quick_validate.py` 校验。
- PyYAML 精确触发结构校验、`pnpm lint:md`、`pnpm check:workspace`、`pnpm check:boundaries`、`pnpm check:governance`、项目文本检查和 `git diff --check` 均通过。
- `project-hygiene` 文本卫生扫描为 0 errors；仅报告任务范围外 `.env.example` 的既有公开模板值启发式 warning，本次未修改该文件，仓库正式文本门禁已通过。
- 正在通过本次 Pull Request 验证自动合并与分支清理闭环。

## 剩余问题

- 等待本次 Pull Request 的 13 项必需检查、rebase 自动合并、分支清理和本地 `main` 同步完成。
