# Admin 项目规则

## 作用范围与技术栈

- 本文件适用于 `apps/admin/**`，并继承仓库根 `AGENTS.md`。
- Admin 是 B 端管理工具，采用官方 Ant Design Pro v6 的 Umi Max、React、TypeScript、Ant Design 6、ProComponents、TanStack Query 技术体系。路由、布局、权限和运行时配置由 Umi Max 管理。
- 禁止为了统一 Web 端视觉而替换 Ant Design 或 ProComponents。界面应紧凑、稳定、工作导向，优先支持扫描、筛选、比较和重复操作。

## 目录与状态边界

- `src/pages/` 负责路由页面和页面级编排，`src/components/` 放跨页面组件，`src/hooks/` 放可复用行为，`src/stores/` 放客户端状态，`src/lib/` 放 HTTP 等基础设施。
- 页面不得直接拼接底层请求和重复处理响应结构。HTTP 客户端统一处理认证头、响应解包、错误分类和登录失效。
- 服务端数据、缓存和请求状态由 TanStack Query 管理。Zustand 只保存真正的客户端状态，禁止复制 Query 数据形成双份事实来源。
- 临时弹窗、表单和草稿优先使用组件本地状态。Zustand 不保存 Token、Cookie 内容和其他敏感凭据；浏览器认证边界遵守 `docs/architecture/authentication-authorization.md`。
- Web 与 Admin 禁止直接互相引用。共享类型和请求能力只能通过 `@pinjie/api-client` 等 `packages/` 公共包进入。
- Feature 只能通过明确公共入口协作，不得导入其他 Feature 的内部组件、Hook、Store 或请求实现。完整边界见 `docs/architecture/module-boundaries.md`。

## API 与类型

- 页面层优先消费 `@pinjie/api-client` 生成类型和解包后的业务数据，禁止手工复制 OpenAPI 已提供的 DTO。
- API 契约变化时，先更新后端并导出根 `openapi.json`，再从根目录运行 `pnpm generate-api`，最后适配 Admin。
- 破坏性契约变化必须在同一全栈计划中完成消费者迁移或建立有删除期限的受控迁移窗口，禁止在页面长期维护新旧响应分支。
- `packages/api-client/src/` 是生成目录，禁止手工修改。
- 避免 `any`、非空断言和无依据的类型转换；外部输入必须在边界处校验或收窄。

## UI 与交互

- 优先使用 Ant Design 和 ProComponents 的现有组件、表单、表格、反馈和主题能力，避免重复实现基础控件。
- 操作按钮使用 Ant Design 图标并提供明确文本或 Tooltip；危险操作必须有清晰确认和错误反馈。
- 页面状态至少覆盖加载、空数据、失败、无权限和成功反馈。表格与表单需处理窄屏、长文本和溢出。
- 不使用营销页式巨型标题、装饰性卡片堆叠、夸张圆角、重阴影或花哨动效。

## 验证

- 从仓库根目录运行 `pnpm --filter @pinjie/admin typecheck`、`pnpm --filter @pinjie/admin lint` 和 `pnpm --filter @pinjie/admin build`。
- Admin 采用 Vitest、React Testing Library、jsdom 和 MSW 作为单元与组件测试栈，并使用 Playwright 执行真实浏览器跨栈 E2E；关键页面通过 axe 自动扫描可访问性。详细分层遵守 `docs/architecture/testing-strategy.md`。
- 测试框架和 `test` 脚本落地后，功能改动必须运行相关单元、组件和适用的跨栈测试；当前尚未配置时应明确说明该缺口，不得表述为测试通过。
- 应用出现入口但缺少测试脚本或必要测试时属于 `partial`，仓库门禁必须失败，禁止退回空骨架规避检查。
- 涉及页面和样式时检查桌面与移动端视口、关键流程、文字和横向溢出。浏览器验证只清理本次启动的服务、进程和标签。

## Umi 运行专项

- Admin 开发服务使用 `scripts/run-umi.mjs` 通过 `PORT=3001` 启动；不要使用 `max dev --port` 替代项目脚本。直接调用 Umi 时必须从 `apps/admin` 目录运行。
- Umi 的 `process.env.VITE_API_URL`、`initialState: {}` 和生成目录清理是运行时约束；不得在浏览器代码中直接使用 Vite 的 `import.meta.env`，不得提交 `src/.umi` 或 `src/.umi-production`。详细排障见 `docs/operations/admin-local-development-and-validation-troubleshooting.md`。
