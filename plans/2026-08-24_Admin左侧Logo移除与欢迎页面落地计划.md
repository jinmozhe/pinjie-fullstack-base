# Admin 左侧 Logo 移除与欢迎页面落地计划

## 当前状态和结果

- 状态：已结束
- 结果：已完成

## 关联需求

- BASE-011（管理控制台操作界面与交互体验）

## 背景

用户要求移除侧栏顶部 Logo 区域，使菜单从顶部直接展示，并在菜单首位增加欢迎页面作为管理员登录后的默认主页。欢迎页用于呈现母版技术栈、架构特性和管理快捷入口。

## 目标

1. 在 ProLayout 中关闭侧栏 Logo 和 Logo 占位。
2. 新增 `/welcome` 页面并放在菜单首位。
3. 将根路径、通配路径和登录成功后的默认跳转统一到 `/welcome`。
4. 补充欢迎页组件测试并完成 Admin 全量验证。

## 非目标

1. 不修改 Backend 接口契约。
2. 不修改既有管理功能的业务逻辑和安全边界。

## 现状分析

1. `apps/admin/src/app.tsx` 原先渲染侧栏品牌区域。
2. `apps/admin/config/routes.ts` 原先将根路径重定向到 `/users`。
3. `apps/admin/src/features/auth/LoginPage.tsx` 原先在登录成功后跳转到 `/users`。
4. Admin 缺少独立的欢迎主页。

## 方案设计

### 1. 路由与默认跳转

- 在 `routes.ts` 中增加 `/welcome` 路由和 `HomeOutlined` 菜单图标。
- 将 `/`、`*` 和登录成功后的默认地址统一为 `/welcome`。

### 2. Logo 移除

- 在 `app.tsx` 中设置 `logo: false` 和 `menuHeaderRender: false`，移除侧栏顶部占位。

### 3. 欢迎页面

- 使用 `PageFrame`、`ProCard`、Ant Design Grid、Typography 和 Tag 构建欢迎页。
- 展示当前管理员、母版架构特性和用户、管理员、安全日志、系统状态快捷入口。
- 保持 8px 圆角、响应式网格和现有浅色 Token 体系。

## 全栈影响矩阵

| 范围 | 是否涉及 | 工作内容 | 前置依赖 | 验证 |
| --- | --- | --- | --- | --- |
| Backend | 不涉及 | 无接口变动 | 无 | 无 |
| Admin | 涉及 | 移除 Logo、新增 WelcomePage、调整路由和登录跳转 | Ant Design 6 与 ProComponents | Vitest、typecheck、lint、build |
| Web | 不涉及 | 用户端不受影响 | 无 | 无 |
| API Client | 不涉及 | 契约不变 | 无 | 无 |
| Database | 不涉及 | 无数据表变动 | 无 | 无 |
| Deployment | 不涉及 | 构建方式不变 | 无 | 无 |
| Documentation | 涉及 | 同步计划、索引和 Changelog | 无 | `pnpm lint:md` |

## 实施顺序

1. 创建 `apps/admin/src/features/welcome/WelcomePage.tsx`。
2. 更新 `apps/admin/config/routes.ts`。
3. 更新 `apps/admin/src/app.tsx` 移除侧栏 Logo。
4. 更新 `apps/admin/src/features/auth/LoginPage.tsx`。
5. 增加 WelcomePage 测试并更新登录跳转断言。
6. 同步计划、索引和 Changelog。

## 影响文件

- `apps/admin/config/routes.ts`
- `apps/admin/src/app.tsx`
- `apps/admin/src/features/auth/LoginPage.tsx`
- `apps/admin/src/features/auth/index.ts`
- `apps/admin/src/features/welcome/WelcomePage.tsx`
- `apps/admin/src/features/welcome/WelcomePage.test.tsx`
- `apps/admin/src/features/StageC.test.tsx`
- `.agents/agents-index.md`
- `CHANGELOG.md`

## 风险与回滚

- 风险：默认路由变化会影响登录跳转断言和未知路径回退行为。
- 控制：补充欢迎页渲染、快捷入口和登录跳转测试，运行 Admin 全量验证。
- 回滚：通过本计划对应 Git 提交恢复相关路由、页面和测试文件。

## 验证清单

- [x] `pnpm --filter @pinjie/admin typecheck` 通过
- [x] `pnpm --filter @pinjie/admin lint` 通过
- [x] `pnpm --filter @pinjie/admin test` 通过，6 个测试套件共 36 项测试通过
- [x] `pnpm --filter @pinjie/admin build` 通过
- [x] `pnpm lint:md` 通过
- [x] `pnpm check:governance` 通过

## 待确认问题

无。

## 用户确认记录

- 2026-08-24：用户要求移除左侧 Logo，并在菜单首位增加欢迎页面作为默认主页。

## 实施结果

1. 已通过 `logo: false` 和 `menuHeaderRender: false` 移除侧栏 Logo 及占位。
2. 已新增 `/welcome` 欢迎页，展示母版架构、核心模块和快捷入口。
3. 已将根路径、通配路径和登录成功后的默认跳转统一到 `/welcome`。
4. 已增加 WelcomePage 组件测试，Admin 共 36 项测试通过。

## 剩余问题

无。
