# pinjie-fullstack-base 项目索引

本文件是全项目任务导航和当前事实入口。规则正文以各级 `AGENTS.md` 为准，完整文档清单以 `docs/README.md` 为准，计划格式和生命周期以 `plans/README.md` 为准。

## 项目身份

| 字段 | 当前值 |
| --- | --- |
| 项目角色 | 通用全栈 Monorepo 母版 |
| 派生类型 | 无 |
| 母版基线 | 当前仓库 |
| 当前阶段 | 阶段 C 通用业务核心能力已完成；阶段 B 的真实 PostgreSQL、Redis、镜像构建与跨栈 E2E 已补验，仍保留发布级镜像摘要和容器运行验收项 |
| 业务范围 | 认证、用户、管理、系统等跨业务通用能力；具体业务进入蓝图或派生仓库 |

## 执行入口

| 路径 | 状态 | 用途 |
| --- | --- | --- |
| `AGENTS.md` | 生效 | 全仓库规则、任务读取顺序、计划保护和交付边界 |
| `apps/backend/AGENTS.md` | 生效 | Backend 分层、事务、数据库、安全和验证规则 |
| `docs/architecture/backend-engineering-standard.md` | 生效 | Backend 详细设计、实现、评审和质量门禁的工程实施标准 |
| `apps/admin/AGENTS.md` | 生效 | Admin 架构、API、Ant Design、状态和验证规则 |
| `apps/web/AGENTS.md` | 生效 | Web 架构、渲染、API、设计、SEO 和验证规则 |
| `.agents/rules/` | 生效 | Antigravity 按范围加载各级 `AGENTS.md` 的桥接规则 |
| `.agents/agents-index.md` | 生效 | 本索引，全项目当前事实和任务导航入口 |
| `plans/README.md` | 生效 | 全栈计划创建、状态、模板、完成和永久保护规则 |
| `docs/PROJECT_REQUIREMENTS.md` | 生效 | 母版目标用户、场景、目标能力、非目标、派生规则和验收基线 |
| `docs/README.md` | 生效 | `docs/` 下全部项目文档的专项索引 |
| `docs/operations/ai-assisted-development-workflow.md` | 生效 | AI 助手规则发现、按需读取、计划实施、验证交付和独立授权的操作指南 |
| `SECURITY.md` | 生效 | 漏洞报告、安全响应目标和安全开发要求 |
| `scripts/ci/` | 生效 | 三态完整性、模块边界、文本卫生和门禁正反例检查 |
| `CHANGELOG.md` | 生效 | 已交付但尚未发布的能力和后续版本变化 |
| `docs/adr/0009-Python运行时基线决策.md` | 生效 | 标准 CPython 3.14、本地 uv、CI、容器补丁固定和标准库 UUID v7 的长期决策 |
| `docs/adr/0010-浏览器认证会话RBAC与审计决策.md` | 生效 | Browser Cookie Profile、C/B 会话隔离、Refresh 权威、规范化 RBAC 和审计决策 |

## 当前开发计划

| 范围 | 当前目标 | 计划 | 状态 | 依赖 |
| --- | --- | --- | --- | --- |
| 全栈 | 阶段 B 应用运行与测试基础设施 | `plans/2026-08-13_阶段B应用运行与测试基础设施计划.md` | 实施中 | Linux x86_64、PostgreSQL 18.4、Redis 8.10.0 |
| Backend | 运行入口、Core、数据库、健康、测试和契约导出 | `plans/2026-08-13_阶段B应用运行与测试基础设施计划.md` | 实施中 | 阶段 A 基线、标准 CPython 3.14 |
| Admin | 可运行管理端骨架、状态页、测试和镜像 | `plans/2026-08-13_阶段B应用运行与测试基础设施计划.md` | 实施中 | Backend 系统状态契约 |
| Web | 可运行用户端骨架、状态入口、测试和镜像 | `plans/2026-08-13_阶段B应用运行与测试基础设施计划.md` | 实施中 | Backend 系统状态契约 |
| API Client | 从 Backend OpenAPI 生成并由两端消费 | `plans/2026-08-13_阶段B应用运行与测试基础设施计划.md` | 实施中 | Backend OpenAPI |
| Database | Alembic 运行环境和 PostgreSQL 测试隔离，不新增业务表 | `plans/2026-08-13_阶段B应用运行与测试基础设施计划.md` | 实施中 | 独立 PostgreSQL 18.4 `_test` 数据库 |
| Deployment | 三个 Dockerfile、健康检查、Compose 和跨栈 E2E | `plans/2026-08-13_阶段B应用运行与测试基础设施计划.md` | 实施中 | 三个应用 ready |
| Documentation | 阶段 B 计划、目录结构与后续实施事实同步 | `plans/2026-08-13_阶段B应用运行与测试基础设施计划.md` | 实施中 | 实施与验证结果 |

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
| `plans/2026-08-13_工程治理与安全可靠性基线计划.md` | 已结束 | 已完成 | 全栈治理、架构规则、质量门禁、安全供应链、发布与运维边界 | 建立业务开发前的模块化、失败关闭、受控兼容、不可变发布和全链路追溯基线 |
| `plans/2026-08-13_Backend工程标准与规则分层计划.md` | 已结束 | 已完成 | Backend 规则、工程标准、文档治理 | 建立 Backend 宪法级规则入口、详细工程标准和专题文档读取路由 |
| `plans/2026-08-13_AI助手开发与文档读取指南计划.md` | 已结束 | 已完成 | 全栈 AI 开发、文档治理 | 说明规则自动发现、按需读取、常见任务和完整开发交付链路 |
| `plans/2026-08-13_阶段B应用运行与测试基础设施计划.md` | 实施中 | 三端工程 `ready`，真实数据库、镜像构建和跨栈 E2E 已补验；仍待发布级镜像摘要与容器运行专项验收 | Backend、Admin、Web、API Client、Database、Deployment、Documentation | 实施三个应用运行、测试、契约和容器基础设施，不包含认证与具体业务领域 |
| `plans/2026-08-14_阶段C通用业务核心能力计划.md` | 已结束 | 已完成 | Backend、Admin、Web、API Client、Database、Deployment、Documentation | 对照两个参考项目完成认证、会话、用户、RBAC、审计、日志和真实跨栈验收 |

## 当前系统状态

| 范围 | 当前状态 | 事实依据 |
| --- | --- | --- |
| Backend | Browser Cookie 认证、用户、管理员、RBAC、Session/Refresh、CSRF、限流、安全事件、审计、请求元数据和运维脚本已实现 | `apps/backend/app/`、`apps/backend/scripts/`、`apps/backend/tests/` |
| Admin | 登录、受保护布局、权限导航、用户、管理员、角色权限、安全日志、MSW/RTL 测试和生产静态容器已实现 | `apps/admin/src/`、`apps/admin/Dockerfile` |
| Web | 注册登录、SSR 用户中心、资料、密码、会话、退出、注销、同域代理、组件测试和 standalone 容器已实现 | `apps/web/src/`、`apps/web/Dockerfile` |
| API Client | 根 OpenAPI 共 39 条路径，生成 Client 已由 Admin/Web 消费并完成无漂移复核 | `packages/api-client/src/`、根 `openapi.json` |
| Database | 阶段 C 身份、会话、RBAC 与安全日志迁移已实现，PostgreSQL 18.4 空库/重复升级、Model/Head 和隔离集成测试通过 | `apps/backend/alembic/`、`apps/backend/app/db/models/identity.py`、`apps/backend/tests/` |
| Deployment | 三个本地 Linux 镜像构建成功，生产 Compose、同域代理、请求日志 Profile 和桌面/移动 Chromium 真实跨栈 E2E 已验证；未执行镜像发布与生产部署 | `compose.prod.yml`、`.github/workflows/ci-e2e.yml`、`playwright.config.ts` |
| Documentation | 目录结构已按阶段 C 收尾时的 259 个项目文件、64 个含文件目录同步，计划、ADR、架构、测试、运维、索引和 Changelog 与实现一致 | `docs/architecture/project-structure.md`、`plans/2026-08-14_阶段C通用业务核心能力计划.md`、`CHANGELOG.md` |

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
| Backend 工程实施标准 | `docs/architecture/backend-engineering-standard.md` | 保存 Backend 具体实现方式、禁止模式和门禁；专题架构语义继续由对应文档负责 |
| Markdown 格式规则与检查 | 根 `.markdownlint.json`、`package.json` 的 `lint:md` | GFM 语法基线、统一具体写法及固定版本的全仓库命令行检查 |
| Git 提交与追溯 | Git 历史、根 `AGENTS.md` | 普通提交由 Git 保存精确历史，跨系统记录保存完整 Commit SHA 或不可变 Tag |
| OpenAPI 契约 | 根 `openapi.json` | 由后端导出，禁止手工修改 |
| TypeScript API Client | `packages/api-client/src/` | 由根契约生成，禁止手工修改 |
| Node.js 锁文件 | 根 `pnpm-lock.yaml` | 全仓库唯一，必须随依赖变化同步提交 |
| Python 锁文件 | `apps/backend/uv.lock` | 后端唯一，已生成并锁定 Windows AMD64 与 Linux x86_64 环境 |
| Python 运行时 | `docs/adr/0009-Python运行时基线决策.md` | 标准 CPython 3.14；依赖由 `uv.lock` 锁定，生产补丁由固定基础镜像 digest 控制 |
| 浏览器认证、会话、RBAC 与审计 | `docs/adr/0010-浏览器认证会话RBAC与审计决策.md`、`docs/architecture/authentication-authorization.md` | ADR 保存取舍，架构文档保存当前运行机制 |
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
