# 仓库文件结构说明

> 文档归属：`docs/architecture/project-structure.md`
> 适用仓库：`pinjie-fullstack-base`
> 最后更新：2026-08-13

---

## 一、完整目录树

```text
pinjie-fullstack-base/
│
├── AGENTS.md                           ← 全仓库 AI 规则正文
├── .agents/
│   ├── agents-index.md                 ← 全项目当前事实、任务导航和计划永久登记
│   └── rules/                          ← Antigravity 规则桥接，不复制正文
│       ├── 00-repository.md            ← Always On：引用根 AGENTS.md
│       ├── 10-backend.md               ← Glob apps/backend/**
│       ├── 20-admin.md                 ← Glob apps/admin/**
│       └── 30-web.md                   ← Glob apps/web/**
│
├── apps/
│   ├── backend/                       ← FastAPI 标准后端
│   │   ├── AGENTS.md                  ← 后端专属 AI 规则正文
│   │   ├── app/
│   │   │   ├── api/                   ← 全局依赖注入辅助 (deps.py)
│   │   │   ├── core/                  ← 跨领域基础设施
│   │   │   │   └── (config, response, exceptions, middleware,
│   │   │   │      audit, security, cache_keys, rate_limit)
│   │   │   ├── db/
│   │   │   │   ├── models/            ← SQLAlchemy 模型基类
│   │   │   │   ├── session.py         ← async session 工厂
│   │   │   │   └── base.py            ← 模型导入聚合（供 Alembic 使用）
│   │   │   ├── domains/               ← 高内聚领域模块（通用母版范围）
│   │   │   │   ├── auth/              ← 认证领域
│   │   │   │   ├── users/             ← C 端用户领域
│   │   │   │   ├── admin/             ← B 端 RBAC
│   │   │   │   └── system/            ← 系统工具领域
│   │   │   ├── services/              ← 跨领域编排 Workflows
│   │   │   ├── utils/                 ← 通用工具函数
│   │   │   └── api_router.py          ← 统一路由挂载入口
│   │   ├── alembic/
│   │   │   └── versions/              ← Alembic 迁移版本文件
│   │   ├── scripts/                   ← 种子数据与维护脚本
│   │   ├── tests/                     ← Pytest 自动化测试
│   │   ├── alembic.ini                ← Alembic 迁移工具配置
│   │   ├── pyproject.toml             ← Python 项目元数据、依赖、工具配置
│   │   ├── uv.lock                    ← Python 依赖精确锁文件（待生成）
│   │   ├── Dockerfile                 ← 多阶段构建（待补充）
│   │   ├── .env.example               ← 后端环境变量模板
│   │   └── README.md
│   │
│   ├── web/                           ← C 端用户前端（Next.js App Router）
│   │   ├── AGENTS.md                  ← Web 专属 AI 规则正文
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/            ← 认证路由组
│   │   │   │   └── (user)/            ← 用户中心路由组
│   │   │   ├── features/
│   │   │   │   ├── auth/              ← 认证业务切片
│   │   │   │   └── user/              ← 用户业务切片
│   │   │   ├── components/            ← 跨领域公共 UI 原子组件
│   │   │   ├── hooks/                 ← 通用工具 Hooks
│   │   │   ├── stores/                ← Zustand 客户端状态
│   │   │   ├── lib/                   ← 前端基础设施（http.ts 拦截解包）
│   │   │   └── types/                 ← 本地补充类型定义
│   │   ├── public/                    ← 静态资源
│   │   ├── next.config.ts             ← Next.js 配置（locked: output standalone）
│   │   ├── tailwind.config.ts         ← Tailwind CSS 配置（待补充）
│   │   ├── tsconfig.json              ← 继承 @pinjie/typescript-config/nextjs
│   │   ├── eslint.config.mjs          ← 继承 @pinjie/eslint-config + Next.js 规则
│   │   ├── package.json               ← 前端依赖（包名 @pinjie/web）
│   │   ├── Dockerfile                 ← standalone 模式生产镜像（待补充）
│   │   ├── .env.example               ← Web 环境变量模板
│   │   └── README.md
│   │
│   └── admin/                         ← B 端管理前端（Vite + React + Ant Design）
│       ├── AGENTS.md                  ← Admin 专属 AI 规则正文
│       ├── src/
│       │   ├── pages/
│       │   │   ├── login/
│       │   │   ├── dashboard/
│       │   │   └── system/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── stores/
│       │   └── lib/
│       ├── vite.config.ts             ← Vite 配置（端口 3001，路径别名 @）
│       ├── tsconfig.json              ← 继承 @pinjie/typescript-config/vite
│       ├── eslint.config.mjs          ← 继承 @pinjie/eslint-config
│       ├── package.json               ← 前端依赖（包名 @pinjie/admin）
│       ├── Dockerfile                 ← 生产镜像（待补充）
│       ├── .env.example               ← Admin 环境变量模板
│       └── README.md
│
├── packages/
│   ├── api-client/
│   │   ├── src/index.ts               ← 自动生成入口（禁止手改）
│   │   └── package.json              ← 包名 @pinjie/api-client
│   ├── eslint-config/
│   │   ├── index.js                   ← 共享 ESLint 规则定义
│   │   └── package.json              ← 包名 @pinjie/eslint-config
│   └── typescript-config/
│       ├── base.json                  ← 通用基础配置（strict 等）
│       ├── nextjs.json                ← Next.js 继承配置
│       ├── vite.json                  ← Vite 继承配置
│       └── package.json              ← 包名 @pinjie/typescript-config
│
├── docs/
│   ├── PROJECT_REQUIREMENTS.md         ← 母版产品需求权威基线
│   ├── adr/
│   │   ├── 0001-全栈Monorepo架构决策.md
│   │   ├── 0002-Codex与Antigravity指令兼容决策.md
│   │   ├── 0003-本地开发环境架构决策.md
│   │   ├── 0004-全项目索引与计划生命周期决策.md
│   │   ├── 0005-GitHub Wiki停用与文档单一来源决策.md
│   │   ├── 0006-模块化单体与领域依赖边界决策.md
│   │   ├── 0007-受控迁移兼容策略决策.md
│   │   └── 0008-不可变发布与生产追溯决策.md
│   ├── architecture/
│   │   ├── project-structure.md        ← 本文件
│   │   ├── backend-engineering-standard.md
│   │   │                                ← Backend 具体实施标准与专题文档引用入口
│   │   ├── module-boundaries.md
│   │   ├── error-model.md
│   │   ├── authentication-authorization.md
│   │   ├── testing-strategy.md
│   │   └── observability-reliability.md
│   ├── blueprints/
│   │   └── commerce/README.md
│   └── operations/
│       ├── local-dev-environment.md    ← Windows 本地开发主手册
│       ├── environment-variables-and-backend-local-run.md
│       │                                ← 环境变量分层与 Backend 本地运行手册
│       ├── ai-assisted-development-workflow.md
│       │                                ← AI 助手规则读取与完整开发链路指南
│       ├── uv使用指南.md               ← Python 环境与依赖管理指南
│       ├── pnpm使用指南.md             ← 前端 workspace 包管理指南
│       ├── release-and-rollback.md
│       ├── database-backup-restore.md
│       └── incident-response.md
│
├── plans/
│   ├── README.md                       ← 全栈计划格式、状态、完成和保护规则
│   └── YYYY-MM-DD_全栈目标计划.md       ← 面向整个 Monorepo 的实施计划
│
├── .github/workflows/
│   ├── ci-backend.yml
│   ├── ci-frontend.yml
│   ├── ci-governance.yml
│   ├── security.yml
│   ├── publish-images.yml
│   └── deploy-production.yml
├── scripts/ci/                         ← 三态、模块边界、文本和门禁自测脚本
├── SECURITY.md                         ← 漏洞报告和安全响应规则
├── .editorconfig                       ← 编辑器文本格式基线
├── .gitattributes                      ← Git 文本换行与二进制属性
│
├── openapi.json                       ← 后端导出的 OpenAPI 规范（根目录）
├── pnpm-workspace.yaml                ← Monorepo workspace 配置
├── pnpm-lock.yaml                     ← 全仓库唯一依赖锁文件（pnpm install 生成）
├── package.json                       ← 根 package（全局脚本）
├── compose.yml                        ← 本地开发用（仅 Redis）
├── compose.prod.yml                   ← 生产部署用（三容器）
├── .env.example                       ← 三个完整不可变镜像引用模板
├── .gitignore
├── CHANGELOG.md                        ← 已交付能力和版本变化
└── README.md
```

---

## 二、工程文件设计说明

### 为什么同时存在 `AGENTS.md` 和 `.agents/rules/`

四份 `AGENTS.md` 是项目规则的唯一正文来源：根文件定义全局规则，三个应用文件只补充各自技术栈和目录边界。

`.agents/rules/` 只负责让 Antigravity 按 Workspace Rules 机制加载这些正文。`00-repository.md` 无 frontmatter，作为无条件规则；三个应用桥接文件使用 `trigger: glob` 和对应目录模式。桥接文件通过相对路径 `@` 引用 `AGENTS.md`，不复制规则内容。

本仓库不创建项目级 `GEMINI.md` 或 `.agents/AGENTS.md`，防止出现多份规则正文。完整决策见 `docs/adr/0002-Codex与Antigravity指令兼容决策.md`。

### 为什么建立 `.agents/agents-index.md`

`.agents/agents-index.md` 是全项目任务导航和当前事实入口，记录项目身份、Backend、Admin、Web 及跨栈范围的当前目标、全部计划登记、系统状态、权威来源和派生项目入口。

它不保存规则正文，也不替代 `docs/README.md` 或 `plans/README.md`：

- 各级 `AGENTS.md` 保存长期执行规则。
- `.agents/agents-index.md` 保存全项目当前事实和任务路由。
- `docs/PROJECT_REQUIREMENTS.md` 保存目标用户、目标能力、非目标和验收边界。
- `docs/README.md` 保存 `docs/` 的完整文档清单。
- `plans/README.md` 保存计划格式和生命周期规则。
- `plans/*.md` 保存全栈实施方案和结果。
- `CHANGELOG.md` 保存已经交付的变化。

派生仓库继承本索引，并更新项目角色、派生类型、母版标签或提交 SHA、当前阶段和业务范围。完整决策见 `docs/adr/0004-全项目索引与计划生命周期决策.md`。

### 为什么 `PROJECT_REQUIREMENTS.md` 直接放在 `docs/`

当前只有一份产品需求基线，直接使用 `docs/PROJECT_REQUIREMENTS.md` 可以保持入口短且稳定，不为单一文件提前创建 `docs/product/` 目录。

该文件定义母版服务谁、解决什么问题、目标能力、非目标、派生规则和验收条件。技术选型理由继续由 ADR 承担，当前实现状态由全项目索引承担，具体实施步骤由 `plans/` 承担。未来出现至少三份职责独立的产品文档时，再通过人工评审决定是否新增 `docs/product/`；不得为整理目录而自动移动现有 PRD。

### 为什么 `plans/` 保持扁平

`plans/` 属于整个全栈 Monorepo，计划以完整业务能力或工程目标为单位。涉及 Backend、Admin、Web、API Client 或 Database 的同一能力在同一份计划中描述完整链路、实施顺序、契约同步和联合验证。

计划文件直接放在 `plans/` 下，不创建 `active/`、`archive/` 或按应用拆分的子目录。稳定路径能够保证长期引用有效。已经存在的计划文档及其总索引记录永久保留，AI 不得删除、移动、重命名、替换或自动归档；相关文件操作只能由用户人工处理。

### 为什么 `.env.example` 分四层

| 层级 | 文件位置 | 存放内容 | 使用者 |
| --- | --- | --- | --- |
| 部署层 | 根目录 `.env.example` | `BACKEND_IMAGE`、`WEB_IMAGE`、`ADMIN_IMAGE` 的完整 digest 引用 | `compose.prod.yml`、生产部署工作流 |
| 后端层 | `apps/backend/.env.example` | `DATABASE_URL`、`SECRET_KEY`、`REDIS_URL` | uvicorn 进程 |
| Web 层 | `apps/web/.env.example` | `NEXT_PUBLIC_API_URL`、`BACKEND_URL` | Next.js 构建和运行时 |
| Admin 层 | `apps/admin/.env.example` | `VITE_API_URL` | Vite 构建时注入 |

各层只声明自己负责的变量。生产 Compose 从根 `.env` 读取镜像引用，从 `apps/backend/.env` 向 Backend 容器注入运行配置。Web 与 Admin 的生产变量尚未接入 Compose，需要在阶段 B 结合 Dockerfile、构建参数和运行方式确认。根模板不保存 GitHub Environment 变量和 Secret，`DEPLOY_PATH`、部署开关与 SSH 凭据只在受保护的 `production` Environment 中配置。详细操作见[环境变量分层与 Backend 本地运行手册](../operations/environment-variables-and-backend-local-run.md)。分层原因：

- 后端和前端的环境变量格式不同（Python `os.environ` vs Next.js `NEXT_PUBLIC_` 前缀 vs Vite `VITE_` 前缀）
- 开发者进入某个应用目录工作时，能直接看到该应用需要哪些变量，不需要翻根目录的大文件
- 生产部署时，部署镜像选择与应用运行配置具有独立边界，只有 Compose 明确声明的变量才进入对应容器

---

### 为什么 `pnpm-lock.yaml` 放根目录

pnpm workspace 模式下，所有 workspace 成员（`apps/*` 和 `packages/*`）的依赖统一由根目录的 pnpm 管理。`pnpm install` 执行后只会在根目录生成一份 `pnpm-lock.yaml`，其中锁定了所有应用的所有依赖版本。

当前运行基线为 Node.js 24 及以上受支持版本，根 `packageManager` 固定 pnpm 11.17.0，CI 与本地开发必须保持一致。版本升级需要同时验证锁文件、生成工具和三个应用构建。

根 `pnpm-workspace.yaml` 通过 `allowBuilds` 显式批准 `esbuild` 和 `sharp` 的依赖构建脚本。新增条目需要评审包来源、脚本行为和构建必要性，未登记的依赖安装脚本默认不执行。

好处：

- 一份锁文件，避免不同应用对同一库锁定不同版本
- CI 只需要 `pnpm install` 一条命令，无需进入各子目录分别安装
- `node_modules` 通过 symlink 共享，减少磁盘占用

后端的 `uv.lock` 在 `apps/backend/` 目录下，因为 Python 和 Node.js 是两个完全独立的生态，uv 只管 Python 依赖，pnpm 只管 JavaScript 依赖，两者不共享。

---

### 为什么 `eslint.config.mjs` 在各应用但规则在 `packages/`

`packages/eslint-config/index.js` 定义**共享规则**（TypeScript 严格性、命名规范等），两个前端应用共同遵守。

各应用的 `eslint.config.mjs` 在共享规则基础上追加**框架特定规则**：

```text
apps/web/eslint.config.mjs
  └── 引用 @pinjie/eslint-config（共享规则）
  └── 追加 next/core-web-vitals（Next.js 规则）

apps/admin/eslint.config.mjs
  └── 引用 @pinjie/eslint-config（共享规则）
  └── 追加 React 特定规则（待补充）
```

类比 `tsconfig.json` 的继承关系：`packages/typescript-config` 定义基础，各应用继承后按需扩展。

---

### 为什么 `next.config.ts` 锁定 `output: "standalone"`

Next.js 有三种输出模式：

- 默认模式：需要 Node.js 服务器 + 完整的 `node_modules`，不适合容器化
- `export` 模式：纯静态 HTML，不支持 SSR 和 API Route，功能受限
- `standalone` 模式：只打包实际用到的文件，容器镜像体积最小，支持完整 SSR

生产部署走 Docker 容器，必须用 `standalone` 模式。在 `next.config.ts` 里写死，防止将来有人误改。

---

### 为什么 `openapi.json` 在根目录而不在 `docs/`

`openapi.json` 是后端脚本自动生成的**机器可读构建产物**，消费者是 `pnpm generate-api` 脚本（生成 `packages/api-client/src/`），不是给人阅读的文档。

放根目录原因：

- 路径最短，SDK 生成命令引用 `../../openapi.json` 而不是 `../../docs/openapi.json`
- 和 `package.json`、`pnpm-workspace.yaml` 同级，语义上是根目录级别的全局产物
- `docs/` 目录应只存放给人读的 Markdown 文档，不混入机器产物

---

## 三、关键边界规则

### 母版通用范围

| 应用 | 母版包含 | 派生仓库扩展 |
| --- | --- | --- |
| `backend/domains/` | auth、users、admin、system | products、orders、payment 等 |
| `web/features/` | auth、user | products、cart、checkout 等 |
| `admin/pages/` | login、dashboard、system | products、orders、promotions 等 |

### 前端共享边界

- `apps/web` 和 `apps/admin` 禁止直接互相引用
- 共享只通过 `packages/` 下三个包进行：`@pinjie/api-client`、`@pinjie/eslint-config`、`@pinjie/typescript-config`

### openapi.json 生成链路

```text
后端代码 → 运行导出脚本 → 根目录 openapi.json（禁止手改）
                                    ↓
                   pnpm generate-api（@hey-api/openapi-ts）
                                    ↓
                   packages/api-client/src/（自动生成，禁止手改）
                                    ↓
                   apps/web 和 apps/admin 引用 @pinjie/api-client
```

---

## 四、文件命名规范

| 类型 | 规范 | 示例 |
| --- | --- | --- |
| ADR 文档 | 四位数字前缀 + 连字符 | `0001-全栈Monorepo架构决策.md` |
| 实施计划 | 日期前缀 + 全栈目标名 | `2026-08-12_CMS内容发布链路计划.md` |
| 架构文档 | 连字符命名 | `authentication-protocol.md` |
| 运维手册 | 中文主题名或连字符英文名 + 功能描述 | `uv使用指南.md`、`1panel-production-runbook.md` |
| 蓝图文档 | 蓝图目录下 README.md 为入口 | `blueprints/commerce/README.md` |

---

## 五、docs/ 目录规划说明

当前 `docs/` 只创建了有实际内容的文档，以下是各目录的扩展方向：

| 目录 | 当前文件 | 待补充文档 |
| --- | --- | --- |
| `docs/` | `PROJECT_REQUIREMENTS.md`、`README.md` | 产品文档达到至少三份且职责独立时再评估 `docs/product/` |
| `docs/adr/` | `0001` 至 `0008` 架构决策记录 | 每次重大技术决策时新增 |
| `docs/architecture/` | 项目结构、Backend 工程标准、模块边界、错误、认证授权、测试和可靠性文档 | 运行机制形成后就地更新对应文档 |
| `docs/blueprints/commerce/` | `README.md` | `domain-model.md`、`checkout-workflow.md` |
| `docs/blueprints/cms/` | 空（待补充） | 当 CMS 业务需要时创建 |
| `docs/blueprints/blog/` | 空（待补充） | 当博客业务需要时创建 |
| `docs/operations/` | AI 助手开发、本地环境、依赖管理、发布回滚、备份恢复和事故响应手册 | `1panel-production-runbook.md` |

**空目录策略**：`blueprints/cms/`、`blueprints/blog/`、`blueprints/corporate-site/` 目前没有内容，Git 不追踪空目录，不会占用仓库空间，等实际需要时再建文件。不提前创建占位文件，避免维护空文档。
