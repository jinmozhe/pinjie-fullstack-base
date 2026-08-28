# Admin 官方布局宽度比例对齐计划

## 当前状态和结果

- 状态：已结束
- 结果：已替代

## 关联需求

- `BASE-ADMIN-001`：提供可扩展的 B 端管理应用骨架。
- `BASE-ADMIN-005`：管理端必须适合高频工作操作。

## 背景

当前 Admin 在 `1920px` 级桌面视口使用约 `220px` 侧栏，同时将 PageContainer 标题区和正文限制为 `1480px` 并居中。两项约束叠加后，右侧工作区左右留白明显大于 Ant Design Pro 官方参考，表格无法充分利用宽屏空间。

用户提供了当前页面与官方 Ant Design Pro 页面截图，要求左侧、右侧宽度按官方比例调整。

本文件因 Windows 补丁工具在创建中文路径时错误报告失败而重复产生，活动实施统一维护在 `plans/2026-08-25_Admin官方布局宽度比例对齐计划.md`。

## 目标

1. 桌面展开态侧栏采用官方参考的 `256px` 宽度。
2. 右侧 PageContainer 改为流式宽度，移除无依据的 `1480px` 上限。
3. 桌面宽屏使用 `40px` 页面内边距，较窄桌面和移动端按断点收紧。
4. 标题区与正文保持同一水平边界。
5. 保留现有认证、RBAC、页面、表格、操作、状态和响应式行为。

## 非目标

1. 不修改 Backend、Web、API Client 或数据库。
2. 不修改 Admin 页面业务逻辑、表格字段、操作按钮或视觉主题。
3. 不引入新依赖，不重写 Umi Max ProLayout。

## 现状分析

1. `apps/admin/src/app.tsx` 显式设置 `siderWidth: 220`。
2. `apps/admin/src/styles.css` 为标题区和正文设置 `max-width: 1480px` 与自动居中。
3. 在用户提供的约 `1920px` 截图中，现有侧栏约占视口 `11.5%`，官方参考约占 `13.3%`；现有右侧主工作区约占视口 `74.6%`，官方参考约占 `81.8%`。

## 方案设计

1. 将 ProLayout `siderWidth` 调整为 `256`，保持折叠宽度和移动端抽屉由官方组件管理。
2. 删除 PageContainer 标题区和正文的 `max-width` 与自动居中，宽度改为 `100%`。
3. `1440px` 以上视口使用 `40px` 水平内边距，`992px` 至 `1439px` 使用 `24px`，移动端继续使用 `16px`。
4. 使用现有 CSS 和 ProLayout Token 完成调整，不新增并行布局体系。

## 全栈影响矩阵

| 范围 | 是否涉及 | 工作内容 | 前置依赖 | 验证 |
| --- | --- | --- | --- | --- |
| Backend | 不涉及 | 无接口或运行时变化 | 无 | 不适用 |
| Admin | 涉及 | ProLayout 侧栏与 PageContainer 流式宽度 | 现有 Umi Max、Ant Design Pro | typecheck、lint、test、build、浏览器验证 |
| Web | 不涉及 | 无变化 | 无 | 不适用 |
| API Client | 不涉及 | 契约不变 | 无 | 不适用 |
| Database | 不涉及 | 无变化 | 无 | 不适用 |
| Deployment | 不涉及 | 构建与运行方式不变 | 无 | Admin production build |
| Documentation | 涉及 | 计划、索引、当前架构事实和 Changelog | 实施结果 | `pnpm lint:md`、治理检查 |

## 实施顺序

1. 创建计划并同步 `PROJECT_INDEX.md`。
2. 调整 ProLayout 侧栏宽度和 PageContainer 内容宽度。
3. 补充布局配置测试，运行 Admin 全量质量命令。
4. 在桌面与移动端视口核对布局比例、横向溢出和关键页面可见性。
5. 同步计划结果、索引、架构文档和 Changelog。

## 影响文件

- `plans/2026-08-25_admin-layout-width-ratio-plan.md`
- `PROJECT_INDEX.md`
- `apps/admin/src/app.tsx`
- `apps/admin/src/styles.css`
- `apps/admin/src/app.test.tsx`
- `docs/architecture/admin-engineering-standard.md`
- `CHANGELOG.md`

## 风险与回滚

- 风险：侧栏加宽会减少中等桌面视口的内容宽度。
- 控制：仅在官方桌面断点使用展开侧栏，内容内边距按视口回落，移动端继续使用官方响应式导航。
- 回滚：精确恢复本计划涉及的布局数值和 CSS，不修改业务数据或 API 契约。

## 验证清单

- [ ] `pnpm --filter @pinjie/admin typecheck`
- [ ] `pnpm --filter @pinjie/admin lint`
- [ ] `pnpm --filter @pinjie/admin test`
- [ ] `pnpm --filter @pinjie/admin build`
- [ ] `pnpm lint:md`
- [ ] `pnpm check:workspace`
- [ ] `pnpm check:boundaries`
- [ ] `1920x1080` 桌面视口比例与官方参考一致，无页面横向溢出
- [ ] `1440x900` 桌面视口内容完整，无操作遮挡
- [ ] `390x844` 移动视口保持官方响应式导航，无页面横向溢出

## 待确认问题

无。

## 用户确认记录

- 2026-08-25：用户提供当前页面与官方 Ant Design Pro 截图，明确要求右侧整体宽度及左右比例参考官方实现。

## 实施结果

已由中文路径的同主题计划替代，未用于实施。

## 剩余问题

无。
