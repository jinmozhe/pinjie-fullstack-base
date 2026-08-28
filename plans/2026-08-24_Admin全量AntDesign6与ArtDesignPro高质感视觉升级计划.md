# Admin 官方 Ant Design 6 与 ProComponents 全量视觉交互升级计划

## 1. 当前状态和结果

- 当前状态：已结束
- 结果：已完成

## 2. 关联需求

- `BASE-ADMIN-001`：提供可扩展的 B 端管理应用骨架（路由、布局、导航、统一错误处理）。
- `BASE-ADMIN-004`：管理界面必须覆盖完整操作状态（表格、表单和操作流程覆盖加载、空数据、失败、无权限、成功和确认）。
- `BASE-ADMIN-005`：管理端必须适合高频工作操作（界面紧凑、可扫描，支持筛选、长文本和窄屏溢出处理）。

## 3. 背景

当前 Admin 管理后台（基于 Ant Design Pro v6、Umi Max 与 Ant Design 6）在完成底层安全与契约治理后，页面仍处于极简骨架阶段：

1. 布局上顶栏与侧边栏重复显示 Logo 与标题，侧栏文字被挤压截断；
2. 页面直接将表格和输入框裸露在灰底上，缺乏立体卡片容器感与视觉层级；
3. 用户管理及各业务表格硬编码固定滚动宽度，导致大屏幕上强制出现灰色横向滚动条，且操作列按钮被遮挡截断；
4. 全局尚未充分使用 Ant Design 6 官方 Design Token 和 ProComponents 页面、表格与表单规范。

本计划以 Ant Design 6、ProComponents 和 Umi Max ProLayout 为唯一 UI 标准，对现有页面进行完整视觉与交互升级。

## 4. 目标

1. 建立深色侧栏、浅色顶栏、浅灰工作区、白色主工作面板和官方蓝主色的统一管理端视觉。
2. 使用 Ant Design 6 Seed Token、Alias Token 和 Component Token 统一色彩、圆角、控件高度、表头、边框、阴影和状态反馈。
3. 继续使用 Umi Max 当前集成的 ProLayout，通过公开配置修复品牌区、侧栏、顶栏和响应式导航，不创建第二套布局。
4. 所有现有业务页面接入 `PageContainer`，统一标题、描述、面包屑、主操作和正文间距。
5. 用户、管理员和角色等标准 CRUD 页面使用受控 `ProTable`，由 TanStack Query 继续管理服务端状态。
6. 统一搜索、重置、刷新、表单、弹窗、抽屉、状态标签、加载、空数据和错误恢复体验。
7. 消除页面级横向溢出和桌面端无意义表格滚动，为真实宽表和窄屏保留容器内部受控滚动。
8. 完整保留认证、RBAC、CSRF、单飞 Refresh、二次确认、审计、请求错误传播和全部现有业务操作。

## 5. 非目标

1. 不更换现有 React 19 + Umi Max + Ant Design 6 技术栈，不引入破坏性第三方 UI 库。
2. 不修改后端 API 契约和数据库结构。
3. 不破坏已有的严格安全边界（如单飞 Refresh、CSRF、二次确认头、Cookie 隔离）。
4. 不增加缺少真实业务数据的分析页、监控页、图表和演示业务功能。
5. 不在本计划中升级 Ant Design、ProComponents、Umi Max、React 或其他依赖版本。
6. 不使用营销页式大标题、装饰性卡片堆叠、卡片套卡片、夸张圆角、重阴影和花哨动效。

## 6. 现状分析

1. `apps/admin/config/defaultSettings.ts` 与 `apps/admin/src/app.tsx` 中配置的 `layout: "mix"` 和 `menuHeaderRender` 在侧边栏和顶栏产生了冲突，导致 Logo 重复并挤压截断。
2. `apps/admin/src/components/PageFrame.tsx` 仅渲染为原生 `section`，没有与 Ant Design 的 `Card` 或 `PageContainer` 结合，缺乏视觉层次。
3. 各 Feature 表格（如 `UsersPage.tsx`）直接配置了 `scroll={{ x: 820 }}` 与 `fixed: "right"`，在大屏幕或标准视口下无法弹性撑满，且右侧操作区出现遮罩滚动条。
4. 全局 `theme.token` 仅定义少量色彩，尚未形成官方布局、容器、表格、表单与浮层的统一主题。
5. 安全日志包含 Request ID、路由和审计目标等真实宽字段，需要保留表格容器内部受控滚动。
6. 系统状态页已有单层 `Card`，升级公共页面容器时必须避免卡片套卡片。

## 7. 方案设计

### 7.1 官方设计基线与 Token

- 视觉与交互参考：[Ant Design Pro 官方预览](https://preview.pro.ant.design/)。
- 组件与组合方式参考：[ProComponents 组件总览](https://procomponents.ant.design/components)。
- 主题实现参考：[Ant Design Customize Theme](https://ant.design/docs/react/customize-theme)。
- 官方预览用于核对信息层级、导航、页面容器、表格、表单和状态完成度，不复制缺少真实需求的数据页面。
- 全局 Token 统一主色、语义色、文字层级、布局背景、容器背景、边框、圆角、控件高度和浮层阴影。
- 基础圆角为 `8px`，小控件为 `6px`；标准控件高度为 `36px`，小控件为 `28px`，大控件为 `40px`。
- 表头使用微灰背景，普通内容面板以细边框建立层级，仅弹窗、抽屉和必要浮层使用克制阴影。
- 页面局部样式优先消费官方 Token 或稳定语义类，不维护第二套颜色变量体系。

### 7.2 ProLayout 导航与侧栏重构

- 调整 `defaultSettings.ts` 为侧栏布局和流式内容区，侧栏宽度固定为 `224px`。
- 当前 ProComponents 锁定版本的 `realDark` 会启用整套暗色算法，因此最终保留 `navTheme: "light"`，通过公开的 `token.sider` 和 `token.header` 分别实现深色侧栏与浅色顶栏。
- 关闭 ProLayout 会生成重复 `header` landmark 的占位式固定顶栏，使用真实 `.ant-pro-layout-header` 的 CSS sticky 行为保持吸顶。
- 继续使用 Umi Max 当前集成的 ProLayout，不创建第二套布局。
- 品牌标记只在一个位置渲染，折叠态显示图形标记，展开态显示完整产品名。
- 顶部导航栏右侧头像与下拉菜单精致化。
- 底部 Footer 优雅居中。

### 7.3 页面容器与 Feature 表格重构

- 重构 `PageFrame`，内部使用 `PageContainer`，统一标题、描述、面包屑和页面主操作。
- 改造 `UsersPage`、`AdminsPage`、`RolesPage`、`SecurityPage`、`SystemStatusPage`：
  - 用户、管理员和角色页面使用受控 `ProTable`，TanStack Query 继续管理服务端状态。
  - 搜索工具栏支持回车提交、显式搜索、重置和刷新。
  - 移除无依据的固定滚动宽度，真实宽表和窄屏保留表格容器内部受控滚动。
  - 标准页面只保留一层主工作面板，禁止卡片套卡片。
  - 操作列使用官方图标、紧凑按钮和窄屏菜单，状态 Tag 保留明确文本。

## 8. 全栈影响矩阵

| 范围 | 是否涉及 | 工作内容 | 前置依赖 | 验证 |
| --- | --- | --- | --- | --- |
| Backend | 不涉及 | 后端接口与契约保持现状 | 无 | 不运行无影响的 Backend 回归 |
| Admin | 涉及 | 全局 Token、布局、PageFrame、登录页与各功能页面官方视觉交互重构 | 现有锁定依赖 | `typecheck`、`lint`、`test`、`build` 及浏览器跨视口验证 |
| Web | 不涉及 | Web 用户端保持现状 | 无 | 不运行无影响的 Web 回归 |
| API Client | 不涉及 | 生成契约无变动 | 无 | Admin build 与生成漂移门禁 |
| Database | 不涉及 | 数据库无变动 | 无 | 无 |
| Deployment | 不涉及 | 不修改工作流、镜像或部署配置 | 无 | Admin production build |
| Documentation | 涉及 | 更新计划记录、全项目索引和 Changelog | 实施结果 | `pnpm lint:md` 与治理检查 |

## 9. 实施顺序

1. 更新本计划和 `PROJECT_INDEX.md`，记录用户确认并进入实施中。
2. 建立 Ant Design 6 官方 Token，调整 ProLayout、品牌区和全局样式。
3. 将 PageFrame 重构为 PageContainer，建立统一工具区、状态和响应式基础。
4. 依次升级登录、用户、管理员、角色权限、安全日志和系统状态页面。
5. 补充并校准相关组件测试，运行 Admin typecheck、lint、test 和 build。
6. 在 `1920x1080`、`1440x900`、`1280x720`、`768x1024`、`390x844` 视口完成浏览器验证。
7. 运行 Markdown 和治理门禁，回写计划实施结果、索引和 Changelog。

## 10. 影响文件

- `plans/2026-08-24_Admin全量AntDesign6与ArtDesignPro高质感视觉升级计划.md`
- `PROJECT_INDEX.md`
- `CHANGELOG.md`
- `apps/admin/src/app.tsx`
- `apps/admin/config/defaultSettings.ts`
- `apps/admin/src/styles.css`
- `apps/admin/src/components/PageFrame.tsx`
- `apps/admin/src/features/auth/LoginPage.tsx`
- `apps/admin/src/features/users/UsersPage.tsx`
- `apps/admin/src/features/admins/AdminsPage.tsx`
- `apps/admin/src/features/roles/RolesPage.tsx`
- `apps/admin/src/features/security/SecurityPage.tsx`
- `apps/admin/src/features/system/SystemStatusPage.tsx`
- `apps/admin/src/app.test.tsx` 及相关 Feature 测试文件

## 11. 风险与回滚

1. ProTable DOM 结构变化可能影响现有 React Testing Library 查询和可访问性断言。
2. ProLayout 主题和侧栏配置可能影响移动端菜单、品牌区和账户区渲染。
3. 列宽调整可能在安全日志、长角色名和大量操作按钮场景产生新的溢出。
4. 公共 Token 变化可能影响 Modal、Drawer、Message、Tag 和登录页的对比度。
5. ProComponents 与 Ant Design 6 的锁定组合需要通过完整 typecheck、test 和 build 证明兼容。

回滚按以下方式执行：

1. 全部实现保留在独立功能分支，并按主题布局、公共容器、业务页面和收尾验证分阶段提交。
2. 已提交变化通过精确 `git revert <commit>` 回滚，不重写 Git 历史。
3. 未提交变化仅在核对文件列表和差异后逐文件恢复，禁止对 `apps/admin/` 整体执行覆盖式恢复。
4. 回滚不得触碰本计划之外的并行用户修改、真实环境配置、数据库或生成契约。

## 12. 验证清单

- [x] `pnpm --filter @pinjie/admin typecheck`
- [x] `pnpm --filter @pinjie/admin lint`
- [x] `pnpm --filter @pinjie/admin test`
- [x] `pnpm --filter @pinjie/admin build`
- [x] `pnpm lint:md`
- [x] `pnpm check:workspace`
- [x] `pnpm check:boundaries`
- [x] `pnpm check:governance`
- [x] `1920x1080`：布局层级清楚，无页面横向溢出和操作遮挡。
- [x] `1440x900`：标准 CRUD 表格无无意义滚动，工具区完整。
- [x] `1280x720`：侧栏、账户区、表格和分页不重叠。
- [x] `768x1024`：侧栏按官方响应式行为收起，内容保持可操作。
- [x] `390x844`：页面无横向溢出，真实宽表只在表格容器内部滚动。
- [x] 品牌 Logo 只显示一次，展开和折叠状态无文字截断。
- [x] 登录、用户、管理员、角色、安全日志和系统状态关键路径通过。
- [x] 关键页面 axe 自动扫描无严重或高影响问题。
- [x] 标准 E2E 与本地浏览器兜底验证结果分项记录。

## 13. 待确认问题

- 无。

## 14. 用户确认记录

- 2026-08-24：用户确认以官方 Ant Design 6、ProComponents 和 Umi Max ProLayout 为唯一标准，并授权修订本计划后直接实施。

## 15. 实施结果

- Umi Max 继续提供唯一 ProLayout；通过官方 Layout Token 实现深色侧栏、浅色顶栏和浅灰工作区，品牌区只渲染一次，账户区和移动端抽屉继续使用官方行为。
- 全局 Ant Design 6 Token 统一为 Blue-7 主色、8px 圆角、36px 控件高度、微灰表头、克制边框与阴影；主色和身份 Tag 已通过 axe 对比度检查。
- `PageFrame` 已改为语义化 H1、`PageContainer` 和单层 `Card`；系统状态改用 `ProDescriptions`，登录页保留官方 Ant Design 工作型表单并完成桌面与移动布局。
- 用户、管理员、角色和三类安全日志表格均已使用受控 `ProTable`，TanStack Query 仍是唯一服务端状态来源；用户搜索支持回车、搜索、重置和刷新。
- 用户、管理员和角色页面移除无依据的固定 `scroll.x` 与固定操作列；管理员窄屏和安全日志真实宽表只在表格内部滚动，页面本身不产生横向溢出。
- 认证、RBAC、CSRF、单飞 Refresh、二次确认、审计、会话、错误传播和全部原有管理操作保持不变。
- Admin typecheck、lint、33 项 Vitest、2 项启动器测试和 production build 通过；覆盖率为语句 `87.50%`、分支 `84.89%`、函数 `81.69%`、行 `91.02%`。
- Playwright CLI 使用契约一致的本地 API 拦截完成 `1920x1080`、`1440x900`、`1280x720`、`768x1024`、`390x844` 五个视口及六个页面验证；27 个页面/视口组合均无 document 级横向溢出，浏览器控制台为 0 error、0 warning。
- axe-core 覆盖桌面与移动端 8 个关键页面/视口，最终为 0 violation；本次没有重复运行依赖 Backend、PostgreSQL 和 Redis 的标准真实跨栈 E2E，浏览器结果仅表述为 Admin 本地契约拦截验收。

## 16. 剩余问题

- 本次未重复执行真实 Backend、PostgreSQL、Redis 跨栈 E2E；后续涉及认证契约或生产链路变化时，仍需按现有跨栈 E2E 门禁重新验证。
