# 三端本地与 GitHub Actions 轻量验证规则计划

## 当前状态和结果

- 状态：已结束
- 结果：已完成

## 关联需求

- `BASE-OPS-003`：调整三端默认质量门禁，将自动门禁收敛为静态检查，全量测试保留为用户明确授权后的按需能力。
- `BASE-OPS-004`：跨栈契约变化继续执行契约导出、客户端生成和漂移检查，不以全量测试替代契约一致性。
- `BASE-OPS-007`：重新定义日常 CI 与独立发布的边界，Push 和 Pull Request 不自动执行重型验证。
- `BASE-OPS-008`：重新定义 Fail Closed 的关键自动检查范围，未执行全量测试必须如实记录，不能表述为全量通过。
- `BASE-QUAL-001`：人工验收、未执行和按需验证必须明确区分，禁止用人工检查记录伪造自动测试通过。

## 背景

当前项目已经把 Backend 全量 pytest、Admin 全量 Vitest 和条件式 Playwright 延后到显式 `$git-sync`。实际执行表明，Admin 的 jsdom 组件测试、覆盖率、production build 和跨栈 Playwright 仍会显著拉长日常交付时间，并可能受到 Windows 进程、旧构建产物和测试运行器状态影响。

用户明确选择以本地人工体验承担主要功能验收，希望日常开发、`$git-sync`、Push 和 Pull Request 只执行轻量检查。除非用户在当前任务中明确点名，否则本地和 GitHub Actions 均不得自动运行 Admin/Web build、前端全量 Vitest、Playwright 或 Backend pytest。

这项选择会降低自动回归覆盖，并改变 `docs/PROJECT_REQUIREMENTS.md` 中既有质量验收边界，因此必须同步产品需求基线、项目规则、测试策略、GitHub Actions 和运维文档，不能只修改单个命令说明。

## 目标

1. Admin 日常开发、`$git-sync`、Push 和 Pull Request 默认只运行 `typecheck` 与 `lint`。
2. Web 日常开发、`$git-sync`、Push 和 Pull Request 默认只运行 `typecheck` 与 `lint`。
3. Backend 日常开发、`$git-sync`、Push 和 Pull Request 保留 Ruff、格式、Mypy、导入边界、编译和应用导入等轻量检查，不自动运行任何 pytest。
4. Admin/Web production build、Admin/Web 全量 Vitest、Backend pytest 和 Playwright 只在用户对当前任务明确授权对应命令时执行。
5. GitHub Actions 的 Push 和 Pull Request 工作流删除上述重型验证，不增加定时全量测试或隐式异步补跑。
6. 保留现有测试和构建脚本，供用户空闲时、本地人工检查或明确授权的专项验证使用。
7. 保留安全扫描、依赖审计、模块边界、文本卫生、工作区完整性、OpenAPI Breaking Change 和生成契约漂移等非重型治理检查。
8. 通用 `git-sync` Skill 保持项目中立，只读取本仓库规则决定验证范围。

## 非目标

1. 不删除、弱化或重写现有测试用例、Playwright 脚本、构建脚本和覆盖率配置。
2. 不在本计划实施期间运行 Admin/Web build、前端全量 Vitest、Backend pytest 或 Playwright。
3. 不把人工页面体验记录成自动测试、全量测试或跨栈 E2E 通过。
4. 不关闭 GitHub Actions、Ruleset、秘密扫描、依赖安全、SAST、模块边界或契约破坏检查。
5. 不修改个人 `git-sync` Skill。
6. 不改变 Tag、Release、GHCR、部署和生产操作的独立授权边界。
7. 不禁止显式发布流程为生成镜像而执行必要的制品构建；发布仍需用户单独授权，构建结果不能代替测试结果。

## 现状分析

1. 根 `AGENTS.md` 当前要求 `$git-sync` 在 Backend 受影响时运行全量 pytest，在 Admin 受影响时运行全量测试，并按页面影响决定 Playwright。
2. `apps/admin/AGENTS.md` 当前把全量 Vitest 和条件式 Playwright 作为 `$git-sync` 门禁，并把 production build 列为常规验证命令。
3. `apps/web/AGENTS.md` 当前要求 build、相关测试和 UI 浏览器验证，没有开发、GitSync 与显式人工验证的清晰分层。
4. `apps/backend/AGENTS.md` 当前把全量 pytest、真实 PostgreSQL/Redis 和 Alembic 验证列为 `$git-sync` 完成门禁。
5. `.github/workflows/ci-frontend.yml` 的 `Web quality` 和 `Admin quality` 会在 Pull Request 与 `main` Push 时运行 lint、typecheck、全量测试和 production build。
6. `.github/workflows/ci-backend.yml` 会启动 PostgreSQL 与 Redis，并执行数据库升级、Alembic 漂移检查和带覆盖率的全量 pytest。
7. `.github/workflows/ci-e2e.yml` 已经只有 `workflow_dispatch`，不会由 Push 或 Pull Request 自动触发；后续继续保持人工显式触发。
8. 当前 Ruleset 依赖既有检查名称。保留 `Backend quality`、`Web quality` 和 `Admin quality` Job 名称，只调整 Job 内命令，可以避免无必要的远端 Ruleset 修改。
9. `BASE-OPS-003/007/008` 与当前测试策略仍把完整测试作为默认质量门禁，本计划实施时必须同步调整验收文字。

## 方案设计

### 授权模型

1. “自动执行”包括 AI 日常开发、`$git-sync`、本地提交前流程、GitHub Push、Pull Request、定时工作流和其他隐式触发。
2. 用户必须在当前任务中明确点名要运行的重型命令或验证类型，授权只对该次任务和该项验证生效，不延续到后续任务。
3. 普通“提交”“推送”或 `$git-sync` 不包含 Admin/Web build、Vitest、pytest 或 Playwright 的隐式授权。
4. 用户自行在本机人工运行和体验不受 AI 规则限制；只有可核验结果才写入计划，未提供证据时记录为“用户自行验收，自动验证未执行”。

### 本地与 GitSync 默认门禁

1. Admin 只运行：
   - `pnpm --filter @pinjie/admin typecheck`
   - `pnpm --filter @pinjie/admin lint`
2. Web 只运行：
   - `pnpm --filter @pinjie/web typecheck`
   - `pnpm --filter @pinjie/web lint`
3. Backend 默认运行不需要测试数据库的轻量检查：
   - `uv run ruff check .`
   - `uv run ruff format --check .`
   - `uv run mypy app`
   - `uv run lint-imports`
   - `uv run python -m compileall -q app alembic scripts`
   - 应用导入和 OpenAPI 生成可用性检查
4. 公开 API 变化继续导出根 `openapi.json`、运行 `pnpm generate-api` 并检查生成文件无漂移。
5. 文档、治理、依赖、配置或边界变化继续运行对应轻量门禁；这些检查不能隐式启动被禁止的重型验证。
6. Git 安全交付继续执行差异复读、精确暂存、秘密与临时产物检查、`git diff --cached --check` 及远端必需检查等待。

### GitHub Actions 调整

1. `.github/workflows/ci-frontend.yml` 保留 `Web quality` 和 `Admin quality` Job 名称及依赖安装，只执行各自 lint 与 typecheck。
2. API Client 生成漂移检查收敛到一个明确 Job 或 Backend 契约 Job，避免 Admin、Web 重复生成。
3. `.github/workflows/ci-backend.yml` 删除 PostgreSQL、Redis 服务、数据库升级和 pytest 步骤；只保留配置校验占位 URL、轻量静态检查、应用导入、OpenAPI 导出、API Client 生成漂移与 Breaking Change 检查。
4. `.github/workflows/ci-e2e.yml` 继续只允许 `workflow_dispatch`，不加入 Push、Pull Request、定时任务或其他工作流自动调用。
5. 不新增自动全量测试 Workflow。以后需要线上全量验证时，由用户明确授权后人工触发现有 E2E，或通过独立计划增加仅支持 `workflow_dispatch` 的专项 Workflow。
6. 保持 Ruleset 使用的检查名称，实施后通过 GitHub 查询核对 required checks，无需修改 Ruleset 时不产生远端配置变更。

### 构建与发布边界

1. 日常本地开发、`$git-sync`、Push 和 Pull Request 禁止自动执行 Admin/Web production build。
2. 用户明确调用镜像发布或部署流程时，Docker 构建为产出制品的必要步骤，继续由发布或部署的独立授权覆盖。
3. 发布流程中的构建只证明制品能够生成，不表示 Vitest、pytest、Playwright 或人工验收通过。
4. 用户明确要求单独验证 build 时，只运行被点名的应用和命令，并记录实际结果。

### 结果表达

1. 默认交付可以表述为“轻量静态门禁通过并已提交”，不能表述为“全量测试通过”或“完整跨栈验收完成”。
2. 被规则禁止且未获授权的测试记录为“按项目策略未执行”，不记录为待 `$git-sync` 执行。
3. 用户明确授权后执行失败的重型验证必须如实报告，但是否阻止后续提交由该次用户授权和当前计划决定；禁止隐藏失败结果。
4. GitHub Actions Summary 和项目计划继续区分通过、失败、未执行、不适用和人工验收。

## 全栈影响矩阵

| 范围 | 是否涉及 | 工作内容 | 前置依赖 | 验证 |
| --- | --- | --- | --- | --- |
| Backend | 涉及 | 移除本地、GitSync 和 CI 的自动 pytest，收敛为静态、导入与契约检查 | Backend 现有轻量命令 | Ruff、格式、Mypy、导入边界、编译、应用导入 |
| Admin | 涉及 | 默认只保留 typecheck 与 lint，禁止自动 build、Vitest 和 Playwright | 现有 pnpm 脚本 | typecheck、lint |
| Web | 涉及 | 默认只保留 typecheck 与 lint，禁止自动 build、Vitest 和 Playwright | 现有 pnpm 脚本 | typecheck、lint |
| API Client | 涉及 | 保留契约生成和漂移检查，消除前端 CI 重复执行 | 根 OpenAPI 和生成脚本 | `pnpm generate-api`、Git 差异检查 |
| Database | 不涉及 | 不修改模型、迁移和数据；数据库验证改为明确授权后执行 | 无 | 不启动测试数据库，不运行迁移验证 |
| Deployment | 涉及 | 调整 Backend、Frontend CI；E2E 保持纯人工触发，发布构建保持独立授权 | 现有 Workflow 和 Ruleset 检查名 | Workflow 语法、Actions 触发器和 Job 命令审查 |
| Documentation | 涉及 | 同步 PRD、四级规则、测试策略、Actions 运维说明、AI 工作流、计划、索引和 Changelog | 用户确认 | Markdown、文本卫生、工作区与边界检查 |

## 实施顺序

1. 更新 `docs/PROJECT_REQUIREMENTS.md` 中 `BASE-OPS-003/007/008` 及相关完成验收文字，明确自动轻量门禁和显式全量验证边界。
2. 更新 `docs/architecture/testing-strategy.md`，将默认验证模型改为“三端轻量静态检查，全量测试仅经用户明确授权”。
3. 更新根、Backend、Admin、Web 的 `AGENTS.md`，统一本地、`$git-sync`、Push、Pull Request 和人工验证规则。
4. 修改 Backend 与 Frontend GitHub Actions，移除自动 pytest、前端 Vitest 和前端 production build，保留轻量检查和契约门禁。
5. 复核 E2E Workflow 仅为 `workflow_dispatch`，不执行该 Workflow，不增加自动触发。
6. 更新 GitHub Actions 运维说明、AI 开发流程、相关活动计划、全项目索引和 Changelog。
7. 只运行文档、静态、Workflow 语法、治理和差异检查；本计划禁止的重型验证保持未执行。

## 影响文件

- `plans/2026-08-26_三端本地与GitHubActions轻量验证规则计划.md`
- `plans/2026-08-26_开发迭代与GitSync分层验证规则计划.md`
- `plans/2026-08-25_Admin管理员资料编辑与安全操作整合计划.md`
- `PROJECT_INDEX.md`
- `AGENTS.md`
- `apps/backend/AGENTS.md`
- `apps/admin/AGENTS.md`
- `apps/web/AGENTS.md`
- `docs/PROJECT_REQUIREMENTS.md`
- `docs/architecture/testing-strategy.md`
- `docs/operations/github-actions-workflows.md`
- `docs/operations/ai-assisted-development-workflow.md`
- `.github/workflows/ci-backend.yml`
- `.github/workflows/ci-frontend.yml`
- `.github/workflows/ci-e2e.yml`
- `.github/pull_request_template.md`
- `CHANGELOG.md`

实施时按实际命中内容精确调整。E2E Workflow 若已满足纯人工触发要求，只复核并更新文档，不机械修改文件。

## 风险与回滚

- 风险：类型和 Lint 通过后仍可能存在业务逻辑、运行时、打包、数据库或跨栈回归。通过用户本地人工验收、按需测试和发布前独立授权承担该风险。
- 风险：长期不运行现有测试可能导致测试资产失效。测试脚本和用例继续保留；用户明确要求时执行，并将发现的问题纳入独立修复计划。
- 风险：移除 Backend 数据库和 pytest CI 后，事务、迁移和真实依赖问题可能进入 `main`。计划与交付记录必须明确自动验证范围，禁止宣称数据库或全量回归通过。
- 风险：移除前端 build 后，Umi、Next.js、Webpack 或生产配置错误可能在镜像发布时才暴露。显式镜像发布失败时停止发布，不得绕过构建错误。
- 风险：PRD 和现有冻结基线声明可能与新策略冲突。实施时同步修改当前性文档和索引，只保留可核验事实。
- 回滚：恢复三端规则、测试策略和两个 CI Workflow 的原有全量门禁；E2E Workflow 始终保留人工触发能力，无需恢复测试代码。

## 验证清单

- [x] 根、Backend、Admin、Web 规则对自动验证和显式授权的描述一致。
- [x] `docs/PROJECT_REQUIREMENTS.md` 与测试策略不再要求默认全量测试、前端 build 或 E2E 作为日常提交门禁。
- [x] Admin GitSync 和 CI 只运行 typecheck 与 lint。
- [x] Web GitSync 和 CI 只运行 typecheck 与 lint。
- [x] Backend GitSync 和 CI 不运行 pytest，不启动仅供测试使用的 PostgreSQL 或 Redis。
- [x] Push、Pull Request 和定时 Workflow 均不运行 Admin/Web build、Vitest、pytest 或 Playwright。
- [x] `ci-e2e.yml` 仅保留 `workflow_dispatch`，且本计划实施过程不触发。
- [x] 现有 build、Vitest、pytest 和 Playwright 命令仍可供用户明确授权后调用。
- [x] `Backend quality`、`Web quality` 和 `Admin quality` 检查名称保持稳定，Ruleset 无需修改或已明确记录阻断。
- [x] API Client 生成漂移和 OpenAPI Breaking Change 检查继续生效。
- [x] 安全、依赖、治理、模块边界和文本卫生门禁未被移除。
- [x] `pnpm lint:md`、`pnpm check:workspace`、`pnpm check:boundaries`、`pnpm check:text` 和 `git diff --check` 通过。
- [x] 未执行 Admin/Web build、前端全量 Vitest、Backend pytest 或 Playwright。
- [x] 最终差异、Workflow 触发器、Job 命令和文档状态已复读。

## 待确认问题

无。

## 用户确认记录

- 2026-08-26：用户要求创建计划，将 Admin 日常与线上验证收敛为 typecheck 和 lint，不在本地或 GitHub Actions 自动运行 Admin build、全量 Vitest 或 Playwright。
- 2026-08-26：用户要求同一规则覆盖 Web 和 Backend，Backend 禁止自动运行 pytest；大部分功能检测由用户本地人工完成，只有用户明确授权时才允许本地或线上执行全量测试。
- 2026-08-26：用户确认计划并授权直接实施。

## 实施结果

- 根、Backend、Admin、Web 四级规则已统一为默认轻量门禁，普通提交、`$git-sync`、Push 和 Pull Request 均不隐式授权重型验证。
- Backend 自动 CI 已移除 PostgreSQL、Redis、Alembic 数据库验证和 pytest；Frontend 自动 CI 已移除 Admin/Web 的 Vitest 与 production build。
- `Backend quality`、`Web quality` 和 `Admin quality` Job 名称保持不变，OpenAPI 导出、API Client 生成漂移和 Breaking Change 检查继续由 Backend CI 承担。
- Browser E2E 保持纯 `workflow_dispatch`，本次没有触发。测试、构建和 E2E 脚本均保留，只有用户在当前任务中明确授权后才执行。
- 产品需求、测试策略、工程标准、运维文档、AI 工作流、PR 模板、Changelog、相关计划和全项目索引已同步。
- Admin/Web typecheck 与 lint、Backend Ruff、格式、Mypy、导入边界、编译和应用导入均通过；OpenAPI 与 API Client 重新生成后哈希不变。
- Markdown、文本编码、工作区状态、模块边界、Workflow 禁止命令扫描和 `git diff --check` 均通过。

## 剩余问题

- 无实施阻断。按用户确认的策略，默认轻量门禁不能发现运行时、数据库、打包和跨栈回归；这些风险由人工验收和后续明确授权的专项验证承担。
