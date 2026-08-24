# Admin 项目规则

## 作用范围与技术栈

- 本文件适用于 `apps/admin/**`，并继承仓库根 `AGENTS.md`。
- Admin 是 B 端管理工具，采用官方 Ant Design Pro v6 的 Umi Max、React、TypeScript、Ant Design 6、ProComponents、TanStack Query 技术体系。路由、布局、权限和运行时配置由 Umi Max 管理。
- 禁止为了统一 Web 端视觉而替换 Ant Design 或 ProComponents。界面应紧凑、稳定、工作导向，优先支持扫描、筛选、比较和重复操作。

## 目录与状态边界

- `config/routes.ts` 负责配置式路由；当前路由页面位于 `src/features/<feature>/*Page.tsx`，Feature 内聚页面、组件、Hook 和领域适配。`src/components/` 放跨页面组件，`src/lib/` 放 HTTP、导航等基础设施。
- 页面和 Feature 不得直接调用原始 `fetch`、拼接底层请求或重复处理响应结构。`src/lib/api/http.ts` 是唯一传输层，统一处理 Cookie 会话、CSRF、单飞 Refresh、响应解包、错误分类、登录失效和二次确认头；不得引入 Umi Request 或另一套客户端形成并行请求管道。
- 服务端数据、缓存和请求状态由 TanStack Query 管理。Zustand 只保存真正的客户端状态，禁止复制 Query 数据形成双份事实来源。
- 临时弹窗、表单和草稿优先使用组件本地状态。Zustand 不保存 Token、Cookie 内容和其他敏感凭据；浏览器认证边界遵守 `docs/architecture/authentication-authorization.md`。
- Web 与 Admin 禁止直接互相引用。共享类型和请求能力只能通过 `@pinjie/api-client` 等 `packages/` 公共包进入。
- Feature 只能通过明确公共入口协作，不得导入其他 Feature 的内部组件、Hook、Store 或请求实现。完整边界见 `docs/architecture/module-boundaries.md`。

## API 与类型

- `@pinjie/api-client` 是 OpenAPI 生成类型的唯一来源；当前领域端点由 `src/lib/api/admin.ts` 基于项目 HTTP 管道封装。页面层只消费生成类型和解包后的业务数据，禁止手工复制 OpenAPI 已提供的 DTO，禁止生成或维护第二套 SDK、DTO 或契约副本。
- API 契约变化时，先更新后端并导出根 `openapi.json`，再从根目录运行 `pnpm generate-api`，最后适配 Admin。
- 破坏性契约变化必须在同一全栈计划中完成消费者迁移或建立有删除期限的受控迁移窗口，禁止在页面长期维护新旧响应分支。
- `packages/api-client/src/` 是生成目录，禁止手工修改。
- 避免 `any`、非空断言和无依据的类型转换；外部输入必须在边界处校验或收窄。

## UI 与交互

- 优先使用 Ant Design 和 ProComponents 的现有组件、表单、表格、反馈和主题能力，避免重复实现基础控件；`ProTable`、`ModalForm` 和 `DrawerForm` 适用于标准场景，但不强制用于复杂工作流、特殊交互或有明确性能约束的页面。
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

- 路由、布局、运行时生命周期和客户端 Access 只通过 `@umijs/max`、Umi 配置与插件公开入口使用。禁止直接声明、接管或绕过 Umi 管理的 React Router、Bundler、Babel、esbuild 和运行时内部依赖，禁止通过 override 强制升级到 Umi 尚未支持的主版本；精确内部版本只属于当前锁文件事实，不写成永久规则。
- Admin Access 只负责路由、菜单和控件的客户端体验，不是安全边界；所有授权、二次确认和审计仍由 Backend 最终执行。
- Admin 开发服务使用 `scripts/run-umi.mjs` 通过 `HOST=127.0.0.1`、`PORT=3001` 启动；底层 Umi Webpack host 补丁必须保留。不要使用 `max dev --port` 替代项目脚本；直接调用 Umi 时必须从 `apps/admin` 目录运行并显式绑定 `127.0.0.1`。
- Umi 的 `process.env.VITE_API_URL`、`initialState: {}` 和生成目录清理是运行时约束；不得在浏览器代码中直接使用 Vite 的 `import.meta.env`，不得提交 `src/.umi` 或 `src/.umi-production`。详细排障见 `docs/operations/admin-local-development-and-validation-troubleshooting.md`。

## 依赖准入

- Umi、React、Ant Design、ProComponents 和官方插件只能按官方兼容组合升级；所有升级继续遵守根锁文件、七天冷却、安装脚本白名单、专项计划和受影响范围验证。
- 安全 override 仅用于范围明确且有依赖链证据的兼容修复，并必须执行完整 Admin 与适用跨栈回归。没有兼容修复版本的 Medium 或 Low 上游风险按 `SECURITY.md` 建立限时风险接受，不得伪装为已修复。
- 当前 Admin 只允许 Umi 默认 Webpack 构建链。移除 Vite 4 的精确 pnpm Hook、两个 Umi 补丁和依赖自检门禁必须同时保留；升级 Umi 或重新启用 Vite bundler 前必须创建专项计划，证明上游稳定组合已消除已知 High 漏洞并完成全量回归。
- 母版只接收跨业务复用且有明确需求的外围能力。图表、富文本、Excel 和其他具体业务依赖默认由派生仓库按真实需求引入，不以“业务依赖自由升级”为准入理由。

详细目录、请求、组件选择和依赖分层见 `docs/architecture/admin-engineering-standard.md`。
