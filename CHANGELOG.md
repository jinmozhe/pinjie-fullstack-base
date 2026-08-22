# Changelog

本文件记录已经交付的项目能力和版本变化。格式参考 Keep a Changelog，版本发布前的变化记录在 `Unreleased`。

## Unreleased

### Added

- 增加 Session 分页契约、Refresh Token 级联清理和默认 dry-run 的会话保留清理工具，支持显式 `--apply`、结果统计和隔离测试库验证。
- 增加 Admin 认证 HTTP、启动生命周期、权限映射和 Web BFF/SSR 会话恢复回归测试，将高风险传输边界纳入前端覆盖率门禁。
- 增加 Web App Router PNG favicon，使用 Next.js `ImageResponse` 生成业务中立的 Pinjie 图标，并通过 production build、桌面和移动浏览器及真实资源响应检查。
- 建立 GitHub 单维护者远端治理基线：启用漏洞告警、Secret Scanning、Push Protection 和私密漏洞报告，限制 Actions 来源并要求完整 SHA Pinning，为 `main` 配置 Ruleset，并预创建不含 Secrets 或 Variables 的 `production` Environment。
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

- 修复 Web/Admin Cookie Profile 共享 Origin 与代理路径导致的跨端会话越权面；Backend 按 Profile 精确校验 Origin，Web BFF 和 Admin Nginx 只允许各自路径并过滤另一端 Cookie。
- 修复最后超级管理员并发竞争、跨 `AsyncSession` 事务上下文误判，以及认证提交后 Redis 限流清理失败翻转成功结果的问题；真实 PostgreSQL 并发和 Redis 失败路径均已覆盖。
- 修复 Admin/Web 刷新、退出和改密生命周期不一致，统一为单次 Refresh 与一次重放、失败保留当前页面、改密保留当前会话并轮换 Cookie。
- 修复 Web canonical 在构建时固化 localhost、子页面标题重复品牌名，以及 Next.js 16.3 standalone 在 Windows 复制目录链接后无法启动的问题。
- 修复 Browser E2E 仍使用旧统一 CORS 变量且未注入 Web 公开 Origin 的配置漂移；冷启动 wrapper 现可自行启动 Windows standalone、Umi 和四个桌面/移动项目。
- 修复 Umi 工具链四项可安全升级的传递依赖漏洞：范围受控地将 `@babel/core`、`@babel/runtime`、`esbuild` 和 `send` 提升到修复版本，旧漏洞解析已从根锁文件移除，并通过 Admin、Web 和真实跨栈回归。
- 修复 Backend 文件日志默认文本格式遗漏 Loguru 绑定字段的问题；文件 Sink 改为 UTF-8 JSON Lines，请求记录稳定包含 `request_id`、`trace_id`、HTTP 方法、规范化路由、状态码和耗时，并由真实文件写入测试覆盖。
- 修复 Admin 五个受保护页面只提供命名导出，导致 Umi production lazy route 触发 React 306 错误的问题；用户、管理员、角色、安全和系统状态页面现同时提供路由所需的默认导出。
- 修复 Web 主动退出期间迟到的用户或会话请求 401 覆盖预期 `/login` 跳转的问题；退出发起前显式中止在途读取并增加竞态回归测试。
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

- 移除把 Umi bundler 的 Vite 4 强制覆盖到 Vite 6 的不兼容 override；锁文件现由 Umi 使用 `vite@4.5.2`，Admin Vitest 独立使用 `vite@6.4.3`。
- Backend、Admin、Web、PostgreSQL 和 Redis 的生产基础镜像全部固定完整 digest，生产 Compose 门禁同时覆盖 Dockerfile、应用镜像变量、基础设施引用和可变引用反例。
- 用户、用户管理和管理员管理的 Session 列表统一为有上限的服务端分页响应；根 OpenAPI 与共享 API Client 已重新生成并迁移全部消费者。
- 对 Umi 固定的 React Router `6.3.0` 两条 Medium 告警和暂无修复版本的 `elliptic 6.6.1` Low 告警建立截至 2026-09-21 的限时风险接受；GitHub 使用 `tolerable_risk` 保留依赖链、可达性、负责人和复核条件，本地低级别原始审计继续报告这些未修复上游风险。
- 将内部自用单维护者的自审、管理员 bypass 和 Ruleset bypass 明确为已接受治理模型；不增加第二维护者，继续保留自动状态检查、不可变发布、操作审计以及提交、推送、发布和部署的独立授权边界。
- 将七个 GitHub Actions 工作流中的十个旧版 JavaScript Action 升级到原生 Node.js 24 的正式版本；全部引用继续固定完整 Commit SHA，不再依赖 GitHub Runner 对 `node20` Action 的兼容覆盖。
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

- 建立 Codex Windows 配置与 ACL 独立标准，统一说明用户级和项目级 `config.toml`、`elevated + Custom`、同机多项目、跨电脑迁移、缓存与代理边界、受保护路径、正反向验收、故障分类、最小修复和回滚；既有 AI 工作流与本地环境文档收敛为入口。
- 建立 Codex Windows 原生沙箱长期治理流程，区分 Owner 混杂、真实 NTFS ACL、工作区边界和命令审批；采用 `elevated + Custom (config.toml)`、最小 uv Cache 可写根、回环代理环境过滤和正反向验证，不对无实际故障的 `CodexSandbox*` Owner 做周期性归一。
- 建立 Admin Umi/Pro 框架边界与工程实施标准，明确 Umi 公共入口、Feature 目录、项目唯一安全 HTTP 管道、Access 与服务端授权、ProComponents 场景化选择及依赖分层准入规则。
- 增加 Admin 本地运行与验证排障手册，明确 Umi 启动目录和端口、生成缓存、jsdom 测试、浏览器兜底验证、真实跨栈前置条件，以及 Windows 系统故障与应用故障的证据边界；同步根和 Admin 级长期规则。
- 完成 Admin 技术栈文档一致性审计：根 README、架构 ADR、环境变量手册、项目结构索引和历史原始方案均已区分当前 Ant Design Pro v6/Umi Max 实现与旧方案记录。
- 完成母版开发总结和一致性收尾：同步根与三端 README、项目结构、依赖白名单来源、历史方案边界、数据库恢复、生产运行文档、67 项需求追踪及 13 条母版验收矩阵，并完成三端质量、容器、文件日志和桌面/移动 Browser E2E 最终验收。
