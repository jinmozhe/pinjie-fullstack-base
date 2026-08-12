# Pinjie Fullstack Base

> 通用全栈 Monorepo 母版 | FastAPI + Next.js + React + pnpm + Turborepo | 可派生为 CMS、管理平台、电商等业务仓库

通用全栈 Monorepo 项目母版，适用于 CMS、博客、企业站、管理平台、电商等项目的初始化和二次开发。

## 技术栈

- **后端**：FastAPI + SQLAlchemy 2.0 async + PostgreSQL + Redis
- **管理端**：Vite + React + Ant Design 5.x + ProComponents
- **用户端**：Next.js App Router + Tailwind CSS + shadcn/ui
- **共享 SDK**：OpenAPI 自动生成 TypeScript 类型安全请求客户端
- **部署**：Docker + 1Panel OpenResty + GitHub Actions CI/CD

## 快速开始

阅读 `docs/operations/local-dev-environment.md` 了解本地开发环境搭建方式。

母版的目标用户、适用场景、目标能力、非目标和完成验收标准见 [产品需求基线](docs/PROJECT_REQUIREMENTS.md)。

## 项目结构

```text
apps/
  backend/              FastAPI 标准后端（领域驱动架构）
  web/                  C 端用户前端（Next.js）
  admin/                B 端管理前端（Vite + React）

packages/
  api-client/           自动生成的 TypeScript SDK（禁止手改）
  eslint-config/        共享 ESLint 配置
  typescript-config/    共享 TypeScript 配置

.agents/                全项目索引与 Antigravity 规则桥接
docs/                   项目知识库（索引见 docs/README.md）
plans/                  整个 Monorepo 的全栈实施计划

openapi.json            后端导出的 OpenAPI 规范（根目录，前端 SDK 唯一来源）
compose.yml             本地开发用（仅 Redis 容器）
compose.prod.yml        生产部署用（backend/web/admin 三容器）
CHANGELOG.md            已交付能力和版本变化
```

## 项目索引

- 全项目当前事实、三端开发目标和全部计划登记见 [.agents/agents-index.md](.agents/agents-index.md)。
- 母版做什么、服务谁和如何验收见 [docs/PROJECT_REQUIREMENTS.md](docs/PROJECT_REQUIREMENTS.md)。
- `docs/` 下的完整文档清单见 [docs/README.md](docs/README.md)。
- 全栈计划格式和生命周期规则见 [plans/README.md](plans/README.md)。
- 已交付变化见 [CHANGELOG.md](CHANGELOG.md)。

## 开发规范

- 所有任务先读取 `.agents/agents-index.md`，确认当前事实和权威入口
- 新增功能或模块前，在 `plans/` 创建面向整个 Monorepo 的全栈实施计划
- 同一能力涉及 Backend、Admin 和 Web 时，在同一份计划中描述完整链路和联合验证
- 已经存在的计划文档永久保留；删除、移动和重命名只能由用户人工处理
- 修改文档后，同步更新 `docs/README.md` 中对应的索引记录
- 新建或修改 Markdown 后，运行 `pnpm lint:md` 检查全仓库文档格式
- 后端接口变更后，运行 `pnpm generate-api` 更新前端 SDK

## 母版边界

本仓库只包含通用能力，业务领域扩展通过派生仓库实现：

| 应用 | 母版包含 | 派生仓库扩展 |
| --- | --- | --- |
| `backend/domains/` | auth、users、admin、system | products、orders、payment 等 |
| `web/features/` | auth、user | products、cart、checkout 等 |
| `admin/pages/` | login、dashboard、system | products、orders、promotions 等 |

业务扩展参考 `docs/blueprints/` 目录下的蓝图文档。

派生仓库应在 `.agents/agents-index.md` 中登记派生类型、母版标签或提交 SHA、当前阶段和业务范围，并保留母版已有计划及其索引记录。
