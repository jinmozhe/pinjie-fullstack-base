# Dependabot 自动分支停用与 Git 分支收敛计划

## 当前状态和结果

- 状态：已结束
- 结果：已完成

## 关联需求

- 无。本计划响应用户对仓库依赖更新方式和 Git 分支治理的明确调整，不改变产品能力范围。

## 背景

仓库当前通过 `.github/dependabot.yml` 每周检查 npm、Python 和 GitHub Actions 依赖，并按依赖类型自动创建升级分支和 Pull Request。用户要求停用这项自动建分支能力，删除 GitHub 上除 `main` 外的所有分支，并让本地 `main` 正确跟踪 `origin/main`。

GitHub 当前实际存在 `main` 和 3 条 Dependabot 分支，对应开放的 Pull Request #2、#5、#6。本地还保留 3 条已从 GitHub 删除的远程跟踪引用，对应已关闭的 Pull Request #1、#3、#4。GitHub 仓库级自动安全修复当前为关闭状态，不会在删除 Dependabot 配置后继续自动创建安全升级分支。

## 目标

1. 删除 `.github/dependabot.yml`，停止定期依赖更新分支和 Pull Request 的自动创建。
2. 关闭 Pull Request #2、#5、#6，并删除其 GitHub 远程分支。
3. 清理本地已经失效的 `origin/dependabot/*` 远程跟踪引用。
4. 保留且只保留 `main` 作为本地分支和 GitHub 远程分支。
5. 配置本地 `main` 跟踪 `origin/main`，使 `git status` 显示领先或落后状态。
6. 同步当前项目文档、项目索引、计划记录和变更日志。

## 非目标

- 不删除或重建 `main`。
- 不合并任何 Dependabot Pull Request。
- 不关闭 Dependency Review、依赖漏洞扫描、CodeQL、Gitleaks 或现有 CI 工作流。
- 不关闭 GitHub 漏洞告警。
- 不调整应用依赖版本、锁文件或业务源码。

## 现状分析

- 本地只有 `main` 一个分支和一个工作树，工作区干净。
- 本地 `main` 与 `origin/main` 均指向提交 `8b1b515`，但未配置上游关系。
- GitHub 默认分支为 `main`。
- GitHub 线上存在 3 条 Dependabot 分支，对应开放的 Pull Request #2、#5、#6，检查状态均为 `UNSTABLE`。
- 本地另有 3 条失效的 `origin/dependabot/*` 引用，GitHub 线上对应分支已经删除。
- `.github/dependabot.yml` 是仓库中唯一检出的自动创建依赖升级分支入口。
- GitHub `automated-security-fixes` 状态为 `enabled: false`。

## 方案设计

1. 删除仓库中的 `.github/dependabot.yml`，并通过 `main` 提交推送到 GitHub，使线上停止后续定期 Dependabot 分支创建。
2. 保留现有安全扫描和依赖审查工作流，依赖升级改为人工发起、评审和验证。
3. 在配置删除推送成功后，关闭 3 个开放的 Dependabot Pull Request，并删除其远程分支。
4. 使用带 `prune` 的远程刷新清理本地失效远程跟踪引用。
5. 为本地 `main` 设置 `origin/main` 上游关系。
6. 最终同时核对 GitHub 实际分支、本地分支、开放 Pull Request、上游关系和工作区状态。

## 全栈影响矩阵

| 范围 | 是否涉及 | 工作内容 | 前置依赖 | 验证 |
| --- | --- | --- | --- | --- |
| Backend | 不涉及 | 不修改后端源码、依赖或锁文件 | 无 | 边界检查 |
| Admin | 不涉及 | 不修改 Admin 源码、依赖或锁文件 | 无 | 边界检查 |
| Web | 不涉及 | 不修改 Web 源码、依赖或锁文件 | 无 | 边界检查 |
| API Client | 不涉及 | 不修改 OpenAPI 和生成客户端 | 无 | Git 差异检查 |
| Database | 不涉及 | 不修改模型或迁移 | 无 | Git 差异检查 |
| Deployment | 涉及 | 停用 Dependabot 定期依赖分支自动化，不改部署工作流 | 用户确认计划 | 工作区治理检查、GitHub 远程核验 |
| Documentation | 涉及 | 同步项目结构、计划、索引和变更日志 | 配置变更事实 | Markdown 检查、文档复读 |

## 实施顺序

1. 用户确认本计划后，将计划状态更新为“实施中”并记录确认。
2. 删除 `.github/dependabot.yml`。
3. 更新 `docs/architecture/project-structure.md`、`CHANGELOG.md`、本计划和 `PROJECT_INDEX.md`。
4. 运行 Markdown、工作区治理和模块边界检查，复读差异。
5. 暂存并提交本次配置与文档变更，将 `main` 推送到 GitHub。
6. 关闭 Pull Request #2、#5、#6，并删除对应远程分支。
7. 运行 `git fetch --prune origin`，清理本地失效的远程跟踪引用。
8. 将本地 `main` 的上游设置为 `origin/main`。
9. 核验 GitHub 只剩 `main`、没有开放 Dependabot Pull Request、本地只剩 `main`、工作区干净且与远程同步。
10. 回写计划实施结果、验证结果、剩余问题和项目索引状态。

## 影响文件

- 删除：`.github/dependabot.yml`
- 修改：`docs/architecture/project-structure.md`
- 修改：`CHANGELOG.md`
- 新增并持续更新：`plans/2026-08-15_Dependabot自动分支停用与Git分支收敛计划.md`
- 修改：`PROJECT_INDEX.md`

## 风险与回滚

- 风险：仓库将不再自动收到常规依赖升级 Pull Request，需要人工定期检查并升级依赖。
- 风险：关闭 Pull Request 并删除远程分支会移除当前升级候选入口；对应提交仍可从 GitHub Pull Request 历史和已记录提交 SHA 追溯。
- 风险：推送 `main` 和删除远程分支属于独立远端变更，必须逐项核验结果，任一步失败都停止后续删除并记录状态。
- 回滚：从 Git 历史恢复 `.github/dependabot.yml` 并推送后，可重新启用定期 Dependabot 更新。
- 回滚：需要恢复某条已删除分支时，可从对应 Pull Request 的提交 SHA 重新创建远程分支。
- 回滚：需要取消本地上游关系时，可使用 `git branch --unset-upstream main`。

## 验证清单

- [x] `pnpm lint:md` 通过。
- [x] `pnpm check:workspace` 通过。
- [x] `pnpm check:boundaries` 通过。
- [x] `.github/dependabot.yml` 已从本地和 GitHub `main` 删除。
- [x] GitHub `automated-security-fixes` 仍为关闭状态。
- [x] GitHub 开放 Dependabot Pull Request 数量为 0。
- [x] `git ls-remote --heads origin` 只返回 `refs/heads/main`。
- [x] `git branch --list` 只返回本地 `main`。
- [x] `git branch --remotes` 只返回 `origin/HEAD -> origin/main` 和 `origin/main`。
- [x] `git status --short --branch` 显示 `main...origin/main` 且无工作区修改。
- [x] 修改文件均为 UTF-8 无 BOM 并保留末尾换行。

## 待确认问题

- 无。用户确认本计划后即可按上述顺序实施。

## 用户确认记录

- 2026-08-15：用户明确回复“确认执行”，授权删除 Dependabot 配置、提交并推送 `main`、关闭相关 Pull Request、删除线上分支、清理本地远程引用并配置上游关系。

## 实施结果

- 已删除本地 `.github/dependabot.yml`，并同步项目结构、变更日志、计划和项目索引。
- `pnpm lint:md`、`pnpm check:workspace`、`pnpm check:boundaries` 和文本卫生检查已执行；前三项通过，文本卫生检查仅报告公开 `.env.example` 占位密码的既有人工复核警告，已确认不是真实凭据。
- 已将配置删除提交推送到 GitHub `main`，线上 `main` 已不存在 `.github/dependabot.yml`。
- 已关闭 Pull Request #2、#5、#6，并删除对应的 3 条 Dependabot 远程分支。
- 已通过带 `prune` 的远程刷新清理本地 6 条失效 Dependabot 远程跟踪引用。
- 已配置本地 `main` 跟踪 `origin/main`。
- 最终核验确认 GitHub 和本地均只保留 `main`，GitHub 开放 Pull Request 为 0，仓库级自动安全修复保持关闭。

## 剩余问题

- 无。
