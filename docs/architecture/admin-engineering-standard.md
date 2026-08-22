# Admin 工程实施标准

## 目标与权威关系

本文定义 `apps/admin` 在 Ant Design Pro v6/Umi Max 体系内的具体实施方式，适用于页面、Feature、请求、状态、组件和依赖变更。长期强制红线以 `apps/admin/AGENTS.md` 为准，采用 Umi Max 的技术取舍以 [ADR 0011](../adr/0011-Admin采用AntDesignProV6与UmiMax决策.md) 为准；认证授权、模块边界和测试语义继续分别以 [认证授权架构](authentication-authorization.md)、[模块边界](module-boundaries.md)和[测试策略](testing-strategy.md)为准。

本标准不固定 Umi 内部依赖的精确版本，也不要求所有页面使用同一种 ProComponents 高阶组件。

## 框架与项目边界

| 能力 | 权威所有者 | 实施要求 |
| --- | --- | --- |
| 路由、布局、运行时生命周期 | Umi Max | 使用 `config/routes.ts`、`src/app.tsx` 和 `@umijs/max` 公共入口 |
| 客户端 Access | Umi Max + 项目权限映射 | 用于路由、菜单和控件显隐，不代替服务端授权 |
| UI 与主题 | Ant Design、ProComponents | 优先使用兼容组件，按交互和性能选择抽象层级 |
| OpenAPI 类型 | `@pinjie/api-client` | 由根契约生成，禁止复制 DTO 或生成第二套契约 |
| HTTP 传输 | `src/lib/api/http.ts` | 唯一处理 Cookie、CSRF、Refresh、错误和二次确认头的传输层 |
| 领域 API | `src/lib/api/admin.ts` 或 Feature 公开适配层 | 封装端点和领域语义，不在页面拼接底层请求 |
| 服务端状态 | TanStack Query | 管理请求生命周期、缓存、失效和刷新 |
| 最终授权与审计 | Backend | 客户端隐藏、禁用和确认不能替代服务端判定 |

Umi 管理的 React Router、Bundler、Babel、esbuild 和运行时内部依赖不得由应用直接接管。需要扩展时先使用 Umi 配置或插件公共契约；需要升级时采用 Umi 官方支持的兼容组合，不能把某个内部主版本写成永久项目规则。

## 目录与 Feature

- `config/routes.ts` 是路由和菜单结构入口，路由组件指向对应 Feature 的页面导出。
- `src/app.tsx` 负责 Query Provider、`getInitialState`、Layout 和运行时级错误边界等全局装配。
- `src/access.ts` 从 initialState 派生客户端访问能力，不发明服务端没有的权限。
- `src/features/<feature>/` 内聚路由页面、局部组件、Hook、测试和领域适配；当前路由页面命名为 `*Page.tsx`。
- `src/components/` 只放跨页面复用的管理端组件，`src/lib/` 只放无业务页面所有权的基础设施。
- Feature 之间只通过公开入口或共享基础设施协作，禁止导入其他 Feature 内部实现。

新增页面时，先登记配置式路由和所需 Access，再在对应 Feature 内完成页面编排。不得另建独立 React Router、第二套 Layout 或绕过 `app.tsx` 的应用入口。

## Access 与服务端授权

`src/access.ts` 的职责是改善管理端体验：控制菜单、路由和按钮是否可见或可操作。它不能证明请求有权执行，也不能阻止绕过浏览器直接调用 API。

所有受保护操作必须由 Backend RBAC 最终判定。危险操作继续使用项目二次确认头和服务端审计；客户端确认弹窗只负责明确用户意图。权限加载失败时不得猜测或放宽权限，应进入明确失败、无权限或重新登录状态。

## 数据、请求与状态

请求链保持单向：

```text
Page / Feature -> domain API -> http.ts -> Backend
                         |           |
                         |           +-- Cookie、CSRF、单飞 Refresh、错误解包、二次确认头
                         +-- @pinjie/api-client 生成 DTO
```

- 页面和组件不直接调用原始 `fetch`，不自行刷新 Token，不重复解析统一响应结构。
- `@pinjie/api-client` 当前提供生成 DTO；领域 API 通过项目 HTTP 管道调用端点。未来若启用生成 SDK，必须证明不会形成第二套传输、安全或 DTO 来源，并纳入全栈计划。
- TanStack Query 保存服务端数据和请求状态。Mutation 成功后按领域键精确失效或更新缓存，失败必须显示可操作错误。
- 组件本地状态用于弹窗、表单、选择和短期草稿。只有真正跨页面且不属于服务端事实的状态才评估 Store。
- Token、Cookie 内容、Refresh 状态和其他敏感凭据不得进入 `localStorage`、Store 或客户端可读持久化存储。

## UI 组件选择

| 场景 | 优先选择 | 允许调整的条件 |
| --- | --- | --- |
| 标准查询、分页、排序和列配置 CRUD | `ProTable` | 特殊虚拟化、复杂单元格交互或性能证据可改用 Ant Design Table |
| 标准新增或编辑表单 | `ModalForm` 或 `DrawerForm` | 多阶段流程、跨步骤草稿、复杂焦点或独立路由可使用 Form 与页面编排 |
| 简单详情和键值信息 | ProDescriptions 或 Ant Design Descriptions | 大量自定义布局时使用语义化组合组件 |
| 基础反馈、导航和输入 | Ant Design 组件 | 仅在现有组件无法满足明确契约时增加项目组件 |

ProComponents 是提高标准管理场景效率的首选，不是形式上的强制。选择较低层组件时必须保持统一的加载、空数据、失败、无权限、成功反馈、分页和可访问性行为，不能借此复制基础控件或破坏设计一致性。

管理端保持紧凑、可扫描和适合重复操作。表格、表单和抽屉需处理长文本、窄屏和横向溢出；危险操作必须有清晰文案、确认、Loading 和失败恢复。图标按钮使用 Ant Design Icons，并为不熟悉的图标提供 Tooltip。

## 依赖治理

| 依赖层级 | 示例 | 准入与升级规则 |
| --- | --- | --- |
| Umi 内部核心 | React Router、Bundler、Babel、esbuild | 不直接声明或接管；随 Umi 官方兼容组合和锁文件解析 |
| 官方兼容栈 | `@umijs/max`、React、Ant Design、ProComponents、官方插件 | 按兼容矩阵升级，形成计划并完成 Admin 与适用跨栈回归 |
| 业务中立外围能力 | 查询、验证、可访问性或通用工具 | 有明确跨业务复用需求、无现有能力重复且通过供应链评审后引入 |
| 具体业务依赖 | 图表、富文本、Excel、地图、支付或行业 SDK | 默认由真实业务计划或派生仓库引入，不进入通用母版基线 |

所有新解析继续受根 `pnpm-lock.yaml`、七天冷却、安装脚本白名单和供应链门禁约束。范围化安全 override 必须记录依赖链、受影响范围、兼容依据和回归结果；无兼容修复版本的 Medium 或 Low 风险按 `SECURITY.md` 建立限时风险接受。不得通过强制升级框架内部主版本、关闭审计或永久 override 换取表面无告警。

## 验证要求

变更按风险运行最小充分检查。Admin 源码或依赖变化至少执行：

```powershell
pnpm --filter @pinjie/admin typecheck
pnpm --filter @pinjie/admin lint
pnpm --filter @pinjie/admin test
pnpm --filter @pinjie/admin build
```

路由、插件、认证、请求或依赖变化还需执行适用的浏览器冒烟和真实跨栈 E2E，并分别记录结果。规则和架构变化执行：

```powershell
pnpm lint:md
pnpm check:workspace
pnpm check:boundaries
pnpm check:governance
```

Mock、局部组件测试和浏览器冒烟不得表述为真实跨栈验证。Umi 启动、缓存和 Windows 进程排障见 [Admin 本地运行与验证排障手册](../operations/admin-local-development-and-validation-troubleshooting.md)。
