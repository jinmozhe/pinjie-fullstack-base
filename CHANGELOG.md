# Changelog

本文件记录已经交付的项目能力和版本变化。格式参考 Keep a Changelog，版本发布前的变化记录在 `Unreleased`。

## Unreleased

### Added

- 增加基于 TypeScript Compiler API 的前端依赖图门禁，覆盖跨应用引用、Feature 内部越界、循环依赖和可静态解析的动态导入，并提供正反例。
- 增加 PostgreSQL 本地迁移与备份恢复演练工具，强制使用独立 `_test` 数据库并校验 revision、表、行数和约束。
- 增加 1Panel 单机生产运行手册，覆盖不可变镜像、环境变量、迁移、健康检查、日志、备份恢复和回滚边界。
- 增加错误请求入参捕获与脱敏管道：仅对非敏感路由的错误 JSON 请求捕获入参，递归脱敏敏感字段，最多保存 4096 个字符并通过 Redis Stream、PostgreSQL 和 Admin 只读抽屉提供排障入口。
- 增加 Backend Loguru 本地文件日志能力：支持环境变量控制的开关、路径、50 MB 轮转、10 天保留、ZIP 压缩和异步写入；只读容器可关闭文件 Sink。
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
- 增加 GitHub Actions 工作流说明，记录 push 自动检查、Pull Request 差异门禁、人工镜像发布、生产部署和失败定位流程。
- 增加 `SECURITY.md`、CODEOWNERS、Pull Request 风险模板、Gitleaks、Dependency Review、包管理器依赖审计、依赖文件扫描和 Semgrep CE 静态代码扫描治理基线。
- 分离 CI、镜像发布和生产部署工作流；发布生成 SBOM 与构建来源证明，部署要求受保护环境、明确开关和固定 digest。
- 增加发布回滚、数据库备份恢复和事故响应手册，以及统一文本编码、换行和模块边界检查脚本。
- 增加环境变量分层与 Backend 本地运行手册，明确根 `.env`、三端应用配置、1Panel 部署关系和 VS Code 下的后端启动顺序。
- 建立 Backend 两层规则体系，以 `apps/backend/AGENTS.md` 承载宪法级红线和任务读取路由，以工程实施标准承载 FastAPI、事务、数据库、缓存、外部调用、日志、探针、测试和质量门禁的具体规范。
- 增加 AI 助手开发与文档读取指南，区分 Codex、Antigravity 的自动规则发现和项目主动读取，并覆盖常见任务、计划确认、跨栈实施、验证交付与独立授权链路。
- 初始化 GitHub Wiki，并从主仓库已推送提交完整同步 `docs/` 下 12 份受管文档和同步清单。

### Fixed

- 修复 CI 暴露的 Backend Ruff 格式不一致和 Web 测试 matcher 类型缺失问题；Web TypeScript 现在显式加载 Vitest 与 Testing Library matcher 类型。
- 修复 GitHub CI 的 Alembic `request_logs` 表注释漂移，并修正 Admin Umi 代理在 Linux CI 下改写 Origin 导致登录 403 的问题。
- 修复 Browser E2E 在 Admin 登录跳转后读取已释放响应体和过早启动的问题，为 Umi 初始 HTML 补齐页面标题、中文语言属性和允许缩放的 viewport；E2E 模式关闭 MFSU，只在 `/umi.js` 返回 JavaScript Content-Type 后启动浏览器测试，并在解析登录响应前校验 JSON Content-Type。
- 修复 Web Vitest 运行时未注册 Testing Library DOM matcher 的问题；显式扩展 Vitest `expect` 后 Web 17 项测试全部通过。
- 修复 Node 传递依赖的高危漏洞门禁：通过精确 pnpm overrides 提升 `immer`、`node-fetch`、`axios`、`image-size` 和 `vite`，本地 `pnpm audit --audit-level high` 不再报告 High 或 Critical 漏洞。
- 修复 Web 首页在用户已经登录后仍显示“登录”和“创建账户”入口的问题；首页通过服务端当前用户接口确认真实会话，匿名或身份服务暂不可用时继续保留入口。
- 修复 PostgreSQL 18 生产命名卷挂载路径，并在生产 Compose 中默认关闭 Backend 与请求日志消费者的文件日志，避免非 Root 只读运行时写入失败。
- 修复 OpenAPI 公开 Schema 字段缺少中文说明的问题，238 个字段现由 Backend Schema 源码生成中文描述，根契约与共享 API Client 已同步。
- 修复 Governance 文本检查在 Linux PowerShell 中无法读取点文件、正反例脚本遗留预期失败退出码的问题。
- 修复生产部署摘要直接向 Bash 插入 GitHub 表达式的注入风险，并修正 Admin Nginx 健康响应的内容类型声明。
- 修复根 `.env.example` 的乱码、粘连和职责错位，只保留 `compose.prod.yml` 使用的公开部署变量模板。
- 修复 Compose、GitHub Actions 和共享包说明中的既有乱码与换行损坏，并统一文本文件为 UTF-8 无 BOM且保留末尾换行。
- 修复角色创建后响应序列化触发 SQLAlchemy 异步懒加载并返回 500 的问题。
- 修复 Admin 非 Root Nginx 因 PID 指令层级和运行目录不可写而无法启动的问题。

### Changed

- Browser E2E 改为 GitHub Actions 人工按需触发，不再随 Push 或 Pull Request 自动运行；Publish Images 取消 E2E 成功记录依赖，继续校验同一 Commit SHA 的 Governance、Backend、Frontend 和 Security 四项自动门禁。
- Admin 全面迁移到官方 Ant Design Pro v6/Umi Max：采用 `@umijs/max`、Ant Design 6、ProComponents 3、Icons 6、ProLayout、Umi 配置式路由和运行时 Access；保留 Cookie/CSRF/Refresh/RBAC、共享 API Client、危险操作二次确认和现有管理页面。
- 完成 Admin Umi 运行时收尾：通过跨平台 `PORT=3001` 启动包装器固定端口，修复 Umi 环境变量和 initialState 接线，适配 Ant Design 6 弃用属性，并完成桌面/移动登录页浏览器冒烟。
- 用户与管理员的新密码规则统一为 6 至 64 个字符，登录、当前密码和二次确认输入统一限制为最多 64 个字符；Backend、Admin、Web 和初始管理员脚本保持一致。
- FastAPI 文档的接口分组、摘要、字段说明和响应说明改为中文，API 成功与失败响应的顶层 `message` 统一为中文；路径、参数、字段、错误 `code` 和 `operationId` 保持英文程序标识。
- 停用 Dependabot 定期依赖升级分支和 Pull Request，依赖版本调整改为人工发起、评审和验证；保留漏洞告警、Dependency Review、依赖审计和静态代码扫描安全门禁。
- 因个人私有仓库无法启用 GitHub Code Security，将不可运行的 CodeQL Job 替换为固定版本、无账号且不上传源码的 Semgrep CE SAST 门禁。
- 清空并关闭 GitHub Wiki，项目文档统一以仓库 `docs/` 为唯一来源，后续提交和文档同步流程跳过 Wiki。
- 生产 Compose 改为强制接收 Backend、Web 和 Admin 的完整不可变镜像引用，缺失变量时立即失败。
- 前端和治理 CI 运行基线升级到仍受官方支持的 Node.js 24，并固定 pnpm 11.17.0。
- uv 和 pnpm 依赖解析增加七天新版本冷却期；pnpm 同时拒绝奇异传递依赖和包信任等级降级。
- pnpm 依赖构建脚本改为显式白名单，仅批准当前构建所需的 `esbuild` 和 `sharp`。
- Backend 生产镜像固定为官方 CPython 3.14.7 slim-trixie 完整 digest，并通过 Linux x86_64 三端容器健康验收。
- 升级 Next.js 至 16.3.0、ProComponents 至 2.8.10、OpenAPI 生成器至 0.99.0、Markdown 检查器至 0.23.2，并通过精确 override 修复间接依赖漏洞；完整 Node.js 依赖审计无已知 High 或 Critical 漏洞。

### Documentation

- 增加 Admin 本地运行与验证排障手册，明确 Umi 启动目录和端口、生成缓存、jsdom 测试、浏览器兜底验证、真实跨栈前置条件，以及 Windows 系统故障与应用故障的证据边界；同步根和 Admin 级长期规则。
- 完成 Admin 技术栈文档一致性审计：根 README、架构 ADR、环境变量手册、项目结构索引和历史原始方案均已区分当前 Ant Design Pro v6/Umi Max 实现与旧方案记录。
- 完成母版开发总结和一致性文档收尾：同步根与三端 README、项目结构、依赖白名单来源、历史方案边界、数据库恢复、生产运行文档、67 项需求追踪及 13 条母版验收矩阵；当前未执行的质量、容器和 Browser E2E 保持待验证。
