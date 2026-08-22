# Dependabot 中低危依赖治理计划

## 当前状态和结果

- 状态：实施中
- 结果：四项可修复传递依赖已完成本地替换和完整回归，三项上游风险已按 `tolerable_risk` 限时接受；四条 GitHub 开放告警等待本地锁文件提交并推送后重扫关闭。

## 关联需求

- `BASE-OPS-002`：继续由根 `pnpm-lock.yaml` 统一锁定 Node.js 依赖。
- `BASE-OPS-003`：依赖调整后执行 Admin、Web 和仓库级质量门禁。
- `BASE-SEC-005`：对依赖供应链风险执行可重复检查，并区分已修复漏洞与已接受上游风险。
- `BASE-QUAL-001`：不得把风险接受或告警关闭表述为漏洞已修复。
- `BASE-DOC-004`：通过本计划记录范围、确认、实施和验证证据。

## 背景

截至 2026-08-22，GitHub Dependabot 与本地 `pnpm audit --audit-level low` 均报告 7 条开放的 npm 告警，包括 4 个 Medium 和 3 个 Low，全部来自 Admin 的 Umi 工具链传递依赖。项目的 High/Critical 依赖门禁继续通过，但 Medium/Low 风险尚未逐项闭环。

用户已确认本仓库是内部自用、单人维护的母版，不增加第二维护者，也不把独立 Pull Request 或生产审批作为后续加固目标。管理员 bypass、Environment 自审和 Ruleset bypass 保留为单维护者恢复机制；本计划只治理依赖告警并同步这一已接受边界。

## 目标

1. 用范围受控的 pnpm override 升级 4 个已有安全版本的传递依赖，并重新生成唯一根锁文件。
2. 对无法安全升级的 3 条上游风险记录依赖路径、不可达性证据、临时控制、负责人和复核日期。
3. 在 GitHub Dependabot 中把对应 3 条告警标记为 `tolerable_risk`，备注不得声称漏洞已修复。
4. 完成 Admin、Web、供应链、治理和真实跨栈回归，确认传递依赖替换没有破坏 Umi、构建或运行行为。
5. 将单维护者内部项目的审批边界更新为已接受治理决策，不再列为待加固事项。

## 非目标

- 不强制把 Umi 的 React Router 6 升级为不受上游支持的 React Router 7。
- 不伪造 `elliptic` 的修复版本，也不通过关闭 Dependabot 或降低扫描级别隐藏风险。
- 不升级与当前七条告警无关的直接依赖，不调整业务功能、公开 API、数据库或生产部署。
- 不增加第二维护者，不要求独立 PR 审批或禁止单维护者自审。
- 不在本计划中提交、推送、发布镜像或部署生产；这些动作继续分别授权。

## 现状分析

### 可修复告警

| 告警 | 包 | 严重级别 | 当前解析 | 目标解析 | 处置 |
| --- | --- | --- | --- | --- | --- |
| `#6` | `@babel/core` | Low | `7.23.6` | `7.29.7` | 对受影响旧版本增加范围 override |
| `#3` | `@babel/runtime` | Medium | `7.23.6` | `7.29.7` | 对低于修复版本的解析增加范围 override |
| `#2` | `esbuild` | Medium | `0.18.20`、`0.21.4` | `0.25.12` | 对受影响旧版本增加范围 override |
| `#1` | `send` | Low | `0.17.1` | `0.19.2` | 对低于修复版本的解析增加范围 override |

四个目标版本已在当前锁文件的其他依赖路径中存在，并已超过项目规定的七天发布冷却期。实际实施仍需由 pnpm 重新解析，并通过安装、构建、测试和运行验证证明兼容。

### 暂无安全升级路径的告警

| 告警 | 包 | 严重级别 | 限制 | 当前可达性判断 | 计划处置 |
| --- | --- | --- | --- | --- | --- |
| `#4`、`#7` | `react-router` | Medium | Umi `4.7.5` 固定 `6.3.0`；当前 Umi `4.7.7` 仍固定该版本且未满足七天冷却期；消除全部公告需 React Router `7.18.0` | Admin 只向静态内部路径导航，未消费不可信重定向参数 | `tolerable_risk`，限时复核，不强制不受支持的 Major 升级 |
| `#5` | `elliptic` | Low | 最新 `browserify-sign 4.2.6` 仍依赖 `elliptic ^6.6.1`，公告暂无修复版本 | 仅来自 Umi 构建器浏览器加密 shim；仓库源码不直接导入相关加密包 | `tolerable_risk`，限时复核，等待上游修复或移除依赖链 |

上述可达性判断是当前源码和依赖图的风险依据，不等同于漏洞不存在。责任人为仓库维护者，计划复核日期为 2026-09-21；如果 Umi 提前支持安全版本，或 `elliptic` 上游发布修复，则提前重新评估。

## 方案设计

### 1. 范围受控的依赖替换

计划在根 `pnpm-workspace.yaml` 的现有 `overrides` 中增加：

```yaml
"@babel/core@<=7.29.0": 7.29.7
"@babel/runtime@<7.26.10": 7.29.7
"esbuild@<=0.24.2": 0.25.12
"send@<0.19.0": 0.19.2
```

使用公告受影响范围约束 override，不把未来安全版本无条件降级到当前目标版本。随后由 pnpm 重新生成 `pnpm-lock.yaml`，逐项检查旧解析是否消失以及是否出现意外的大范围依赖变化。

### 2. 上游风险接受

仅在本地验证完成并复核 GitHub 告警编号、包名和公告一致后，关闭 `#4`、`#5`、`#7`，原因使用 `tolerable_risk`。每条备注必须包含：

- 上游依赖链与当前没有安全升级路径的事实。
- 当前项目不触达易受攻击调用方式的证据。
- 保留的自动门禁和不降低扫描级别的临时控制。
- 负责人、2026-09-21 复核日期和提前复核触发条件。

GitHub 开放告警数变为 0 只表示 4 条已修复、3 条已显式接受并关闭；本地低级别原始审计仍应报告 3 条已接受风险。

### 3. 单维护者治理边界

更新 GitHub Actions 运维文档，将单维护者内部使用、审批数为 0、自审和 bypass 明确为用户已接受的当前治理模型。保留自动状态检查、不可变发布、人工发布/部署授权和审计记录；删除“增加第二维护者后应调整”的待办语气。

### 4. 文档与状态同步

- `SECURITY.md`：补充 Medium/Low 传递依赖的限时风险接受要求和本次处置边界。
- `docs/operations/github-actions-workflows.md`：记录告警处置事实与单维护者内部治理模型。
- `.agents/agents-index.md`：维护计划状态和当前 Deployment/Documentation 事实。
- `docs/architecture/project-structure.md`：新增计划后重新统计项目文件和目录数量。
- `CHANGELOG.md`：计划完成后记录依赖修复与风险接受，不记录普通 Commit SHA。

## 全栈影响矩阵

| 范围 | 是否涉及 | 工作内容 | 前置依赖 | 验证 |
| --- | --- | --- | --- | --- |
| Backend | 不涉及 | 不改 Python 依赖、实现或契约 | 无 | 通过跨栈 E2E 验证未受前端依赖替换影响 |
| Admin | 涉及 | 验证 Umi 传递依赖替换后的质量与运行行为 | 锁文件重新解析成功 | lint、typecheck、test、build、Browser E2E |
| Web | 涉及 | 复核根锁文件变化没有影响 Next.js 应用 | 锁文件重新解析成功 | lint、typecheck、test、build、Browser E2E |
| API Client | 不涉及 | 不修改 OpenAPI 或生成客户端 | 无 | 检查生成目录无意外漂移 |
| Database | 不涉及 | 不修改 Model、迁移或数据 | 真实 E2E 使用隔离测试数据库 | 不执行生产数据操作 |
| Deployment | 涉及 | 处理 GitHub Dependabot 告警并记录单维护者治理边界 | 本地验证完成、GitHub 身份认证可用 | 复核告警状态、Security 门禁和远端设置 |
| Documentation | 涉及 | 更新计划、安全策略、运维说明、索引、结构统计和 Changelog | 实施与验证结果 | `pnpm lint:md`、文本卫生和交叉检查 |

## 实施顺序

1. 创建本计划并登记为“待确认”，取得用户对 override、风险接受和验证范围的确认。
2. 将计划状态改为“实施中”，更新 `pnpm-workspace.yaml` 并重新生成根锁文件。
3. 检查锁文件差异、依赖路径、发布冷却期和本地原始审计结果。
4. 执行 Admin、Web、仓库治理和供应链验证。
5. 启动真实 Backend、PostgreSQL、Redis、Admin 与 Web，完成桌面和移动端 Browser E2E，并清理本次进程和产物。
6. 在 GitHub 逐条处理 7 条告警：确认 4 条已由新锁文件关闭，对 3 条执行带证据和复核日期的风险接受。
7. 同步安全策略、运维文档、项目结构、索引、Changelog 和计划结果，完成最终文档与工作区复核。
8. 计划结束后等待用户另行授权提交与推送。

## 影响文件

- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `SECURITY.md`
- `docs/operations/github-actions-workflows.md`
- `docs/architecture/project-structure.md`
- `.agents/agents-index.md`
- `CHANGELOG.md`
- `plans/2026-08-22_Dependabot中低危依赖治理计划.md`

## 风险与回滚

- Babel、esbuild 和 send 均为 Umi 工具链的传递依赖，跨越上游声明版本可能影响构建、开发服务或测试；以本次变更前的 Git 快照回退 manifest 和锁文件，并重新执行冻结安装恢复。
- `esbuild` 跨多个 Minor 版本，风险高于补丁升级；Admin/Web 构建和真实 Browser E2E 是必需验收，不以单纯安装成功代替兼容验证。
- GitHub 风险接受会改变远端告警状态但不改变依赖事实；处置前保存告警编号和依据，若验证或证据不满足则不关闭对应告警。
- 复核日期到期后仍无上游修复时，必须重新记录可达性、临时控制和下一复核日期，不能无期限沿用本次结论。
- 本计划不改变管理员 bypass 和自审能力；其风险由内部单维护者使用边界和现有自动门禁共同约束。

## 验证清单

- [x] `pnpm install --lockfile-only` 或仓库既有等价命令成功，随后 `pnpm install --frozen-lockfile` 成功。
- [x] 锁文件不再解析受影响的 `@babel/core 7.23.6`、`@babel/runtime 7.23.6`、`esbuild 0.18.20/0.21.4` 和 `send 0.17.1`。
- [x] `pnpm audit --audit-level high` 通过，High/Critical 为 0。
- [x] `pnpm audit --audit-level low --json` 只保留 3 条已接受的上游风险，且没有新增告警。
- [x] Admin lint、typecheck、17 项既有 Vitest 与 production build 通过。
- [x] Web lint、typecheck、18 项既有 Vitest 与 production build 通过。
- [x] `pnpm check:workspace`、`pnpm check:boundaries`、`pnpm check:governance` 通过。
- [x] `pnpm lint:md` 通过。
- [x] API Client 生成目录没有意外漂移。
- [x] 真实 PostgreSQL/Redis 与 Backend 下的 Admin/Web 桌面、移动 Browser E2E 通过，无控制台错误或横向溢出。
- [ ] GitHub 4 条可修复告警因新锁文件关闭，3 条告警以 `tolerable_risk` 和完整备注关闭，开放告警数为 0。
- [x] 最终工作区只包含本计划范围内的预期修改，没有验证遗留监听、缓存或临时产物。

## 待确认问题

- 无。用户已确认本计划的 override、限时风险接受和单维护者治理边界。

## 用户确认记录

- 2026-08-22：用户要求开始执行原建议中的第 2 项 Dependabot Medium/Low 依赖风险治理。
- 2026-08-22：用户明确第 3 项不需要，项目内部自用且仅由一人维护，不增加额外维护者。
- 2026-08-22：用户确认执行本计划，包括 4 个范围 override、3 条截至 2026-09-21 的限时风险接受和完整回归范围。

## 实施结果

- 根 `pnpm-workspace.yaml` 已增加四条受影响版本范围 override，并重新生成唯一根 `pnpm-lock.yaml`。旧解析 `@babel/core 7.23.6`、`@babel/runtime 7.23.6`、`esbuild 0.18.20/0.21.4` 和 `send 0.17.1` 已消失；目标解析分别为 `7.29.7`、`7.29.7`、`0.25.12` 和 `0.19.2`。
- 冻结安装和供应链策略通过；`pnpm audit --audit-level high` 为 0 High、0 Critical。低级别原始审计只保留 React Router 两条 Moderate 与 `elliptic` 一条 Low，未出现新增告警。
- Admin lint、typecheck、17 项 Vitest、production build 与 Web lint、typecheck、18 项 Vitest、production build 全部通过；API Client 重新生成无漂移，仓库治理检查通过。
- 使用真实 PostgreSQL 18、Redis、Backend、Admin、Web 和完整 Chromium 完成桌面/移动跨栈 E2E。最终 8 个适用用例通过，8 个按项目范围正常跳过；未修改超时或跳过规则。
- GitHub 告警 `#4`、`#7` 和 `#5` 已按 `Risk is tolerable to this project` 关闭，备注记录依赖链、源码不可达性、负责人、2026-09-21 复核日期和提前复核条件。`#5` 首次关闭原因选择错误后已重开并按正确原因重新关闭，GitHub 审计时间线保留了纠正过程。
- 当前 GitHub Dependabot 列表为 4 Open、3 Closed。开放的 `#1`、`#2`、`#3`、`#6` 对应本地已修复的四项依赖，必须在本地修改提交并推送后等待 Dependabot 基于新锁文件重扫。
- Windows 下 standalone 产物因相对符号链接在沙箱中触发 `EPERM stat`；真实行为验证使用同一次 production build 的 `.next` 输出和 `next start` 完成，不影响构建成功或跨栈行为结论。
- 最终 `pnpm lint:md`、`pnpm check:governance` 与 `git diff --check` 通过；E2E 报告和测试结果目录已清理，端口 3000、3001、8000 无遗留监听。

## 剩余问题

- 等待用户另行授权提交并推送本计划修改。推送后需复核 Dependabot 将 `#1`、`#2`、`#3`、`#6` 自动关闭，再把开放告警数为 0、线上工作流结果和计划状态回写为最终完成事实。
