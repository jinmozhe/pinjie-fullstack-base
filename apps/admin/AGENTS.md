# Admin 项目规则

## 作用范围与技术栈

- 本文件适用于 `apps/admin/**`，并继承仓库根 `AGENTS.md`。
- Admin 是 B 端管理工具，保留 Vite、React、TypeScript、React Router、Ant Design、ProComponents、TanStack Query 和 Zustand 技术体系。
- 禁止为了统一 Web 端视觉而替换 Ant Design 或 ProComponents。界面应紧凑、稳定、工作导向，优先支持扫描、筛选、比较和重复操作。

## 目录与状态边界

- `src/pages/` 负责路由页面和页面级编排，`src/components/` 放跨页面组件，`src/hooks/` 放可复用行为，`src/stores/` 放客户端状态，`src/lib/` 放 HTTP 等基础设施。
- 页面不得直接拼接底层请求和重复处理响应结构。HTTP 客户端统一处理认证头、响应解包、错误分类和登录失效。
- 服务端数据、缓存和请求状态由 TanStack Query 管理。Zustand 只保存真正的客户端状态，禁止复制 Query 数据形成双份事实来源。
- Web 与 Admin 禁止直接互相引用。共享类型和请求能力只能通过 `@pinjie/api-client` 等 `packages/` 公共包进入。

## API 与类型

- 页面层优先消费 `@pinjie/api-client` 生成类型和解包后的业务数据，禁止手工复制 OpenAPI 已提供的 DTO。
- API 契约变化时，先更新后端并导出根 `openapi.json`，再从根目录运行 `pnpm generate-api`，最后适配 Admin。
- `packages/api-client/src/` 是生成目录，禁止手工修改。
- 避免 `any`、非空断言和无依据的类型转换；外部输入必须在边界处校验或收窄。

## UI 与交互

- 优先使用 Ant Design 和 ProComponents 的现有组件、表单、表格、反馈和主题能力，避免重复实现基础控件。
- 操作按钮使用 Ant Design 图标并提供明确文本或 Tooltip；危险操作必须有清晰确认和错误反馈。
- 页面状态至少覆盖加载、空数据、失败、无权限和成功反馈。表格与表单需处理窄屏、长文本和溢出。
- 不使用营销页式巨型标题、装饰性卡片堆叠、夸张圆角、重阴影或花哨动效。

## 验证

- 从仓库根目录运行 `pnpm --filter @pinjie/admin typecheck`、`pnpm --filter @pinjie/admin lint` 和 `pnpm --filter @pinjie/admin build`。
- 新增测试框架和 `test` 脚本后，功能改动必须运行相关单元测试；当前没有测试脚本时应明确说明该缺口。
- 涉及页面和样式时检查桌面与移动端视口、关键流程、文字和横向溢出。浏览器验证只清理本次启动的服务、进程和标签。
