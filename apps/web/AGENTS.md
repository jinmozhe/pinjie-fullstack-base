# Web 项目规则

## 作用范围与技术栈

- 本文件适用于 `apps/web/**`，并继承仓库根 `AGENTS.md`。
- Web 是 C 端用户应用，采用 Next.js App Router、React、TypeScript、Tailwind CSS、TanStack Query 和 Zustand。
- 新增定制 UI 时以 shadcn/ui 为组件标准、Radix UI 为无样式交互底层、项目设计 tokens 控制视觉、lucide-react 提供图标。新增依赖前先确认仓库现状并更新 workspace 锁文件。

## 目录与渲染边界

- `src/app/` 保持薄路由，只承载路由、布局、Metadata、数据入口和错误边界；领域 UI、Hooks、请求封装和状态进入 `src/features/<domain>/`。
- 跨领域基础组件放 `src/components/`，通用基础设施放 `src/lib/`，客户端状态放 `src/stores/`。Web 与 Admin 禁止直接互相引用。
- Feature 只能通过明确公共入口协作，不得导入其他 Feature 的内部组件、Hook、Store 或请求实现。完整边界见 `docs/architecture/module-boundaries.md`。
- 默认使用 Server Components。仅在需要浏览器 API、事件处理、本地交互状态或客户端数据订阅时添加 `"use client"`，并把客户端边界压到最小。
- 服务端数据和缓存由 Server Components 或 TanStack Query 管理。Zustand 只保存真正的客户端状态，禁止复制服务端数据。
- 临时交互状态优先使用组件本地状态。Zustand 不保存 Token、Cookie 内容和其他敏感凭据；缓存新鲜度按数据语义设置，不用全局固定值代替领域判断。

## API、SSR 与 SEO

- 通过 `@pinjie/api-client` 使用后端契约，页面层消费解包后的业务数据。禁止手工修改生成客户端或重复定义 OpenAPI DTO。
- 服务端请求使用仅服务端可见的后端地址，浏览器请求只使用公开地址。`NEXT_PUBLIC_` 变量会进入客户端产物，严禁保存密钥。
- 浏览器认证优先使用具备 `HttpOnly`、`Secure` 和合适 `SameSite` 属性的 Cookie，并设计 CSRF 防护。Token 禁止进入 `localStorage`、Zustand、URL 和页面源码。
- 需要收录的页面必须提供准确的静态或动态 Metadata、语义化标题、canonical 和必要的结构化数据，并保持 SSR 首屏内容可用。
- `next.config.ts` 保持 `output: "standalone"`，满足生产容器部署。容器部署默认不依赖进程内 ISR 缓存；需要增量缓存时先设计共享缓存和失效策略。

## UI 与可访问性

- 先维护颜色、间距、字体、圆角、阴影等设计 tokens，再扩展基础组件和页面，避免页面内散落任意值。
- 使用语义化 HTML、键盘可操作控件、可见焦点、正确标签和足够对比度。图标按钮必须有可访问名称或 Tooltip。
- 页面必须覆盖加载、空数据、失败和成功反馈。移动端与桌面端均不得出现横向溢出、文字遮挡、卡片套卡片和失控布局。
- 避免一屏只有宣传文案。首屏优先提供目标用户可直接使用的真实体验，并保持与派生业务定位一致。

## 验证

- 从仓库根目录运行 `pnpm --filter @pinjie/web typecheck`、`pnpm --filter @pinjie/web lint` 和 `pnpm --filter @pinjie/web build`。
- 阶段 B 采用 Vitest、React Testing Library、jsdom 和 MSW 作为单元与组件测试栈，并使用 Playwright 执行真实浏览器跨栈 E2E；关键页面通过 axe 自动扫描可访问性。异步 Server Component 和跨 Server、Client 边界行为由 Playwright 覆盖，详细分层遵守 `docs/architecture/testing-strategy.md`。
- 测试框架和 `test` 脚本落地后，功能改动必须运行相关单元、组件和适用的跨栈测试；当前尚未配置时应明确说明该缺口，不得表述为测试通过。
- 应用出现入口但缺少测试脚本或必要测试时属于 `partial`，仓库门禁必须失败，禁止退回空骨架规避检查。
- UI 改动必须做桌面和移动端浏览器验证，检查首页可见性、关键区块、交互状态和 `document` 横向溢出。
- Windows 下启动开发服务时优先使用稳定的短会话或直接调用 Next CLI。结束验证后核对端口和 PID，只停止本次启动的 Next、Playwright 或浏览器测试进程。
