# pinjie-fullstack-base 项目索引

本文件是全项目任务导航和当前事实入口。规则正文以各级 `AGENTS.md` 为准，完整文档清单以 `docs/README.md` 为准，计划格式和生命周期以 `plans/README.md` 为准。

## 项目身份

| 字段 | 当前值 |
| --- | --- |
| 项目角色 | 通用全栈 Monorepo 母版 |
| 派生类型 | 无 |
| 母版基线 | 当前仓库 |
| 当前阶段 | 工程骨架阶段，治理基线和完整项目骨架已入库 |
| 业务范围 | 认证、用户、管理、系统等跨业务通用能力；具体业务进入蓝图或派生仓库 |

## 执行入口

| 路径 | 状态 | 用途 |
| --- | --- | --- |
| `AGENTS.md` | 生效 | 全仓库规则、任务读取顺序、计划保护和交付边界 |
| `apps/backend/AGENTS.md` | 生效 | Backend 分层、事务、数据库、安全和验证规则 |
| `apps/admin/AGENTS.md` | 生效 | Admin 架构、API、Ant Design、状态和验证规则 |
| `apps/web/AGENTS.md` | 生效 | Web 架构、渲染、API、设计、SEO 和验证规则 |
| `.agents/rules/` | 生效 | Antigravity 按范围加载各级 `AGENTS.md` 的桥接规则 |
| `.agents/agents-index.md` | 生效 | 本索引，全项目当前事实和任务导航入口 |
| `plans/README.md` | 生效 | 全栈计划创建、状态、模板、完成和永久保护规则 |
| `docs/PROJECT_REQUIREMENTS.md` | 生效 | 母版目标用户、场景、目标能力、非目标、派生规则和验收基线 |
| `docs/README.md` | 生效 | `docs/` 下全部项目文档的专项索引 |
| `CHANGELOG.md` | 生效 | 已交付但尚未发布的能力和后续版本变化 |

## 当前开发计划

| 范围 | 当前目标 | 计划 | 状态 | 依赖 |
| --- | --- | --- | --- | --- |
| 全栈 | 当前无活动开发计划 | 无 | 无 | 无 |
| Backend | 当前无活动开发计划 | 无 | 无 | 无 |
| Admin | 当前无活动开发计划 | 无 | 无 | 无 |
| Web | 当前无活动开发计划 | 无 | 无 | 无 |
| API Client | 当前无活动开发计划 | 无 | 无 | 无 |
| Database | 当前无活动开发计划 | 无 | 无 | 无 |
| Deployment | 当前无活动开发计划 | 无 | 无 | 无 |
| Documentation | 当前无活动开发计划 | 无 | 无 | 无 |

## 计划文档登记

`plans/` 下每份现存 Markdown 文档都必须在本表登记。计划结束后只更新状态和结果，不删除索引记录。

| 路径 | 状态 | 结果 | 影响范围 | 用途 |
| --- | --- | --- | --- | --- |
| `plans/README.md` | 生效 | 计划规范 | 全仓库 | 定义全栈计划格式、状态、生命周期和保护规则 |
| `plans/2026-08-12_全项目索引与计划治理计划.md` | 已结束 | 已完成 | 全栈治理、文档 | 建立总索引、计划治理和派生项目继承基线 |
| `plans/2026-08-12_产品需求基线建设计划.md` | 已结束 | 已完成 | 全栈产品基线、文档 | 建立母版目标用户、能力范围、非目标和验收基线 |
| `plans/2026-08-12_讨论结论知识沉淀规则计划.md` | 已结束 | 已完成 | 全栈治理、文档 | 建立讨论结论向现有权威文档收敛的规则 |
| `plans/2026-08-12_项目基线入库与Wiki初始化计划.md` | 已结束 | 已完成，Wiki 后续停用 | 全仓库、GitHub Wiki 历史 | 修复环境模板、提交完整项目基线并记录当时的 Wiki 初始化过程 |
| `plans/2026-08-12_GitHub Wiki停用与文档单一来源计划.md` | 已结束 | 已完成 | 全仓库文档治理、GitHub Wiki | 清空并关闭 Wiki，建立 `docs/` 单一来源规则 |
| `plans/2026-08-12_Markdown格式规范统一计划.md` | 已结束 | 已完成 | 全仓库 Markdown、文档治理 | 统一 GFM 语法基线、markdownlint 格式规则和项目级检查命令 |
| `plans/2026-08-12_Git提交追溯规则计划.md` | 已结束 | 已完成 | 全仓库 Git、文档治理 | 明确普通提交和跨系统场景的 Commit SHA 记录边界 |

## 当前系统状态

| 范围 | 当前状态 | 事实依据 |
| --- | --- | --- |
| Backend | 工程骨架，尚无运行源码和测试实现 | `apps/backend/pyproject.toml`、`alembic.ini` 及空的规划目录 |
| Admin | Vite、React、TypeScript 和 Ant Design 配置骨架，尚无页面源码 | `apps/admin/package.json`、`vite.config.ts`、`tsconfig.json` |
| Web | Next.js、React 和 TypeScript 配置骨架，尚无页面源码 | `apps/web/package.json`、`next.config.ts`、`tsconfig.json` |
| API Client | 已建立生成包和占位入口，尚无业务接口 | `packages/api-client/`、根 `openapi.json` |
| Database | 已建立 Alembic 配置和目录，尚无版本迁移 | `apps/backend/alembic.ini`、`apps/backend/alembic/versions/` |
| Deployment | 已有 Compose 与 GitHub Actions 模板，应用 Dockerfile 尚待补充 | `compose.yml`、`compose.prod.yml`、`.github/workflows/` |
| Documentation | 已有产品需求基线、ADR、架构、蓝图、运维索引和全项目治理入口；只使用仓库 `docs/`，GitHub Wiki 已关闭 | `docs/PROJECT_REQUIREMENTS.md`、`docs/README.md`、本索引 |

## 权威来源

| 事项 | 唯一来源 | 维护要求 |
| --- | --- | --- |
| 项目长期规则 | 根和三个应用级 `AGENTS.md` | `.agents/rules/` 只做加载桥接，不复制正文 |
| 全项目当前事实 | `.agents/agents-index.md` | 项目身份、阶段、目录职责、权威来源和计划状态变化时同步 |
| 产品需求基线 | `docs/PROJECT_REQUIREMENTS.md` | 定义母版做什么、为谁服务、明确不做什么和如何验收 |
| 实施计划 | `plans/*.md` | 面向整个 Monorepo；原文、路径和索引永久保留 |
| 计划规范 | `plans/README.md` | 只维护规则和模板，不复制当前进度 |
| 项目文档清单 | `docs/README.md` | 文档新增、移动、用途变化时同步 |
| 项目文档内容 | `docs/` | 唯一文档来源；禁止创建或同步 GitHub Wiki 副本 |
| Markdown 格式规则与检查 | 根 `.markdownlint.json`、`package.json` 的 `lint:md` | GFM 语法基线、统一具体写法及固定版本的全仓库命令行检查 |
| Git 提交与追溯 | Git 历史、根 `AGENTS.md` | 普通提交由 Git 保存精确历史，跨系统记录保存完整 Commit SHA 或不可变 Tag |
| OpenAPI 契约 | 根 `openapi.json` | 由后端导出，禁止手工修改 |
| TypeScript API Client | `packages/api-client/src/` | 由根契约生成，禁止手工修改 |
| Node.js 锁文件 | 根 `pnpm-lock.yaml` | 全仓库唯一，必须随依赖变化同步提交 |
| Python 锁文件 | `apps/backend/uv.lock` | 后端唯一，当前待生成 |
| 数据库结构 | Backend Models 与 `apps/backend/alembic/versions/` | 结构变化必须通过 Alembic 迁移 |
| 已交付变化 | `CHANGELOG.md` | 按版本或 `Unreleased` 记录用户可见和治理变化 |

## 派生项目入口

| 派生方向 | 蓝图入口 | 当前状态 |
| --- | --- | --- |
| Commerce | `docs/blueprints/commerce/README.md` | 已有基础蓝图 |
| CMS | `docs/blueprints/cms/README.md` | 有实际需求时创建 |
| Blog | `docs/blueprints/blog/README.md` | 有实际需求时创建 |
| Corporate Site | `docs/blueprints/corporate-site/README.md` | 有实际需求时创建 |

派生仓库必须在本索引的“项目身份”中记录项目角色、派生类型、母版标签或提交 SHA、当前阶段和业务范围。母版已有计划及其索引记录继续保留，业务扩展使用新的全栈计划承接。

## 维护规则

1. 所有任务开始前先读取本索引，再按执行入口读取相关规则、计划和文档。
2. 新增计划时，同时创建计划原文并加入“当前开发计划”和“计划文档登记”。
3. 计划状态变化时，同一次修改中更新计划原文、本索引和必要的 `CHANGELOG.md`。
4. `plans/` 中已经存在的计划文档不得由 AI 删除、移动、重命名或替换；这些操作只能由用户人工处理。
5. 文档新增、移动或用途变化时更新 `docs/README.md`；只有入口、职责或权威来源变化时才同步本索引。
6. Backend、Admin、Web、API Client、Database、Deployment 或 Documentation 的当前目标变化时，更新“当前开发计划”。
7. 总索引只记录当前事实、路径、状态和一句话用途，不复制规则、计划或专项文档正文。
