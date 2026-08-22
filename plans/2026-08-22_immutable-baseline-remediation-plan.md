# 母版不可变基线冻结整改计划

## 当前状态和结果

- 状态：已结束
- 结果：已替代；补丁工具处理中文新文件名时错误报告失败，继而产生本重复计划。活动实施和后续结果统一维护在 `plans/2026-08-22_母版不可变基线冻结整改计划.md`。

## 关联需求

- `BASE-BE-003`、`BASE-BE-005`：修复 C/B 端认证会话隔离、管理员保护和认证生命周期边界。
- `BASE-BE-007`、`BASE-BE-008`：修复事务所有权、并发竞争和提交后派生状态清理语义。
- `BASE-ADMIN-002`、`BASE-ADMIN-004`、`BASE-ADMIN-006`：修复管理端权限、完整失败状态和统一请求管道。
- `BASE-WEB-002`、`BASE-WEB-003`、`BASE-WEB-006`：修复用户端认证生命周期、BFF 边界和 SEO Metadata。
- `BASE-API-001` 至 `BASE-API-005`：会话分页等公开契约变化必须完整生成并迁移消费者。
- `BASE-OPS-002` 至 `BASE-OPS-005`、`BASE-OPS-008`、`BASE-OPS-009`：验证依赖兼容、三端质量、跨栈契约、容器和不可变发布门禁。
- `BASE-SEC-002`、`BASE-SEC-005`、`BASE-SEC-006`：认证授权必须服务端生效，依赖和高风险操作必须可检查、可审计。
- `BASE-DOC-004`、`BASE-DOC-006`：用同一全栈计划追踪整改，并同步当前事实和已交付变化。

## 背景

2026-08-22 对 Backend、Admin、Web、API Client、数据库、容器、CI 和文档完成了冻结前只读审计。既有质量命令大部分通过，但审计发现 Cookie Profile 未真正隔离、最后超级管理员存在并发竞争、认证提交后 Redis 清理可能翻转成功结果、Session/Refresh Token 缺少保留策略、前后端认证生命周期矛盾、事务嵌套未绑定数据库 Session、Umi 内部 Vite 被跨主版本强制覆盖、生产基础镜像未固定 digest，以及高风险传输代码未纳入覆盖率等阻断项。

这些问题不一定能由现有单元测试或 production build 暴露，但会破坏母版的安全边界、数据一致性或不可变发布承诺。因此当前提交不能直接标记为不可变母版基线，必须完成本计划并通过完整验证后再决定冻结。

## 目标

1. 建立服务端强制执行的 Web/Admin Cookie Profile、Origin 和代理路由隔离。
2. 让最后超级管理员保护在真实 PostgreSQL 并发下保持串行一致。
3. 明确权威事务与非权威 Redis 派生状态的成功语义，禁止提交后失败翻转业务结果。
4. 建立 Session 与 Refresh Token 的分页、上限和可执行保留清理策略。
5. 统一 Backend、Admin、Web 的刷新、退出和改密生命周期契约及错误状态。
6. 让事务上下文同时绑定数据库 Session，阻止跨 Session 误判嵌套。
7. 移除 Umi/Vite 不兼容 override，重新解析锁文件并如实记录剩余上游风险。
8. 将生产基础镜像和基础设施镜像固定到完整 digest，并以正反例门禁验证。
9. 把 HTTP、认证启动、BFF 和权限边界纳入测试与覆盖率，补齐安全头、SEO 和文档一致性。

## 非目标

- 不新增具体业务领域，不改变母版的通用全栈定位。
- 不引入永久双轨或隐式兼容，不以客户端隐藏替代服务端隔离。
- 不手工修改根 `openapi.json` 或 `packages/api-client/src/`。
- 不把局部 Mock、SQLite、浏览器冒烟或构建成功表述为真实跨栈通过。
- 不在本计划中提交、推送、创建 Tag、发布镜像或部署生产；这些动作继续分别授权。

## 现状分析

### P1 冻结阻断项

| 编号 | 问题 | 主要风险 | 目标处置 |
| --- | --- | --- | --- |
| P1-01 | C/B Cookie Profile 与代理路由未真正隔离 | Web Origin 可借 Admin Cookie 调用管理接口 | 拆分 Profile Origin、Cookie 与代理 allowlist，服务端拒绝跨 Profile 请求 |
| P1-02 | 最后超级管理员保护先计数后修改 | 并发请求可同时移除最后保护主体 | PostgreSQL 事务级 advisory lock 串行化检查与写入 |
| P1-03 | 认证提交后同步清理 Redis 限流 | Redis 失败把已提交成功翻转为 503 | 将清理定义为显式可观测的非权威 best-effort 行为 |
| P1-04 | Session/Refresh Token 无限增长且列表不分页 | 数据持续膨胀、接口响应无界 | 增加受控分页、查询上限、保留策略和 dry-run/`--apply` 清理工具 |
| P1-05 | 前后端刷新、退出和改密语义矛盾 | 用户误退出、失败假成功或 Access 过期即跳登录 | 统一刷新一次、失败展示、当前会话保留和 Cookie 轮换契约 |
| P1-06 | 事务嵌套只记录深度不记录 Session | 不同 Session 被误认为同一事务 | 上下文绑定 Session，同 Session 嵌套和跨 Session 行为显式测试 |
| P1-07 | Umi 内部 Vite 被跨主版本 override | 构建器处于上游未声明兼容组合 | 移除 override，锁回 Umi 声明版本并重新评估风险 |
| P1-08 | 生产基础镜像仍使用可变 Tag | 相同源码可构建出不同运行时 | 全部生产基础镜像和 Compose 基础设施镜像固定完整 digest |
| P1-09 | 高风险传输代码未纳入覆盖率 | 认证与 BFF 回归不影响覆盖率门禁 | 纳入 HTTP、认证启动和 BFF，补跨 Profile 与失败路径测试 |

### 同步处理项

- Admin 系统状态改用唯一 HTTP 管道，移除手工泛型对 OpenAPI 类型的掩盖。
- Security 页面按每个日志类别分别授权，并恢复服务端分页；无权限辅助 Query 不得执行。
- Web 增加 `metadataBase`、canonical；Web/Admin 增加 CSP、点击劫持、Referrer 和 Permissions 等安全头。
- 修正根 README 的 shadcn/ui 和旧 `admin/pages` 描述、本地文档绝对路径、状态文案中英文混用，以及 ADR 0009 容器状态误读。

## 方案设计

### 1. Profile 隔离与认证生命周期

Backend 配置分别声明 Web 与 Admin 允许 Origin。依赖层从明确的 Cookie Profile 解析对应 Origin，不允许用统一 allowlist 替代 Profile 校验。Web BFF 仅转发用户端公开拥有的认证、账户和系统路径，并只转发该 Profile 所需 Cookie；Admin Nginx/API 入口同样限制管理端路径。Access 过期时只允许一次受控 Refresh 和一次原请求重放，Refresh 失败后才进入未认证状态。

退出失败必须留在当前页面并显示可重试错误。改密沿用 Backend 的权威语义：保留当前 Session、撤销其他 Session、轮换当前 Cookie，前端继续保持登录并显示明确成功结果。

### 2. 数据一致性与生命周期

最后超级管理员的计数与修改在同一事务内取得稳定 PostgreSQL advisory lock。锁键使用项目固定常量并记录设计依据；真实数据库并发测试必须证明两个竞争请求不会同时成功。

事务 helper 的上下文保存实际 `AsyncSession` 身份。跨 Session 调用拥有独立事务；同 Session 未定义的嵌套写事务明确失败，不以深度计数静默复用。

Session 列表使用公开分页契约和上限。清理工具按过期、撤销和保留期删除 Refresh Token 与 Session，默认 dry-run，只有 `--apply` 才提交；运维文档给出调度、观测和恢复边界。

### 3. 依赖、镜像和门禁

移除把 `@umijs/bundler-vite` 内部 Vite 4 强制到 Vite 6 的 override，由 pnpm 按 Umi 精确声明重新生成唯一锁文件。安全公告若没有兼容修复，保留真实依赖事实并按现有风险接受流程登记，不把不兼容升级表述为修复。

Dockerfile 和生产 Compose 中所有运行时基础镜像固定为 `name:tag@sha256:<64 hex>`。生产 Compose 检查覆盖三端应用镜像、PostgreSQL 和 Redis，正例与可变 Tag、短 digest、缺失变量等反例都必须验证。

### 4. 测试、契约和文档

前端覆盖率纳入认证 HTTP 管道、启动生命周期、Web BFF 和服务端请求入口。补充跨 Profile 拒绝、Access 过期刷新一次、Logout 失败、改密 Cookie 轮换、权限 Query 和安全头测试。契约变化严格按 Backend、导出 OpenAPI、生成 API Client、迁移 Admin/Web 的顺序执行。

同步认证授权、Backend 工程标准、测试策略、容器与环境运维文档、项目结构、全项目索引、README 和 Changelog。只记录验证过的当前事实，不提前宣称母版已经冻结。

## 全栈影响矩阵

| 范围 | 是否涉及 | 工作内容 | 前置依赖 | 验证 |
| --- | --- | --- | --- | --- |
| Backend | 涉及 | Profile 隔离、并发保护、事务、派生状态、分页和清理工具 | 真实 PostgreSQL、Redis | Ruff、Mypy、pytest、覆盖率、import-linter、Alembic |
| Admin | 涉及 | 刷新/退出/改密、权限、分页、统一 HTTP、安全头和覆盖率 | Backend 契约、API Client | lint、typecheck、Vitest、覆盖率、build、Browser E2E |
| Web | 涉及 | BFF allowlist、刷新/退出/改密、Metadata、安全头和覆盖率 | Backend 契约、API Client | lint、typecheck、Vitest、覆盖率、build、Browser E2E |
| API Client | 涉及 | 按分页等契约重新生成并迁移消费者 | Backend OpenAPI 导出 | 生成无漂移、类型检查、契约差异检查 |
| Database | 涉及 | 并发 advisory lock、Session/Token 清理与必要索引评估 | 真实 PostgreSQL | Alembic check、真实并发和清理集成测试 |
| Deployment | 涉及 | Umi/Vite 兼容、镜像 digest、安全头和 Compose 门禁 | 锁文件与可验证镜像引用 | 冻结安装、构建、Compose config、正反例门禁 |
| Documentation | 涉及 | 计划、架构、运维、README、索引、结构和 Changelog | 实施与验证事实 | `pnpm lint:md`、治理检查、文本卫生 |

## 实施顺序

1. 创建本计划并登记为“实施中”，同步项目结构统计。
2. 修复 Backend Profile 隔离、并发、事务、Redis 派生状态和 Session 生命周期。
3. 导出 OpenAPI、生成 API Client，并完成 Admin/Web 消费迁移。
4. 修复 Admin/Web 认证生命周期、权限、分页、BFF、Metadata 和安全头。
5. 移除不兼容 Vite override，重新解析锁文件；固定生产基础镜像 digest 并增强门禁。
6. 扩大高风险代码覆盖范围，补充真实数据库、失败路径和跨栈测试。
7. 同步权威架构、运维、索引、README、Changelog 和本计划结果。
8. 执行完整质量、契约、容器、Browser E2E、文档、治理和最终差异验证。

## 影响文件

- `apps/backend/app/`、`apps/backend/scripts/`、`apps/backend/tests/`、`apps/backend/.env.example`
- `apps/admin/config/`、`apps/admin/src/`、`apps/admin/nginx.conf`、`apps/admin/vitest.config.ts`、`apps/admin/Dockerfile`
- `apps/web/src/`、`apps/web/next.config.ts`、`apps/web/vitest.config.ts`、`apps/web/Dockerfile`
- `openapi.json`、`packages/api-client/src/`
- `pnpm-workspace.yaml`、`pnpm-lock.yaml`、`compose.prod.yml`、`scripts/ci/`
- `README.md`、`CHANGELOG.md`、`.agents/agents-index.md`
- `docs/architecture/`、`docs/operations/`、`docs/README.md`
- `plans/2026-08-22_immutable-baseline-remediation-plan.md`

## 风险与回滚

- Profile 隔离会改变浏览器请求可达性；以明确路径 allowlist、三端本地端口和生产同域代理测试避免误阻断合法请求。
- 会话分页属于公开契约变化；必须同批生成客户端并迁移消费者，不保留无期限双轨。
- advisory lock 只保护使用同一锁协议的写路径；所有会改变超级管理员保护状态的入口必须复用同一服务方法并接受测试。
- Session 清理涉及删除数据；脚本默认 dry-run，`--apply` 前输出范围，先删 Token 再删无引用 Session，并在隔离测试库验证。
- 移除 Vite override 可能重新暴露已知 Medium 风险；如无兼容升级路径，按限时风险接受记录，不恢复不兼容 override。
- digest 更新会改变构建和拉取来源；记录完整镜像名、Tag 和 digest，验证架构后再更新，不触发发布或生产部署。
- 所有回滚均以本计划开始前 Git 快照为边界，禁止通过破坏历史或回退用户无关修改恢复。

## 验证清单

- [ ] Backend Profile Origin、Cookie 和 API 路径跨端访问被服务端拒绝，合法 Web/Admin 流程通过。
- [ ] 最后超级管理员真实 PostgreSQL 并发测试证明最多一个竞争操作成功。
- [ ] Redis 清理失败不会翻转已提交认证成功，且失败具有日志和指标上下文。
- [ ] Session/Refresh Token 分页、上限、dry-run 和 `--apply` 清理测试通过。
- [ ] 不同数据库 Session 不共享事务上下文，同 Session 非法嵌套明确失败。
- [ ] OpenAPI 导出与根契约一致，API Client 重新生成无漂移，Admin/Web 类型检查通过。
- [ ] Access 过期只刷新一次；Logout 失败可重试；改密保留当前登录并轮换 Cookie。
- [ ] Admin 各日志 Tab 独立授权，无权限辅助 Query 不执行，列表使用服务端分页。
- [ ] Web BFF allowlist、Metadata/canonical 和两端安全响应头测试通过。
- [ ] Umi 使用上游声明的 Vite 版本，冻结安装、Admin 测试和 production build 通过。
- [ ] 所有生产基础镜像和基础设施镜像固定完整 digest，Compose 正反例门禁通过。
- [ ] Admin/Web 高风险 HTTP、认证和 BFF 代码纳入覆盖率门禁。
- [ ] Backend 全量静态检查、真实 PostgreSQL/Redis pytest 和覆盖率通过。
- [ ] Admin/Web lint、typecheck、Vitest、覆盖率和 production build 分项通过。
- [ ] 桌面与移动端真实跨栈 Browser E2E 通过，或如实记录外部环境阻断而不宣称冻结完成。
- [ ] `pnpm lint:md`、`pnpm check:workspace`、`pnpm check:boundaries`、`pnpm check:governance` 和 `git diff --check` 通过。
- [ ] 最终工作区只包含本计划范围内的预期修改，无缓存、构建产物、测试服务或临时文件残留。

## 待确认问题

- 无。用户已授权创建计划后直接执行全部冻结整改，无需再次确认。

## 用户确认记录

- 2026-08-22：用户要求全面扫描 Backend、Admin、Web、技术栈兼容、边界和文档完整性，作为母版不可变基线冻结前评估。
- 2026-08-22：用户确认开始实现，要求直接创建计划文档并立即执行，无需再次确认。

## 实施结果

- 本文件未实施，已由 `plans/2026-08-22_母版不可变基线冻结整改计划.md` 替代。

## 剩余问题

- 无。本计划的全部范围和未决事项已转入中文路径的活动计划，不在本文件重复维护。
