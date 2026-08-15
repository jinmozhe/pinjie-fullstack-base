# Changelog

本文件记录已经交付的项目能力和版本变化。格式参考 Keep a Changelog，版本发布前的变化记录在 `Unreleased`。

## Unreleased

### Added

- 完成阶段 C 通用业务核心能力：C/B 独立 Browser Cookie Profile、Argon2id、JWT、Session 绑定 CSRF、PostgreSQL 权威 Refresh Rotation、重放撤销、Redis 原子限流和严格 Origin 校验。
- 增加用户、管理员、角色、权限、会话、Refresh、安全登录事件、审计和可选请求元数据模型及 Alembic 迁移，并提供初始化管理员、权限同步、日志保留清理和 Redis Stream 消费脚本。
- 完成 Web 注册、登录、SSR 用户中心、资料、密码、会话、退出和注销流程，以及 Admin 登录、权限导航、用户、管理员、角色权限和安全日志工作台。
- 增加阶段 C 真实 PostgreSQL/Redis 集成测试、C/B 安全回归、Admin/Web 组件测试和桌面/移动 Chromium 跨栈 E2E；Web production E2E 使用 Next.js standalone server 和受控跨平台服务回收脚本。
- 增加 Browser Cookie Profile、会话、RBAC 与审计 ADR，明确未来小程序和原生 App 通过独立 Public Client Bearer Profile 扩展。
- 完成阶段 B 运行基础设施：Backend FastAPI 入口、统一响应与错误处理、请求上下文、数据库会话与事务、Redis 生命周期、健康探针、系统状态接口、Alembic 环境、UUID v7 和基础测试。
- 完成 Admin/Web 业务中立系统状态页、同域 API 代理、Vitest + RTL + jsdom + MSW 组件测试及覆盖率门禁。
- 增加根 Playwright Test 与 axe 跨栈 E2E 配置，覆盖桌面和移动 Chromium、控制台错误、横向溢出和关键可访问性扫描。
- 增加 Backend、Web、Admin 三个生产 Dockerfile、Nginx 同域代理、生产 Compose 健康依赖和 PostgreSQL 18.4/Redis 8.10.0 运行基线。
- 增加 PostgreSQL 测试隔离约束、OpenAPI 原子导出、生成 API Client 和独立浏览器 E2E CI 工作流。
- 增加 Backend 默认 90% 行与分支覆盖率门禁，以及配置、Redis、限流、健康探针和真实用户/管理 API 生命周期回归测试。
- 增加仓库级 markdownlint 配置、VS Code 扩展建议和固定版本的 `pnpm lint:md` 命令，以 GFM 为语法基线统一 AI 与开发者的 Markdown 格式。
- 建立 Git 提交追溯规则，区分普通提交的 Git 历史与发布、部署、派生、安全审计、回滚和交接等跨系统 SHA 记录。
- 建立全项目索引，统一导航项目身份、三端开发目标、计划、系统状态、权威来源和派生项目入口。
- 建立全栈计划生命周期和永久保护规则，禁止 AI 删除、移动、重命名或替换既有计划文档。
- 建立派生项目记录母版基线、派生类型和业务范围的治理入口。
- 建立 `docs/PROJECT_REQUIREMENTS.md` 产品需求基线，集中定义母版目标用户、适用场景、目标能力、非目标、派生规则和完成验收标准。
- 建立 `BASE-*` 需求编号与全栈计划关联规则，区分目标能力、当前实现状态、实施过程和已交付事实。
- 建立讨论结论知识沉淀规则，将已确认或有证据的长期结论路由到现有权威文档，不保存聊天原文，也不提前创建空的 Brainstorming 或 Research 目录。
- 纳入 Backend、Admin、Web、共享包、Compose、GitHub Actions、ADR、架构、蓝图和运维文档的完整工程骨架。
- 建立 `empty`、`partial`、`ready` 三态工程完整性门禁；部分实现、契约不一致和跨模块内部依赖会直接失败，空骨架只报告治理检查结果。
- 建立模块化单体、领域所有权、Fail Closed、认证授权分层、测试、可观测性和可靠性架构基线。
- 建立受控迁移兼容和不可变发布 ADR，生产部署固定镜像 digest，禁止 `latest` 与缺失版本回退。
- 增加 `SECURITY.md`、CODEOWNERS、Pull Request 风险模板、Gitleaks、Dependency Review、包管理器依赖审计、依赖文件扫描和 CodeQL 治理基线。
- 分离 CI、镜像发布和生产部署工作流；发布生成 SBOM 与构建来源证明，部署要求受保护环境、明确开关和固定 digest。
- 增加发布回滚、数据库备份恢复和事故响应手册，以及统一文本编码、换行和模块边界检查脚本。
- 增加环境变量分层与 Backend 本地运行手册，明确根 `.env`、三端应用配置、1Panel 部署关系和 VS Code 下的后端启动顺序。
- 建立 Backend 两层规则体系，以 `apps/backend/AGENTS.md` 承载宪法级红线和任务读取路由，以工程实施标准承载 FastAPI、事务、数据库、缓存、外部调用、日志、探针、测试和质量门禁的具体规范。
- 增加 AI 助手开发与文档读取指南，区分 Codex、Antigravity 的自动规则发现和项目主动读取，并覆盖常见任务、计划确认、跨栈实施、验证交付与独立授权链路。
- 初始化 GitHub Wiki，并从主仓库已推送提交完整同步 `docs/` 下 12 份受管文档和同步清单。

### Fixed

- 修复 Governance 文本检查在 Linux PowerShell 中无法读取点文件的问题，并补齐私有仓库 CodeQL Job 读取 Actions 元数据所需的最小权限。
- 修复根 `.env.example` 的乱码、粘连和职责错位，只保留 `compose.prod.yml` 使用的公开部署变量模板。
- 修复 Compose、GitHub Actions 和共享包说明中的既有乱码与换行损坏，并统一文本文件为 UTF-8 无 BOM且保留末尾换行。
- 修复角色创建后响应序列化触发 SQLAlchemy 异步懒加载并返回 500 的问题。
- 修复 Admin 非 Root Nginx 因 PID 指令层级和运行目录不可写而无法启动的问题。

### Changed

- 停用 Dependabot 定期依赖升级分支和 Pull Request，依赖版本调整改为人工发起、评审和验证；保留漏洞告警、Dependency Review、依赖审计和 CodeQL 安全门禁。
- 清空并关闭 GitHub Wiki，项目文档统一以仓库 `docs/` 为唯一来源，后续提交和文档同步流程跳过 Wiki。
- 生产 Compose 改为强制接收 Backend、Web 和 Admin 的完整不可变镜像引用，缺失变量时立即失败。
- 前端和治理 CI 运行基线升级到仍受官方支持的 Node.js 24，并固定 pnpm 11.17.0。
- pnpm 依赖构建脚本改为显式白名单，仅批准当前构建所需的 `esbuild` 和 `sharp`。
- Backend 生产镜像固定为官方 CPython 3.14.7 slim-trixie 完整 digest，并通过 Linux x86_64 三端容器健康验收。
- 升级 Next.js 至 16.3.0、ProComponents 至 2.8.10、OpenAPI 生成器至 0.99.0、Markdown 检查器至 0.23.2，并通过精确 override 修复间接依赖漏洞；完整 Node.js 依赖审计无已知 High 或 Critical 漏洞。
