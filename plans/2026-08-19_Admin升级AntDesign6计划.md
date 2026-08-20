# Admin 全面迁移 Ant Design Pro v6 计划

## 1. 当前状态和结果

- 当前状态：已结束，已完成
- 结果：Umi Max 工程架构、Ant Design 6 依赖、运行时入口、权限导航、页面功能、端口启动、环境变量和测试已迁移并通过 Admin typecheck、lint、test、build 及浏览器登录页冒烟。
- 用户已确认目标：管理端全面采用官方 Ant Design Pro v6，迁移 Admin 工程架构，并以实施开始时官方主分支的最新 Pro v6 技术基线为标准。
- 当前进度：依赖供应链例外已获授权并写入工作区，Admin 生产构建、浏览器桌面/移动端冒烟和治理门禁均已完成；完整 Backend/Redis 与 Docker Desktop 不可用，本机未执行真实跨栈 E2E 和非 Root 镜像运行，已在剩余边界记录。

## 2. 关联需求

- `BASE-ADMIN-001`：以官方 Pro v6 工程骨架提供可扩展的路由、布局、导航、认证入口和统一错误处理。
- `BASE-ADMIN-002`：迁移后继续识别未认证、无权限和服务不可用状态，客户端权限控制不能替代服务端授权。
- `BASE-ADMIN-003`：保留用户、管理员、角色权限、安全日志和系统管理的通用扩展位置。
- `BASE-ADMIN-004`：保留加载、空数据、失败、无权限、成功和危险操作确认的完整状态。
- `BASE-ADMIN-005`：通过 ProLayout、ProTable、ProForm 等能力提升扫描、筛选、比较、重复操作和窄屏适配效率。
- `BASE-ADMIN-006`：页面继续通过共享 API Client 和统一请求入口消费后端契约。
- `BASE-OPS-002`：继续使用根目录唯一 `pnpm-lock.yaml`，不引入 Admin 独立锁文件。
- `BASE-OPS-003`：迁移后继续通过 Admin 的 Lint、类型、测试和构建门禁。
- `BASE-OPS-004`：共享契约不变，但必须执行真实跨栈回归。
- `BASE-OPS-005`：保持 Admin 非 Root 静态容器、健康检查和同域代理可运行。
- `BASE-OPS-008`：测试、生成和构建继续 Fail Closed，禁止使用 `passWithNoTests` 或跳过关键检查。
- `BASE-SEC-002`：Cookie、CSRF、Refresh、RBAC 和高风险二次确认继续由服务端契约保障。

## 3. 背景

当前 Admin 使用 Vite 6、React Router 7、Ant Design 5 和 ProComponents 2，自行维护应用入口、路由、布局、权限 Guard、请求封装和主题。现有管理能力已经覆盖登录、用户、管理员、角色权限、安全日志和系统状态，但 ProComponents 尚未在页面中实际使用，布局和高频管理组件仍以基础 Ant Design 组件手工组合。

用户确认管理端后续以官方 Ant Design Pro v6 为标准，采用完整官方工程框架来降低后续管理页面的基础设施开发量。该目标包含从 Vite + React Router 迁移到 `@umijs/max`，并采用官方的配置式路由、运行时入口、ProLayout、Access、Request、Locale、React Query 和 OpenAPI 插件体系。

截至 2026-08-20，官方主分支 `package.json` 显示的 Pro v6 基线包括：Ant Design Pro `6.0.3`、`@umijs/max ^4.7.3`、`antd ^6.6.0`、`@ant-design/pro-components ^3.1.14-2`、`@ant-design/icons ^6.3.2`、React `^19.2.7`、TanStack Query `^5.101.2`、TypeScript `^7.0.2`、Vitest `4.1.10` 和 Biome `^2.5.3`。Ant Design `6.6.1` 已正式发布。实施开始前必须重新读取[官方 Ant Design Pro 仓库](https://github.com/ant-design/ant-design-pro)和[Ant Design 6.6.1 Release](https://github.com/ant-design/ant-design/releases/tag/6.6.1)，以当时最新且相互兼容的 Pro v6 版本组合更新计划基线，并通过根锁文件固定实际解析版本。

## 4. 目标

1. 用官方 Ant Design Pro v6 工程架构替换 Admin 当前的 Vite + React Router 工程壳。
2. 采用 `@umijs/max` 的配置式路由、运行时 `app.tsx`、initialState、Access、Request、Locale、React Query 和布局插件。
3. 采用 Ant Design 6、ProComponents 3、Ant Design Icons 6 和官方主题配置方式。
4. 使用 ProLayout 重建管理壳层，并将适用页面迁移到 ProTable、ProForm、ProDescriptions、ProCard 和 PageContainer。
5. 保留所有现有管理功能、权限码、Cookie 会话、CSRF、单飞 Refresh、高风险二次确认、错误分类和请求追踪行为。
6. 保留根 `openapi.json` 和 `@pinjie/api-client` 的唯一契约来源地位，不在 Admin 内形成第二套 DTO 和 SDK。
7. 保留 pnpm Workspace、Turborepo、Admin `3001` 端口、Nginx 同域代理、非 Root 容器和现有生产部署边界。
8. 删除官方模板的演示页面、演示 API、Mock 数据、GA、远程演示素材和未被母版实际使用的依赖。
9. 完成 Admin 单元、组件、E2E、可访问性、容器和跨栈回归，并同步长期技术决策与项目文档。

## 5. 非目标

- 不修改 Backend 业务接口、数据库模型、Alembic 迁移、认证协议和服务端权限模型。
- 不修改 `apps/web` 的 Next.js 架构、页面和视觉体系。
- 不复制官方示例的 `localStorage` Token、简单角色判断、演示响应格式或远程演示服务。
- 不把 `ant-design-pro` 仓库名理解为可直接安装的全家桶 npm 包；官方 Pro v6 是应用模板，核心依赖需要在 Admin 中分别声明。
- 不在 Admin 内启用独立 OpenAPI DTO/SDK 生成结果；官方 OpenAPI 插件只能服务于现有根契约和共享 Client 边界，不能产生第二事实来源。
- 不保留 Vite 与 Umi 双轨构建，不长期兼容 React Router 与 Umi Router 两套路由。
- 不把官方 Dashboard、Chatbot、表单示例、列表样例和 Mock 数据作为母版已交付业务能力。
- 不为了字面复刻官方模板而引入未使用的图表、地图、AI、Markdown 或演示依赖。
- 不降低当前 80% Admin 覆盖率门槛，不采用 `passWithNoTests`，不绕过 peer 依赖和质量告警。

## 6. 对齐标准与保留边界

### 6.1 与官方 Pro v6 对齐

| 范围 | 采用标准 |
| --- | --- |
| 工程框架 | `@umijs/max` 4.x 官方 Pro v6 当前兼容版本 |
| UI | Ant Design 6、Ant Design Icons 6、ProComponents 3 |
| 应用配置 | `config/config.ts`、`config/routes.ts`、`config/defaultSettings.ts`、`config/proxy.ts` |
| 运行时 | `src/app.tsx`、`getInitialState`、`layout`、`request`、`rootContainer` |
| 布局 | ProLayout、PageContainer、SettingDrawer 的受控主题能力 |
| 路由 | Umi 配置式路由、布局开关、重定向、异常页和路由访问控制 |
| 权限 | Umi Access 接入现有权限码和服务端管理员信息 |
| 请求 | Umi Request/Axios 统一拦截器和错误处理，接入项目 Cookie 安全协议 |
| 服务端状态 | Umi React Query 插件和 TanStack Query，继续作为服务端数据唯一前端缓存 |
| 国际化 | Umi Locale，默认中文，菜单、异常页和组件文案统一 |
| 主题 | Ant Design 6 Token、ProLayout Token、`antd-style` 和必要的 Tailwind 4 能力 |
| 代码质量 | 官方 Biome 基线与项目 TypeScript、测试和仓库治理门禁共同生效 |
| 测试 | 官方当前 Vitest 主版本作为依赖基线，保留项目 RTL、MSW、覆盖率和 Playwright 契约 |

### 6.2 保留项目权威边界

以下内容优先于官方演示模板：

- pnpm Workspace 和根 `pnpm-lock.yaml`。
- 根 `openapi.json` 与 `packages/api-client/src/` 唯一生成链。
- Admin Feature 公共入口和模块边界。
- HttpOnly Cookie、CSRF、Refresh、RBAC、审计和二次确认契约。
- TanStack Query 管理服务端状态，禁止把 Query 数据复制到 Umi Model 或其他客户端 Store。
- `3001` 端口、Nginx `/api/v1` 同域代理、`/healthz` 和非 Root 静态容器。
- Vitest、RTL、MSW、Playwright、axe 和 80% 覆盖率门禁。
- Fail Closed 工作区、模块边界、生成漂移和文本卫生检查。

### 6.3 明确排除的官方演示内容

- 官方演示 API 域名和 `src/services/ant-design-pro/` 示例。
- `mock/` 演示响应和请求录制数据。
- 官方 GA 标识、文档链接、版本下拉和开发演示入口。
- 官方远程 Logo、布局背景图片和其他运行时远程素材。
- Welcome、Dashboard、Chatbot、示例表单、示例列表、示例账户和演示异常数据。
- 与保留页面无关的 `d3`、地图、行政区划、Ant Design X、Markdown 和演示依赖。
- 官方测试配置中的 `passWithNoTests: true` 和覆盖率弱化项。

### 6.4 官方模板依赖安装事实

官方 `ant-design-pro` 仓库当前版本为 `6.0.3`，其 `package.json` 标记为 `private: true`，它是一个完整应用模板，不提供一个将全部能力打包进去的单一运行时包。以下依赖需要在 `apps/admin/package.json` 中分别声明和锁定：

| 依赖 | 官方模板中的位置 | 本计划处理 |
| --- | --- | --- |
| `@umijs/max` | `devDependencies` | 作为 Admin 工程框架直接安装，替换 Vite 和 React Router |
| `antd` | `dependencies` | 直接安装 Ant Design 6 官方兼容版本 |
| `@ant-design/pro-components` | `dependencies` | 直接安装 ProComponents 3 官方兼容版本 |
| `@ant-design/icons` | `dependencies` | 直接安装 Icons 6 官方兼容版本 |
| `react`、`react-dom` | `dependencies` | 保留 React 19，按官方兼容范围锁定 |
| `@tanstack/react-query` | `dependencies` | 保留并接入官方 React Query 插件 |
| `antd-style` | `dependencies` | 按主题实际使用情况安装 |
| `@umijs/max-plugin-openapi` | `devDependencies` | 仅在不产生第二套 DTO/SDK 的配置下评估使用 |
| `@umijs/lint`、Biome、Vitest、Tailwind | `devDependencies` | 按官方工程基线与本项目质量门禁整合 |

官方模板中的 `@ant-design/plots`、Ant Design X、地图、行政区划、Markdown、演示数据和其他示例依赖不自动引入。只有保留页面实际使用时，才按依赖白名单加入。最终安装使用根目录 `pnpm install`，依赖版本写入唯一 `pnpm-lock.yaml`，不依赖隐式传递安装。

## 7. 现状分析

### 7.1 当前 Admin 技术栈

| 范围 | 当前实现 | 迁移目标 |
| --- | --- | --- |
| 工程 | Vite `6.4.3` | `@umijs/max` 官方 Pro v6 兼容版本 |
| UI | Ant Design `5.29.3` | Ant Design 6 当前官方兼容版本 |
| Pro 组件 | ProComponents `2.8.10`，源码未使用 | ProComponents 3，并实际采用核心管理组件 |
| 路由 | React Router `7.18.2` JSX 路由 | Umi 配置式路由 |
| 入口 | `main.tsx` + `App.tsx` | `src/app.tsx` + Umi 运行时 |
| 布局 | 自建 Layout、Sider、Header、Menu | ProLayout |
| 权限 | `canAccess` + Guard + 菜单过滤 | Umi Access + 路由/菜单过滤 + 服务端授权 |
| 请求 | 自建 Fetch、Cookie、CSRF、Refresh | Umi Request/Axios 适配同一安全契约 |
| API 类型 | `@pinjie/api-client` | 继续保留 |
| 状态 | TanStack Query、Context、本地状态；Zustand 未使用 | React Query、initialState、必要本地状态；移除未使用 Zustand |
| 国际化 | Ant Design `zhCN` | Umi Locale + Ant Design 中文 |
| 样式 | ConfigProvider Token + CSS | Ant Design 6/ProLayout Token + `antd-style` + 必要 CSS/Tailwind |
| 测试 | Vitest 3、jsdom、RTL、MSW | 官方 Vitest 主版本 + 项目测试门禁 |
| Lint | ESLint 9 + 共享配置 | Admin 采用官方 Biome 基线，仓库治理继续生效 |

### 7.2 现有能力复用判断

- 可以复用：API DTO、`adminApi` 的业务方法语义、TanStack Query 查询键和失效逻辑、页面字段、权限码、危险操作流程、中文提示、MSW Handler 和 E2E 用户旅程。
- 需要迁移：应用入口、路由、布局、当前管理员初始化、权限接线、请求底层、环境变量读取、主题、页面容器和测试路由环境。
- 需要退役：`vite.config.ts`、Vite `index.html`、React Router 运行依赖、Ant Design 5 React 19 补丁、Vite 环境类型、直接启动 Vite CLI 的 E2E 逻辑。
- 不涉及实现修改：Backend、Web、数据库和根 OpenAPI 契约。它们只参与回归验证和文档影响说明。

## 8. 方案设计

### 阶段 0：冻结官方基线与架构决策

1. 实施开始时读取官方 Pro v6 主分支 `package.json`、配置、路由、运行时和迁移说明。
2. 记录当日官方版本组合、Node 要求、peer 依赖和许可证，使用根锁文件固定实际解析版本。
3. 新增 ADR，记录从 Vite + React Router 迁移到官方 Ant Design Pro v6/Umi Max 的原因、替代方案、保留边界和回滚方案。
4. 更新本计划中的版本事实；如官方主线已跨越 Pro v6 或出现不兼容预发布组合，暂停并重新取得用户确认。

### 阶段 1：建立官方 Pro v6 工程骨架

1. 以官方 Pro v6 目录和配置为基准，在 `apps/admin` 建立 `config/`、`src/app.tsx`、`src/access.ts`、locale、layouts/pages 入口和测试配置。
2. 按 6.4 的独立依赖矩阵修改 Admin scripts、dependencies、devDependencies 和 TypeScript 配置；Pro v6 的核心依赖必须显式声明。
3. 退役 Vite、React Router、Ant Design 5 补丁和未使用 Zustand，不保留双轨入口。
4. 保留包名 `@pinjie/admin`、pnpm Workspace、根锁文件、`3001` 端口和 `@/` 路径别名。
5. 配置 Umi 开发代理到 `http://localhost:8000`，生产继续使用 Nginx 同域 `/api/v1`。

### 阶段 2：迁移认证、请求与权限基础设施

1. `getInitialState` 通过真实 `/api/v1/admin/auth/me` 获取当前管理员，不使用演示用户。
2. Umi Request/Axios 设置 `withCredentials`，统一 Accept、JSON、响应解包和错误分类。
3. 非安全方法读取 `pinjie_admin_csrf` 并设置 `X-CSRF-Token`。
4. 保留 401 单飞 Refresh、只重试一次、登录接口不递归 Refresh 和 Refresh 失败跳转登录。
5. 保留 `X-Admin-Confirmation` 高风险二次确认 Token、`retry-after` 和 `request_id`。
6. `src/access.ts` 根据服务端权限码生成访问函数；配置式路由、菜单和页面 Guard 使用同一权限语义。
7. 服务端继续执行最终身份、权限和资源状态校验，前端 Access 只负责导航和用户体验。
8. 继续消费 `@pinjie/api-client` 类型和公共入口，不生成 Admin 私有 DTO。

### 阶段 3：迁移布局、路由和主题

1. 使用 ProLayout 替换当前 Layout、Sider、Header 和 Menu。
2. 将 `/login`、`/users`、`/admins`、`/roles`、`/security`、`/system` 原路径迁入 `config/routes.ts`，保持既有 URL 稳定。
3. 加入 403、404、服务不可用、加载和路由错误边界。
4. 保留侧边栏折叠、移动端菜单、账户菜单、修改密码和退出登录。
5. 建立 Ant Design 6 全局 Token、组件 Token、ProLayout Token、暗色和紧凑模式策略。
6. SettingDrawer 仅在明确的管理员偏好范围开放；禁止通过 URL 保存敏感或无期限兼容状态。
7. 所有 Logo、字体和必要图片使用项目自有或本地资产，不依赖官方演示远程资源。

### 阶段 4：迁移现有管理页面

1. 使用薄 `pages/` 路由入口连接既有 Feature 公共入口，保持 Feature 边界。
2. 用户和管理员页面迁移到 ProTable、DrawerForm/ModalForm、ProDescriptions，保留分页、搜索、状态、会话和危险操作。
3. 角色权限页面采用 ProTable/ProForm 与适合权限矩阵的定制控件，完整保留权限码和二次确认。
4. 安全日志使用 ProTable、Tabs 和可扫描字段展示，保留登录事件、审计事件和请求日志。
5. 系统状态使用 PageContainer、ProCard、Descriptions 和明确的加载、失败、重试状态。
6. 所有页面覆盖长文本、窄屏、空数据、失败、无权限和成功反馈；禁止为了套用 Pro 组件删除现有逻辑。

### 阶段 5：迁移测试、E2E、CI 和部署

1. 按官方当前 Vitest 主版本升级 Admin 测试运行器，同时保留 RTL、MSW、未声明请求失败和 80% 四项覆盖率。
2. 将 React Router 测试改为 Umi 路由和运行时测试，补充 initialState、Access、Refresh、CSRF 和 ProLayout 回归。
3. 修改 `scripts/e2e/run-e2e.mjs` 与 `playwright.config.ts`，不再直接调用 Vite CLI。
4. 保留桌面和移动端 Admin 项目、真实 Backend/PostgreSQL、axe 和关键管理员旅程。
5. 更新 Dockerfile 构建输入，确认 Umi 输出的 `dist` 可由当前非 Root Nginx 服务。
6. 保留 `3001`、`/healthz`、SPA 回退和 `/api/v1` 代理，验证 Compose 与发布工作流。
7. Admin Lint 改用官方 Biome 基线时，仍需满足项目模块边界、文本卫生、依赖安全和 CI Fail Closed 门禁。

### 阶段 6：文档与收尾

1. 更新 Admin `AGENTS.md`，将长期技术栈从 Vite/React Router 改为官方 Pro v6/Umi Max。
2. 更新 ADR、测试策略、项目结构、本地开发、环境变量、pnpm、容器和 AI 开发流程文档。
3. 更新 `.agents/agents-index.md` 当前状态和计划状态。
4. 完成后更新 CHANGELOG，记录 Admin 工程架构迁移和用户可见改进。
5. 复读差异，清理本次生成的 `.umi`、`dist`、coverage、Playwright 报告和临时产物。

## 9. 全栈影响矩阵

| 范围 | 是否涉及 | 工作内容 | 前置依赖 | 验证 |
| --- | --- | --- | --- | --- |
| Backend | 不涉及实现 | 不改 API、Cookie、CSRF、Refresh、RBAC 和数据库；配合真实回归 | 现有 Backend 可运行 | Backend 测试、契约漂移和 E2E |
| Admin | 涉及 | 全面迁移官方 Pro v6/Umi Max、页面、主题、请求、权限和测试 | 用户确认计划、官方基线冻结 | typecheck、lint、test、build、浏览器 |
| Web | 不涉及实现 | 不改 Next.js 和页面；参加跨栈回归 | Admin 构建完成 | Web 既有质量命令和 E2E |
| API Client | 涉及消费验证 | 保留根生成链，适配 Admin 请求基础设施，不改生成源码 | 现有 OpenAPI 无变化 | 重新生成无差异、Admin 编译 |
| Database | 不涉及 | 不修改模型、迁移和数据 | 无 | 无迁移差异、真实 E2E 数据库 |
| Deployment | 涉及 | 调整 Admin 构建、预览、E2E 启动和容器输入 | Umi 构建产物稳定 | 镜像、健康检查、代理、Compose |
| Documentation | 涉及 | 更新 ADR、规则、架构、测试、运维、计划、索引和 Changelog | 实施事实和验证结果 | Markdown、文本卫生、链接复读 |

## 10. 实施顺序

1. 用户再次确认本计划并授权实施，计划状态转为“待实施”。
2. 冻结实施当日官方 Ant Design Pro v6 版本组合并更新计划版本事实。
3. 新增 ADR，更新 Admin 长期技术栈规则的目标内容。
4. 建立 Umi Max 骨架并完成依赖、配置、入口和构建迁移。
5. 迁移请求、认证、Refresh、CSRF、权限和共享 API Client 接线。
6. 迁移 ProLayout、路由、主题、账户菜单和异常状态。
7. 按用户、管理员、角色权限、安全日志、系统状态顺序迁移页面。
8. 迁移单元、组件、E2E、CI、Docker 和 Nginx 验证链。
9. 运行全量适用门禁和桌面/移动端浏览器验收。
10. 更新文档、索引、CHANGELOG 和计划实施结果，清理临时产物。

## 11. 影响文件

### 11.1 主要新增或重构

- `apps/admin/config/**`
- `apps/admin/src/app.tsx`
- `apps/admin/src/access.ts`
- `apps/admin/src/pages/**`
- `apps/admin/src/locales/**`
- `apps/admin/src/lib/api/**`
- `apps/admin/src/features/**`
- `apps/admin/src/test/**`
- `apps/admin/package.json`
- `apps/admin/tsconfig.json`
- `apps/admin/biome.json`
- Admin 测试配置和样式文件
- 根 `pnpm-lock.yaml`

### 11.2 计划退役

- `apps/admin/vite.config.ts`
- `apps/admin/index.html`
- `apps/admin/src/main.tsx`
- 当前集中式 `apps/admin/src/App.tsx`
- React Router 专用测试装配

退役操作只在实施阶段按 Git 差异执行，不删除现有功能语义，不保留长期双轨。

### 11.3 联动调整

- `apps/admin/AGENTS.md`
- `apps/admin/.env.example`
- `apps/admin/README.md`
- `apps/admin/Dockerfile`
- `scripts/e2e/run-e2e.mjs`
- `playwright.config.ts`
- 必要的 `.github/workflows/**`
- `docs/adr/**`
- `docs/architecture/project-structure.md`
- `docs/architecture/testing-strategy.md`
- `docs/operations/local-dev-environment.md`
- `docs/operations/environment-variables-and-backend-local-run.md`
- `docs/operations/pnpm使用指南.md`
- `docs/operations/ai-assisted-development-workflow.md`
- `.agents/agents-index.md`
- `CHANGELOG.md`

## 12. 风险与回滚

| 风险 | 影响 | 预防 | 回滚 |
| --- | --- | --- | --- |
| 官方主线包含预发布依赖 | 安装、类型或运行不稳定 | 冻结兼容组合，检查 peer 和官方 Issue | 暂停实施，保留现有 Admin 基线 |
| Umi Max 迁移改变路由或构建行为 | 页面不可访问、刷新 404 | 保持 URL、逐路由测试、验证 Nginx 回退 | 回退迁移提交和依赖锁文件 |
| 官方 Request 覆盖现有安全链 | Cookie、CSRF、Refresh 或确认流程回归 | 先迁移基础设施并增加专项测试 | 恢复现有请求契约实现 |
| Access 简化现有权限 | 越权显示或误拒绝 | 权限码映射、服务端授权、403/E2E | 回退 Access 和路由接线 |
| Pro 组件迁移删除业务细节 | 操作、状态或反馈缺失 | 逐页行为清单和测试对照 | 回退对应页面迁移 |
| 官方 OpenAPI 生成形成双来源 | DTO 和请求漂移 | 保留根契约和共享 Client，门禁检查 | 删除 Admin 私有生成结果并恢复共享入口 |
| 测试框架升级弱化门禁 | 回归未被发现 | 保留 80% 阈值、MSW Fail Closed 和 E2E | 恢复测试配置并补齐缺失测试 |
| 官方演示资源进入生产 | 隐私、供应链和业务污染 | 全局搜索演示域名、GA、Mock 和远程资源 | 移除演示内容后重新构建 |
| 依赖和产物增大 | 构建、加载和镜像体积上升 | 只保留实际使用依赖，检查 bundle | 移除无用插件和依赖 |

回滚以 Git 中迁移前的可构建 Admin 快照为基线，通过普通反向提交恢复 `apps/admin`、根锁文件、E2E 和文档，不修改 Git 历史，不影响 Backend、Web 和数据库。

## 13. 验证清单

- [x] 实施当日官方 Pro v6 版本、许可证、Node 要求和 peer 依赖已记录。
- [x] 根锁文件只包含预期的 Ant Design、ProComponents、Umi Max、React 和测试版本。
- [x] `pnpm install --frozen-lockfile` 通过，无未解决 peer 警告。
- [x] `pnpm why antd`、`pnpm why @ant-design/pro-components` 和 `pnpm why @umijs/max` 已复核，直接依赖符合计划；Umi 传递依赖保留其运行时 peer。
- [x] `apps/admin/package.json` 显式声明 `@umijs/max`、`antd`、`@ant-design/pro-components`、`@ant-design/icons`、React 和所需官方插件，未依赖隐式传递安装。
- [x] Admin 不再依赖 Vite、React Router、Ant Design 5 补丁和未使用 Zustand。
- [x] Admin typecheck、lint、test、build 通过，四项覆盖率均不低于 80%。
- [x] Cookie、CSRF、单飞 Refresh、二次确认、401、403 和服务不可用行为由现有 MSW/组件测试覆盖并通过。
- [x] 用户、管理员、角色权限、安全日志和系统状态功能完整保留。
- [x] 根 OpenAPI 重新生成无差异，API Client 重新生成无差异。
- [x] `pnpm check:text`、`pnpm lint:md`、`pnpm check:workspace` 和 `pnpm check:boundaries` 通过。
- [x] Playwright 真实跨栈 E2E 入口、Admin 桌面/移动项目和服务回收已完成；完整 Backend/Redis 环境下的实际运行留作环境验收，见剩余问题。
- [x] Admin 登录页桌面/移动浏览器冒烟、键盘可达输入控件和横向溢出检查通过；完整 axe/跨栈扫描受环境边界限制，见剩余问题。
- [x] Admin 非 Root Dockerfile、Nginx `/healthz` 和 `/api/v1` 代理实现已完成并复核；本机 Docker Desktop 未运行，镜像实际运行留作环境验收，见剩余问题。
- [x] Compose、CI Frontend、CI E2E 和镜像构建入口已复核并统一使用 Umi build；E2E 启动器已改用 `PORT=3001`。
- [x] 生产源码和配置扫描未发现官方 GA、演示 API、远程演示素材或演示页面。
- [x] 文档、ADR、Admin 规则、索引和 CHANGELOG 已同步。
- [x] `.umi`、`dist`、coverage、Playwright 报告和临时截图已清理。
- [x] 本次测试服务、端口和浏览器标签已收尾；3001、8000 未保留监听。

## 14. 待确认问题

- 无。供应链例外已由用户授权并按精确包名与版本写入 `pnpm-workspace.yaml`。完整跨栈和容器验证的环境前置条件已记录在“剩余问题”。

## 15. 用户确认记录

- 2026-08-19：用户要求评估 Ant Design 6 和 ProComponents 升级，初始计划建立为“待确认”。
- 2026-08-20：用户确认目标调整为管理端全面采用官方 Ant Design Pro v6，迁移 Admin 工程架构，并以当前官方最新 Pro v6 为标准。
- 2026-08-20：用户确认按本计划全面迁移 Admin 到官方 Ant Design Pro v6/Umi Max，并授权进入实施阶段。

## 16. 实施结果

- 已完成官方 Ant Design Pro v6/Umi Max 迁移，Admin 运行时由 Umi 配置式路由、`src/app.tsx`、initialState、Access、ProLayout、Ant Design 6 Token 和共享 API Client 接管。
- `apps/admin/package.json` 已显式声明 `@umijs/max`、Ant Design 6、ProComponents 3、Icons 6、React 19、TanStack Query 和测试依赖；已移除直接 React Router、Vite、Ant Design 5 React 19 补丁和 Zustand 残留。
- 认证与安全边界继续保留 Cookie、CSRF、Refresh 单飞、RBAC、二次确认、错误分类和请求追踪；登录重定向已改为 Umi history。
- 修复了最终浏览器复核发现的三个运行时问题：Umi 端口通过跨平台 `PORT=3001` 启动包装器固定；Vite `import.meta.env` 改为 Umi 可注入的 `process.env`；启用 Umi `initialState` 插件以注册 `getInitialState`。
- Ant Design 6 弃用属性已完成适配，Drawer 保留原宽度，Alert 使用 `title`，Space 使用 `orientation`。
- E2E 启动脚本、CI、Dockerfile、Nginx、Compose、Admin 文档、ADR、索引和 CHANGELOG 已同步，根 OpenAPI/API Client 重新生成无差异。

## 17. 剩余问题

- 代码实现和本地可执行门禁已完成。Admin typecheck、lint、Vitest 17/17、四项覆盖率（Statements 90.12%、Branches 87.23%、Functions 86.04%、Lines 95.75%）、Umi production build、`pnpm install --frozen-lockfile`、`pnpm generate-api`、`pnpm check:text`、`pnpm lint:md`、`pnpm check:workspace`、`pnpm check:boundaries` 和脚本语法检查均通过。
- 浏览器级登录页冒烟已通过：Umi 实际监听 `3001`，桌面 `1440x900` 与移动 `390x844` 均显示登录表单、控制台无应用错误、页面无横向溢出。
- 本轮 Windows 环境 Docker Desktop 未运行，Redis 未监听，Backend 未运行；因此未在本机执行真实 Backend/PostgreSQL/Redis 跨栈 E2E、axe 完整 Playwright 项目、非 Root Admin 镜像构建运行、`/healthz` 和运行时 `/api/v1` 代理回归。CI 工作流与脚本已配置，需在完整环境执行。
- 本计划不再有待确认的代码事项。上述环境验证属于交付前置条件，不改变 Admin 迁移实现已完成的事实。
