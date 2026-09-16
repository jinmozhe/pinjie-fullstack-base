# Full Validation 分层验证计划

## 1. 当前状态和结果

- 状态：实施中
- 结果：不适用

## 2. 关联需求

- `BASE-OPS-003`、`BASE-OPS-007`、`BASE-OPS-008`：保留轻量自动门禁，将手动重型验证范围与发布授权分开，跳过项如实记录。
- `BASE-QUAL-001`、`BASE-QUAL-002`：smoke 不冒充完整验收，full 保留现有验证强度。
- 不改变产品范围和验收基线，无需修改 PRD。

## 3. 背景

普通修改需要生产构建和关键跨栈反馈时，现有工作流会同时执行全部前端 Vitest。增加手动 smoke 选择，避免每次都承担全量前端单元测试成本。

## 4. 目标

- `CI - Full Validation` 增加默认 full、可显式选择 smoke 的验证范围。
- smoke 跳过 Admin/Web Vitest 和 coverage，保留 Backend pytest、生产构建、四项目入口页面质量和桌面 Stage C。
- full 与 smoke 分离证据，strict 只接受 full；fast 不主动核验 smoke。
- 完成轻量验证、文档同步、本地提交和功能分支推送。

## 5. 非目标

- 不调整 Admin worker、覆盖率阈值、业务断言、公开 API、数据库结构或依赖。
- 不修改 Handoff 的 strict/fast 规则、候选镜像工作流、CNB 构建或生产部署。
- 不执行 Vitest、pytest、production build、Playwright、浏览器自动化或测试数据库迁移。
- 不触发 workflow_dispatch、镜像发布、部署、Tag、Release、PR 创建或合并。

## 6. 现状分析

- 母版 full 使用真实 PostgreSQL/Redis，三端验证后运行生产产物 E2E，生成 v2 证据。
- strict 核对 Artifact 名称、来源、SHA 和清单字段；fast 要求理由但不要求重型验证证据。
- 初始工作区干净，已 fetch 并确认起始 main 与 origin/main 一致；SECURITY.md 禁止直推 main，因此使用 `codex/full-validation-smoke`。
- 根 check:guards 包含证据和交接门禁；CI Governance 未执行全部根 Guard，需要显式接入本次验证范围和证据检查。

## 7. 方案设计

工作流校验 full/smoke 输入，通过 source 输出传递；full 执行全量前端测试，smoke 记录跳过事实，两种模式都构建生产产物。E2E_PROFILE 默认 full，非法值失败；smoke 仅跳过移动端 Stage C，入口页面基线不缩减。

full 保留 `pinjie-full-validation-v2` 与 `full-validation-<SHA>`；smoke 使用 `pinjie-smoke-validation-v1` 与 `smoke-validation-<SHA>`，记录前端测试跳过、浏览器范围和 Run。证据仅在必需步骤成功后生成。

| 规则来源 | 适用约束 | 落实位置 | 验证方式 |
| --- | --- | --- | --- |
| 根 AGENTS.md、开发流程第 17 节 | 只运行授权的轻量门禁，保留既有功能 | 工作流、E2E、交付记录 | 差异审查、治理命令 |
| testing-strategy.md、发布手册 | full 强度、同 SHA 证据和独立交接 | ci-e2e.yml、证据 Guard | 模式夹具、strict 拒绝 smoke 反例 |
| SECURITY.md、CODEOWNERS | 受保护主分支及工作流评审边界 | 功能分支、代码差异 | 自查；合入前由 Code Owner 评审 |
| plans/README.md | 永久计划、索引和完成事实一致 | 当前计划、两个索引 | check:documents、lint:md |

## 8. 全栈影响矩阵

| 范围 | 是否涉及 | 工作内容 | 前置依赖 | 验证 |
| --- | --- | --- | --- | --- |
| Backend | 不涉及实现 | 两模式继续运行既有 pytest | 现有工作流 | Guard 核对任务保留 |
| Admin | 涉及验证编排 | smoke 跳过 Vitest 和移动端 Stage C | 现有测试与构建 | 模式 Guard、lint、typecheck |
| Web | 涉及验证编排 | smoke 跳过 Vitest 和移动端 Stage C | 现有测试与构建 | 模式 Guard、lint、typecheck |
| API Client | 不涉及 | 不改变契约和生成输出 | 无 | 不适用 |
| Database | 不涉及结构 | 保留隔离数据库验证配置 | 既有 PostgreSQL/Redis | 不执行迁移 |
| Deployment | 涉及证据说明 | 分清 smoke/fast 与 full/strict | 既有发布机制 | 证据和交接 Guard |
| Documentation | 涉及 | 测试策略、工作流、发布手册、计划和 Changelog | 已确认方案 | Markdown、文档治理 |

## 9. 实施顺序

1. 登记计划及索引。
2. 补齐工作流模式、E2E profile、独立证据。
3. 增加模式和证据反例 Guard，接入本地及 CI。
4. 同步现有权威文档。
5. 运行轻量检查，复读差异并完成提交、功能分支推送。

## 10. 影响文件

- `.github/workflows/ci-e2e.yml`、`.github/workflows/ci-governance.yml`、`package.json`。
- `playwright.config.ts`、`e2e/stage-c.spec.ts`。
- `scripts/ci/test-full-validation-mode.mjs`、`scripts/ci/test-full-validation-evidence.ps1`。
- `docs/architecture/testing-strategy.md`、`docs/operations/github-actions-workflows.md`、`docs/operations/github-cnb-tcr-1panel-release-runbook.md`。
- 本计划、`plans/INDEX.md`、`PROJECT_INDEX.md`、`CHANGELOG.md`。

## 11. 风险与回滚

- 风险：smoke 被误认为完整证据、跳过范围扩大、条件步骤失败后误产出证据。使用独立 schema、保留 strict 校验并增加反例 Guard。
- 风险：尚无真实 full/smoke Run 证明稳定性和节省时间；本轮只交付配置和轻量核验。
- 回滚：通过新的普通提交恢复本次工作流及 E2E 配置，恢复 full 单一模式；计划原文永久保留。不涉及生产数据回滚。

## 12. 验证清单

- [x] 模式与证据 Guard、既有交接 Guard。
- [x] pnpm check:governance，包含文本、Markdown、文档、工作区、依赖、边界、生产配置、契约例外及全部治理夹具。
- [x] Admin/Web lint 与 typecheck。
- [x] Backend Ruff、格式、Mypy、导入边界、源码编译、应用导入和 OpenAPI 导出；59 个路径，根契约与 API Client 无差异。
- [x] 差异、文本、秘密和提交范围核对；辅助文本卫生检查 0 错误、0 警告。
- [ ] 本地提交、推送及远端 SHA 核对。
- 未执行：Vitest、pytest、生产构建、E2E、测试数据库迁移、真实 GitHub full/smoke 和发布部署。

## 13. 待确认问题

- 无。

## 14. 用户确认记录

- 2026-09-16：用户确认此前讨论的分层验证方案，要求开始实现并完成后直接提交推送；未授权 PR 创建、合并和发布部署，也未点名重型验证。

## 15. 实施结果

- 已实现 full/smoke 选择、模式传递、前端测试条件执行、四项目入口页面基线和桌面 Stage C 范围。
- full v2 与 smoke v1 证据独立生成和上传，仅允许成功步骤产出。既有 strict/fast 消费规则保持不变。
- 新增 Guard 解析实际工作流、执行输入校验与证据写入，并在隔离夹具中核验 E2E 配置和旅程是否进入页面导航；没有运行 Playwright 或业务测试。
- 已验证非法输入拒绝、默认/full/smoke 范围、实际 smoke 清单被 strict 拒绝、伪装文件名和字段被拒绝；Guard 已接入根命令及 CI Governance。
- 测试策略、工作流、发布手册和 Changelog 已同步四条操作链路，明确 smoke 后仍需人工选择 fast，fast 不主动核验 smoke。
- 首轮文档治理发现活动计划登记格式不符合既有表格约束，已修正并通过完整复验。
- Guard 临时夹具自行清理，未启动应用服务或浏览器。自动审批策略拒绝验证缓存清理命令，本次新建的 Backend Mypy、Ruff 缓存及一个字节码文件保留在忽略目录，不进入提交；原有缓存保留。

## 16. 剩余问题

- 轻量验证完成，Git 提交和功能分支推送正在收尾。
- 真实 full/smoke 运行、耗时和跨栈效果未验证，不作为本轮完成前提；合入 main 后需另行人工触发。
