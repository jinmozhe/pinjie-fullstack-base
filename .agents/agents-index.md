# pinjie-fullstack-base 项目索引

本文件是全项目任务导航和当前事实入口。规则正文以各级 `AGENTS.md` 为准，完整文档清单以 `docs/README.md` 为准，计划格式和生命周期以 `plans/README.md` 为准。

## 项目身份

| 字段 | 当前值 |
| --- | --- |
| 项目角色 | 通用全栈 Monorepo 母版 |
| 派生类型 | 无 |
| 母版基线 | 当前仓库 |
| 当前阶段 | PR #14 契约兼容修复已完成；旧版管理员确认端点限时保留至 2026-09-26，新增权限的目标环境同步、发布和部署仍需独立授权 |
| 业务范围 | 认证、用户、管理、系统等跨业务通用能力；具体业务进入蓝图或派生仓库 |

## 执行入口

| 路径 | 状态 | 用途 |
| --- | --- | --- |
| `AGENTS.md` | 生效 | 全仓库规则、任务读取顺序、计划保护和交付边界 |
| `apps/backend/AGENTS.md` | 生效 | Backend 分层、事务、数据库、安全和验证规则 |
| `docs/architecture/backend-engineering-standard.md` | 生效 | Backend 详细设计、实现、评审和质量门禁的工程实施标准 |
| `apps/admin/AGENTS.md` | 生效 | Admin 架构、API、Ant Design、状态和验证规则 |
| `docs/architecture/admin-engineering-standard.md` | 生效 | Admin Umi/Pro 框架边界、Feature、请求、状态、组件选择和依赖准入的工程实施标准 |
| `apps/web/AGENTS.md` | 生效 | Web 架构、渲染、API、设计、SEO 和验证规则 |
| `.agents/rules/` | 生效 | Antigravity 按范围加载各级 `AGENTS.md` 的桥接规则 |
| `.agents/agents-index.md` | 生效 | 本索引，全项目当前事实和任务导航入口 |
| `plans/README.md` | 生效 | 全栈计划创建、状态、模板、完成和永久保护规则 |
| `docs/PROJECT_REQUIREMENTS.md` | 生效 | 母版目标用户、场景、目标能力、非目标、派生规则和验收基线 |
| `docs/README.md` | 生效 | `docs/` 下全部项目文档的专项索引 |
| `docs/operations/ai-assisted-development-workflow.md` | 生效 | AI 助手规则读取、任务路由、计划交付、本地检查点、高风险编辑、验证和独立授权指南 |
| `docs/operations/codex-windows-config-acl-governance.md` | 生效 | Codex Windows `config.toml`、默认联网、Schannel、GitHub CLI Keyring、沙箱、ACL 诊断、验证、最小修复和回滚的权威标准 |
| `docs/operations/github-actions-workflows.md` | 生效 | GitHub Actions 自动检查、人工镜像发布和生产部署的逐工作流说明 |
| `SECURITY.md` | 生效 | 漏洞报告、安全响应目标和安全开发要求 |
| `scripts/ci/` | 生效 | 三态完整性、模块边界、文本卫生和门禁正反例检查 |
| `CHANGELOG.md` | 生效 | 已交付但尚未发布的能力和后续版本变化 |
| `docs/adr/0009-Python运行时基线决策.md` | 生效 | 标准 CPython 3.14、本地 uv、CI、容器补丁固定和标准库 UUID v7 的长期决策 |
| `docs/adr/0010-浏览器认证会话RBAC与审计决策.md` | 生效 | Browser Cookie Profile、C/B 会话隔离、Refresh 权威、规范化 RBAC 和审计决策 |
| `docs/adr/0011-Admin采用AntDesignProV6与UmiMax决策.md` | 已完成 | Admin 采用官方 Ant Design Pro v6/Umi Max，保留项目安全、契约和质量边界 |
| `docs/adr/0012-统一文件资产采用可补偿本地存储决策.md` | 已完成 | 统一文件资产采用本地存储端口、同文件系统原子提交、同主体去重和可恢复删除补偿 |

## 当前开发计划

| 路径 | 状态 | 影响范围 | 用途 |
| --- | --- | --- | --- |
| `plans/2026-08-27_Web用户头像上传与资料同步计划.md` | 已结束 | Backend、Web、API Client、Database、Documentation | 已完成用户头像字段、本人资产绑定、Web 头像交互、资产引用保护和契约同步；轻量门禁通过，重型验证与真实迁移按授权边界未执行 |
| `plans/2026-08-27_Admin创建用户与公开注册开关联动计划.md` | 已结束 | Backend、Admin、Web、API Client、Documentation | 已完成 Admin 独立创建用户、公共注册能力契约和 Web 注册入口联动 |
| `plans/2026-08-27_Admin系统状态页面全景监控升级计划.md` | 已结束 | Backend、Admin、API Client、Documentation | 已完成受权系统概览、实时探针、可解释缓存遥测、公开配置摘要与旧数据提示 |
| `plans/2026-08-27_Admin管理员头像统一回退样式计划.md` | 已结束 | Admin、Documentation | 已统一管理员列表与顶部账户头像的浅色首字符回退 |
| `plans/2026-08-27_Admin文件资产上传主体标识精简计划.md` | 已结束 | Admin、Documentation | 已隐藏上传主体 UUID 文本，并在主体类型后保留图标复制能力 |
| `plans/2026-08-27_Admin文件资产图片当前页预览计划.md` | 已结束 | Admin、Documentation | 已完成图片资产当前页预览，非图片继续新窗口打开 |
| `plans/2026-08-27_Admin用户永久回收站恢复策略调整计划.md` | 已结束 | Backend、Admin、Web、API Client、Database、Documentation | 实施统一 SoftDeleteMixin，移除恢复截止和匿名化，用户自助注销统一进入可恢复软删除回收站 |
| `plans/2026-08-27_本地检查点提交与高风险编辑治理计划.md` | 已结束 | Documentation、Developer Workflow | 已建立功能单元本地检查点授权、高风险文件编辑和可恢复验证规则 |
| `plans/2026-08-27_Admin用户回收站与恢复能力计划.md` | 已结束 | Database、Backend、Admin、API Client、Documentation | 已完成用户回收站、单条与批量恢复、到期匿名化和独立恢复权限；目标环境迁移与权限同步仍需独立授权 |
| `plans/2026-08-27_Admin列表批量操作与删除能力计划.md` | 已结束 | Backend、Admin、API Client、Documentation | 批量治理已完成；旧版管理员确认端点按 ADR 0007 限时兼容至 2026-09-26 |
| `plans/2026-08-26_三端本地与GitHubActions轻量验证规则计划.md` | 已结束 | Backend、Admin、Web、API Client、Deployment、Documentation | 三端本地、GitSync 与 GitHub Actions 已收敛为轻量静态检查，重型验证只在用户明确授权后执行 |
| `plans/2026-08-26_开发迭代与GitSync分层验证规则计划.md` | 已结束 | Documentation、Developer Workflow | 已建立开发定向测试与 GitSync 按影响范围全量验证规则，通用 Skill 保持中立 |
| `plans/2026-08-25_Admin管理员资料编辑与安全操作整合计划.md` | 已结束 | Backend、Admin、API Client、Documentation | 已完成管理员资料编辑、身份切换、独立密码重置、批量状态管理和紧凑不换行操作列 |
| `plans/2026-08-25_统一文件与多媒体资产上传服务计划.md` | 已结束 | Backend、Admin、Web、API Client、Database、Deployment、Documentation | 已完成统一文件与多媒体资产上传服务、按日期单层分桶落盘、存储驱动解耦、双端上传组件与完整跨栈验证 |
| `plans/2026-08-25_Admin官方布局宽度比例对齐计划.md` | 已结束 | Admin、Documentation | 已按官方比例完成 `256px` 侧栏、流式工作区与三视口验证 |
| `plans/2026-08-24_Admin左侧Logo移除与欢迎页面落地计划.md` | 已结束 | Admin、Documentation | 已移除侧栏 Logo，新增官方风格 WelcomePage 及单元测试，36 项测试与门禁全量通过 |
| `plans/2026-08-24_Admin官方标准浅色高质感视觉体系对齐计划.md` | 已结束 | Admin、Documentation | 已完成白底侧栏、通透 Header、ProTable 原生工具栏、轻量操作列与微投影卡片升级，全量门禁通过 |
| `plans/2026-08-24_GitSync自动PR合并与Actions去重计划.md` | 已结束 | Deployment、Documentation | 已保留 Ruleset，启用 rebase Auto-merge 与自动删分支，并去除功能分支 Push 重复检查；PR #10 首轮 13 项检查通过 |
| `plans/2026-08-24_VSCodeRuff工作区隔离配置计划.md` | 已结束 | Backend、Documentation | 已隔离 VS Code 扩展内置 Ruff 与 Backend 虚拟环境 Ruff，避免 Windows 文件占用阻断 uv 同步 |
| `plans/2026-08-24_Admin全量AntDesign6与ArtDesignPro高质感视觉升级计划.md` | 已结束 | Admin、Documentation | 已完成官方 Ant Design 6、ProComponents 和 Umi Max ProLayout 全页面视觉交互升级 |
| `plans/2026-08-24_Ruleset与Vite高危漏洞整改计划.md` | 已结束 | Admin、Deployment、Documentation | `main` 无永久 bypass，Umi Vite 4 已移除，PR #7 与合并后四个工作流通过，Dependabot 为 0 Open |
| `plans/2026-08-24_ruleset-vite-security-remediation-plan.md` | 已结束 | Documentation | 重复计划已由中文路径活动计划替代，永久保留审计记录 |
| `plans/2026-08-24_CodexWindowsGhKeyring宿主执行治理计划.md` | 已结束 | Documentation、Windows 本地开发治理 | 已固化认证型 `gh` 命令的 Windows Keyring 宿主执行、精确审批和远端副作用授权边界 |
| `plans/2026-08-23_CodexWindows网络与Schannel边界治理计划.md` | 已结束 | Documentation、Windows 本地开发治理 | 已将个人开发机默认联网、Schannel 已知边界、准确宿主升级兜底和升级复验条件写入权威文档与规则 |
| `plans/2026-08-22_母版不可变基线冻结整改计划.md` | 已结束 | Backend、Admin、Web、API Client、Database、Deployment、Documentation | 冻结阻断项已修复，三端质量、真实依赖、契约、容器门禁和桌面/移动跨栈验收通过 |
| `plans/2026-08-22_immutable-baseline-remediation-plan.md` | 已结束 | Backend、Admin、Web、API Client、Database、Deployment、Documentation | 重复计划已由中文路径的活动计划替代，永久保留审计记录 |
| `plans/2026-08-22_CodexWindows配置与ACL标准文档计划.md` | 已结束 | Documentation、Windows 本地开发治理 | 已建立 `config.toml`、`elevated + Custom`、同机复用、跨电脑迁移和 ACL 全链路的独立标准文档 |
| `plans/2026-08-22_CodexWindowsACL长期治理计划.md` | 已结束 | Documentation、Windows 本地开发治理 | 已完成 Codex 原生沙箱、NTFS Owner/ACL、Git 审批、缓存越界和回环代理的长期治理 |
| `plans/2026-08-22_Admin框架边界与开发范式治理计划.md` | 已结束 | Admin、Documentation | 已完成 Umi/Pro 框架边界、项目安全请求管道、依赖准入和组件选择规则治理，文档与门禁全部通过 |
| `plans/2026-08-22_Dependabot中低危依赖治理计划.md` | 已结束 | Admin、Web、Deployment、Documentation | 四项传递依赖已修复，三项上游风险已限时接受，Dependabot 为 0 Open、7 Closed，四个自动工作流全部成功 |
| `plans/2026-08-22_GitHubActionsNode24原生运行时升级计划.md` | 已结束 | Deployment、Documentation | 十个 Action 已升级到原生 Node.js 24，线上四个自动工作流成功且 annotations 为 0 |
| `plans/2026-08-21_验收缺口修复与远端治理计划.md` | 已结束 | Backend、Web、Deployment、Documentation | 修复文件日志关联字段，补齐线上 Browser E2E、GitHub 远端治理、favicon 和历史记录一致性 |
| `plans/2026-08-21_母版开发总结与一致性收尾计划.md` | 已结束 | Backend、Admin、Web、API Client、Database、Deployment、Documentation | 修复生产阻断、契约说明和文档漂移，补齐迁移、恢复、边界与跨栈验收 |
| `plans/2026-08-21_BrowserE2E人工触发与发布解耦计划.md` | 已结束 | Deployment、Documentation | 将 Browser E2E 改为人工触发，并取消镜像发布对 E2E 成功记录的依赖 |
| `plans/2026-08-21_BrowserE2E就绪探测修复计划.md` | 已结束 | Admin、Deployment、Documentation | 修复 Umi 首次编译期间 2xx HTML 回退页导致 Browser E2E 过早启动的问题 |
| `plans/2026-08-19_Admin升级AntDesign6计划.md` | 已结束 | Admin、API Client 消费验证、Deployment、Documentation | 全面迁移官方 Ant Design Pro v6/Umi Max，同时保留项目安全、契约和质量边界 |
| `plans/2026-08-20_请求日志错误入参捕获与脱敏管道计划.md` | 已结束 | Backend、Admin、API Client、Database、Documentation | 落地错误请求入参捕获、敏感字段脱敏与 4KB 截断兜底的最佳实践管道 |
| `plans/2026-08-20_后端文件日志与环境变量配置化计划.md` | 已结束 | Backend、Deployment、Documentation | Loguru 异步文件落盘、环境变量受控配置化与自动清理轮转策略 |
| `plans/2026-08-20_GitHub CI线上失败修复计划.md` | 已结束 | Backend、Admin、Database、CI、Documentation | 修复 Alembic 漂移、Admin 代理校验、E2E 登录方式、启动时序和 HTML 可访问性问题 |

## 计划文档登记

`plans/` 下每份现存 Markdown 文档都必须在本表登记。计划结束后只更新状态和结果，不删除索引记录。

| 路径 | 状态 | 结果 | 影响范围 | 用途 |
| --- | --- | --- | --- | --- |
| `plans/2026-08-27_Web用户头像上传与资料同步计划.md` | 已结束 | 已完成；用户头像字段、本人资产绑定、Web 上传/移除/回退、资产引用保护、OpenAPI/API Client 与文档已同步；轻量门禁通过，重型验证与真实迁移按授权边界未执行 | Backend、Web、API Client、Database、Documentation | 支持用户上传、绑定、移除和持久化头像，并保护在用资产 |
| `plans/2026-08-27_Admin创建用户与公开注册开关联动计划.md` | 已结束 | 已完成；轻量门禁通过，重型测试按规则未执行，目标环境权限同步仍需独立授权 | Backend、Admin、Web、API Client、Documentation | 支持关闭公开注册的派生项目由 Admin 创建可登录用户 |
| `plans/2026-08-27_Admin系统状态页面全景监控升级计划.md` | 已结束 | 已完成；缓存、权限、健康语义、公开配置、统计口径、运行时版本和旧数据提示已修正，轻量门禁通过；重型测试和目标环境权限同步未执行 | Backend、Admin、API Client、Documentation | 建立管理端单接口全景监控、基础设施实时探针、Redis 缓存遥测与美观多卡片看板 |
| `plans/2026-08-27_Admin管理员头像统一回退样式计划.md` | 已结束 | 已完成；空头像和失效图片统一显示浅色首字符回退，Admin typecheck 与 lint 通过，重型验证按策略未执行 | Admin、Documentation | 统一管理员列表与顶部账户头像的浅色首字符回退 |
| `plans/2026-08-27_Admin文件资产上传主体标识精简计划.md` | 已结束 | 已完成；UUID 文本已隐藏，主体类型后保留复制图标，Admin typecheck 与 lint 通过，重型验证按策略未执行 | Admin、Documentation | 隐藏上传主体 UUID 文本，在主体类型后保留图标复制能力 |
| `plans/2026-08-27_Admin文件资产图片当前页预览计划.md` | 已结束 | 已完成；图片“打开”使用 Ant Design 当前页预览，非图片保留新窗口，Admin typecheck 与 lint 通过，重型验证按策略未执行 | Admin、Documentation | 图片资产点击“打开”时使用 Ant Design 当前页预览，非图片继续新窗口打开 |
| `plans/2026-08-27_Admin用户永久回收站恢复策略调整计划.md` | 已结束 | 已完成统一 SoftDeleteMixin、移除匿名化、用户自助注销走可恢复软删除及删除原因可选方案；轻量门禁通过，重型验证和真实迁移按授权边界未执行 | Backend、Admin、Web、API Client、Database、Documentation | 实施统一 SoftDeleteMixin，移除恢复截止和匿名化，用户自助注销统一进入可恢复软删除回收站 |
| `plans/2026-08-27_本地检查点提交与高风险编辑治理计划.md` | 已结束 | 已完成；功能单元完成后请求本地检查点授权、分阶段授权后立即精确提交，高风险整文件写入具备恢复基线和严格校验，治理轻量门禁通过 | Documentation、Developer Workflow | 建立本地检查点授权、高风险文件编辑和可恢复验证规则 |
| `plans/2026-08-27_Admin用户回收站与恢复能力计划.md` | 已结束 | 已完成；回收站、恢复后保持停用、默认 30 天到期匿名化、迁移、契约、Admin 页面和文档已同步，轻量门禁通过，重型验证按策略未执行 | Database、Backend、Admin、API Client、Documentation | 为软删除用户增加可恢复生命周期和受控数据最小化机制 |
| `plans/2026-08-27_Admin列表批量操作与删除能力计划.md` | 已结束 | 已完成；批量治理已落地，旧版管理员确认端点限时兼容至 2026-09-26；轻量门禁通过，重型验证按策略未执行 | Backend、Admin、API Client、Documentation | 为现有非日志类 Admin 列表补齐批量能力，并登记管理员确认端点受控迁移窗口 |
| `plans/2026-08-26_三端本地与GitHubActions轻量验证规则计划.md` | 已结束 | 已完成；四级规则、权威文档与两条自动 CI 已同步，轻量门禁和契约幂等检查通过，重型验证按策略未执行 | Backend、Admin、Web、API Client、Deployment、Documentation | 三端本地、GitSync 与 GitHub Actions 已收敛为轻量静态检查，重型验证只在用户明确授权后执行 |
| `plans/2026-08-26_开发迭代与GitSync分层验证规则计划.md` | 已结束 | 已完成；三级项目规则、测试策略、计划与索引已同步，通用 Skill 未修改 | Documentation、Developer Workflow | 建立开发定向测试与 GitSync 全量验证的分层规则 |
| `plans/2026-08-25_Admin管理员资料编辑与安全操作整合计划.md` | 已结束 | 已完成；代码、契约和轻量门禁通过，Vitest、pytest、build 与浏览器验证按策略未执行 | Backend、Admin、API Client、Documentation | 已完成管理员资料编辑、身份切换、独立密码重置、批量状态管理和紧凑不换行操作列 |
| `plans/2026-08-25_统一文件与多媒体资产上传服务计划.md` | 已结束 | 已完成；统一资产服务、双端组件、头像持久化、契约、容器与真实跨栈验收全部通过 | Backend、Admin、Web、API Client、Database、Deployment、Documentation | 实施统一文件与多媒体资产上传服务、按日期单层分桶落盘、存储驱动解耦与前端组件封装 |
| `plans/2026-08-25_Admin官方布局宽度比例对齐计划.md` | 已结束 | 已完成；`256px` 侧栏、流式工作区、Admin 全量门禁与三视口验证通过 | Admin、Documentation | 按官方 Ant Design Pro 比例调整桌面侧栏与流式工作区宽度 |
| `plans/2026-08-25_admin-layout-width-ratio-plan.md` | 已结束 | 已替代；活动实施统一维护在中文路径计划 | Documentation | 保留补丁工具异常产生的重复计划审计记录 |
| `plans/2026-08-24_Admin左侧Logo移除与欢迎页面落地计划.md` | 已结束 | 已完成；已移除侧栏 Logo，新增官方风格 WelcomePage 及单元测试，36 项测试与门禁全量通过 | Admin、Documentation | 移除侧栏 Logo 并在菜单首位增加欢迎页面作为登录默认主页 |
| `plans/2026-08-24_Admin官方标准浅色高质感视觉体系对齐计划.md` | 已结束 | 已完成；浅色侧栏、通透 Header、ProTable 原生工具条与轻量操作列已升级，33 项测试全量通过 | Admin、Documentation | 将管理端重构为官方 Ant Design Pro v6 标准浅色高质感视觉体系，恢复 ProTable 原生工具条与 Header 操作生态 |
| `plans/2026-08-24_GitSync自动PR合并与Actions去重计划.md` | 已结束 | 已完成；远端合并设置、Skill、本地门禁和 PR #10 首轮 13 项检查均通过 | Deployment、Documentation | 自动化 Ruleset 保护下的日常 Git 交付闭环，并去除功能分支 Push 重复检查 |
| `plans/2026-08-24_VSCodeRuff工作区隔离配置计划.md` | 已结束 | 已完成工作区设置、uv 使用边界说明与治理验证 | Backend、Documentation | 隔离 VS Code 扩展内置 Ruff 与 Backend 虚拟环境 Ruff，避免 Windows 文件占用阻断 uv 同步 |
| `plans/2026-08-24_Admin全量AntDesign6与ArtDesignPro高质感视觉升级计划.md` | 已结束 | 已完成深色侧栏、浅色工作区、PageContainer、受控 ProTable、五视口与 axe 验收 | Admin、Documentation | 官方 Ant Design 6、ProComponents 与 Umi Max ProLayout 全页面视觉交互升级 |
| `plans/2026-08-24_Ruleset与Vite高危漏洞整改计划.md` | 已结束 | 已完成；PR #7 rebase 合并，Rule Suite 与合并后四个工作流通过，Dependabot 为 0 Open | Admin、Deployment、Documentation | 收紧 `main` Ruleset 并消除 Umi 依赖链中的 Vite 4 高危漏洞 |
| `plans/2026-08-24_ruleset-vite-security-remediation-plan.md` | 已结束 | 已替代；活动实施统一维护在中文路径计划 | Documentation | 保留补丁工具异常后产生的重复计划审计记录 |
| `plans/2026-08-24_CodexWindowsGhKeyring宿主执行治理计划.md` | 已结束 | 已完成；根规则、权威运维文档、审批示例、安全边界和索引已同步，文档与治理门禁通过 | Documentation、Windows 本地开发治理 | 统一 GitHub CLI 与 Windows Keyring 的宿主执行和审批边界 |
| `plans/2026-08-23_CodexWindows网络与Schannel边界治理计划.md` | 已结束 | 已完成；默认联网、Schannel 对照诊断、准确宿主升级兜底、禁止规避措施和升级复验删除条件已同步，全部治理门禁通过 | Documentation、Windows 本地开发治理 | 统一 Codex Windows 网络和系统 HTTPS 客户端边界 |
| `plans/2026-08-22_母版不可变基线冻结整改计划.md` | 已结束 | P1-01 至 P1-09 与同步处理项已完成；当前工作区满足冻结候选条件，尚未提交或创建不可变 Tag | Backend、Admin、Web、API Client、Database、Deployment、Documentation | 完成母版不可变基线冻结前的安全、兼容、一致性、交付和文档整改 |
| `plans/2026-08-22_immutable-baseline-remediation-plan.md` | 已结束 | 已替代；活动实施统一维护在中文路径计划 | Backend、Admin、Web、API Client、Database、Deployment、Documentation | 保留补丁工具错误报告后产生的重复计划审计记录 |
| `plans/2026-08-22_CodexWindows配置与ACL标准文档计划.md` | 已结束 | 已完成；独立标准文档、既有入口去重、文档索引、全项目索引和 Changelog 已同步，全部文档与治理门禁通过 | Documentation、Windows 本地开发治理 | 建立 `config.toml`、`elevated + Custom`、初始化、迁移、验证、诊断、修复和回滚的完整标准 |
| `plans/2026-08-22_CodexWindowsACL长期治理计划.md` | 已结束 | 已完成；采用 `elevated + Custom`、精确 uv Cache 根和代理环境过滤，Owner、uv、Node 子进程、工作区外写入和网络正反例均通过，未执行无实际故障的 Owner 归一 | Documentation、Windows 本地开发治理 | 解决 Codex 持续维护中的 Owner 混杂、ACL 误判、缓存越界和 Git 重复审批 |
| `plans/2026-08-22_Admin框架边界与开发范式治理计划.md` | 已结束 | 已完成；Admin 宪法、工程标准、ADR、导航、索引和治理门禁均已同步通过 | Admin、Documentation | 固化 Umi/Pro 框架边界、项目安全请求管道、依赖准入和组件选择规则，修正文档与实现漂移 |
| `plans/2026-08-22_Dependabot中低危依赖治理计划.md` | 已结束 | 已完成；四项传递依赖修复、三项限时风险接受、完整回归、Dependabot 重扫和四个线上自动工作流均通过 | Admin、Web、Deployment、Documentation | 修复四项可安全升级的传递依赖，对三项暂无安全升级路径的上游风险建立限时接受和复核闭环 |
| `plans/2026-08-22_GitHubActionsNode24原生运行时升级计划.md` | 已结束 | 已完成；十个 Action 原生 Node.js 24 升级、完整 SHA Pinning、本地门禁和线上四个自动工作流均通过，annotations 为 0 | Deployment、Documentation | 将七个工作流中的十个 Action 升级到原生 Node.js 24 的固定 SHA |
| `plans/2026-08-21_验收缺口修复与远端治理计划.md` | 已结束 | 已完成；文件日志、线上 E2E、远端治理、favicon、历史记录和最终门禁均通过 | Backend、Web、Deployment、Documentation | 修复文件日志关联字段，补齐线上 Browser E2E、GitHub 远端治理、favicon 和历史记录一致性 |
| `plans/2026-08-21_母版开发总结与一致性收尾计划.md` | 已结束 | 已完成；生产边界、OpenAPI 中文字段说明、依赖图、数据库恢复、三端质量、容器、文件日志和 Browser E2E 均通过验收 | Backend、Admin、Web、API Client、Database、Deployment、Documentation | 修复生产阻断、契约说明和文档漂移，补齐迁移、恢复、边界与跨栈验收 |
| `plans/2026-08-21_BrowserE2E人工触发与发布解耦计划.md` | 已结束 | 已完成 | Deployment、Documentation | 将 Browser E2E 改为人工触发，并取消镜像发布对 E2E 成功记录的依赖 |
| `plans/2026-08-21_BrowserE2E就绪探测修复计划.md` | 已结束 | 已完成 | Admin、Deployment、Documentation | 修复 Umi 首次编译期间 2xx HTML 回退页导致 Browser E2E 过早启动的问题 |
| `plans/2026-08-20_Admin技术栈文档一致性审计计划.md` | 已结束 | 已完成；当前性文档、历史边界和项目结构索引已同步 | Admin、Deployment、Documentation | 全量核对 Admin 技术栈、入口、命令、端口和验证文档与实现一致 |
| `plans/2026-08-20_CI失败修复计划.md` | 已结束 | 已完成本机复验；Linux CI 兼容性仍待线上复验 | Backend、Web、依赖安全、CI、Documentation | 修复线上 CI 暴露的格式、类型和依赖漏洞门禁问题 |
| `plans/2026-08-20_GitHub CI线上失败修复计划.md` | 已结束 | 本地修复与 Admin 验证完成；遗留的线上就绪失败由后续专门计划承接 | Backend、Admin、Database、CI、Documentation | 修复 Alembic 漂移、Admin 代理校验、E2E 登录方式、启动时序和 HTML 可访问性问题 |
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
| `plans/2026-08-13_阶段B应用运行与测试基础设施计划.md` | 已结束 | 已完成 | Backend、Admin、Web、API Client、Database、Deployment、Documentation | 完成三个应用运行、测试、契约和容器基础设施，不包含认证与具体业务领域 |
| `plans/2026-08-14_阶段C通用业务核心能力计划.md` | 已结束 | 已完成 | Backend、Admin、Web、API Client、Database、Deployment、Documentation | 对照两个参考项目完成认证、会话、用户、RBAC、审计、日志和真实跨栈验收 |
| `plans/2026-08-15_Dependabot自动分支停用与Git分支收敛计划.md` | 已结束 | 已完成 | 全栈治理、GitHub、Documentation | 已停用自动依赖分支、关闭相关 PR，并将本地和远程分支收敛为 `main` |
| `plans/2026-08-16_CI跨平台与CodeQL权限修复计划.md` | 已结束 | 已完成 | 全栈治理、GitHub Actions、Backend、Admin、Documentation | 修复 Governance Linux 兼容，以 Semgrep CE 替换私有仓库不可用的 CodeQL，并完成供应链门禁与线上五工作流验收 |
| `plans/2026-08-17_密码规则与API中文化计划.md` | 已结束 | 已完成 | Backend、Admin、Web、API Client、Documentation | 统一密码规则、API 顶层消息和 OpenAPI 中文描述并完成跨栈验证 |
| `plans/2026-08-17_初始管理员默认用户名计划.md` | 已结束 | 已取消 | Backend、Deployment、Documentation | 用户决定继续通过必填 `--username` 显式创建初始管理员，未实施默认用户名变更 |
| `plans/2026-08-17_Web首页登录态操作按钮计划.md` | 已结束 | 已完成 | Web、Documentation | Web 首页根据服务端真实登录态隐藏登录和创建账户按钮，并补充登录前后浏览器验证 |
| `plans/2026-08-19_Admin升级AntDesign6计划.md` | 已结束 | Admin Umi Max/Ant Design 6 迁移、运行时修复、质量门禁和浏览器冒烟已完成；完整跨栈/容器验证受本机环境限制 | Admin、API Client 消费验证、Deployment、Documentation | 全面迁移官方 Ant Design Pro v6/Umi Max，同时保留项目安全、契约和质量边界 |
| `plans/2026-08-20_请求日志错误入参捕获与脱敏管道计划.md` | 已结束 | 已完成；105 项 Backend pytest 和真实 PostgreSQL/Redis 集成验证已通过 | Backend、Admin、API Client、Database、Documentation | 落地错误请求入参捕获、敏感字段脱敏与 4KB 截断兜底的最佳实践管道 |
| `plans/2026-08-20_后端文件日志与环境变量配置化计划.md` | 已结束 | 已完成；后续修复为 UTF-8 JSON Lines，六个请求关联字段和 106 项真实依赖 pytest 已通过 | Backend、Deployment、Documentation | Loguru 异步文件落盘、环境变量受控配置化与自动清理轮转策略 |

## 当前系统状态

| 范围 | 当前状态 | 事实依据 |
| --- | --- | --- |
| Backend | 认证、RBAC、会话、审计、统一资产及用户和角色原子批量能力已实现；旧版管理员确认端点仅作为弃用契约兼容保留至 2026-09-26，不承担授权；本次轻量门禁通过，pytest 按策略未执行 | `apps/backend/app/`、`apps/backend/scripts/`、`apps/backend/tests/`、`apps/backend/pyproject.toml` |
| Admin | 官方 Ant Design Pro v6/Umi Max 管理应用保留既有能力；用户、管理员、角色和文件资产普通数据列表均支持受权限控制的批量操作，安全日志继续只读；本次 typecheck 与 lint 通过，Vitest、production build 和浏览器验证按策略未执行 | `apps/admin/src/`、`apps/admin/scripts/`、`patches/`、`docs/architecture/admin-engineering-standard.md` |
| Web | 注册登录、SSR 用户中心、会话恢复、资料、密码、退出、注销、受限 BFF、文件上传与静态资源代理、运行时 Metadata 和安全响应头已实现；typecheck、lint、31 项 Vitest、88.30% 语句与行覆盖率、production build、Windows standalone 冷启动与桌面/移动跨栈 E2E 通过 | `apps/web/src/`、`apps/web/Dockerfile` |
| API Client | 根 OpenAPI 共 52 条路径、60 个操作，357 个公开 Schema 字段均具有中文说明；根契约和 Client 已重新生成且幂等，并由 Admin/Web 共享消费 | `packages/api-client/src/`、根 `openapi.json` |
| Database | 身份、分页会话、Refresh Token、RBAC、安全日志与统一资产迁移已实现，本地开发库已到 `20260825_03`；PostgreSQL advisory lock 并发保护、级联删除、资产元数据、`alembic check` 和独立 `_test` 数据库验证通过 | `apps/backend/alembic/`、`apps/backend/app/db/models/`、`apps/backend/scripts/cleanup_security_logs.py` |
| Deployment | 自动 Backend CI 只运行静态、导入与契约门禁，自动 Frontend CI 只运行 Admin/Web typecheck 和 lint；Browser E2E 保持纯人工触发，生产 Compose 与镜像发布职责不变 | `.github/workflows/ci-backend.yml`、`.github/workflows/ci-frontend.yml`、`.github/workflows/ci-e2e.yml` |
| Documentation | 产品需求、两端规则、Admin 工程标准、认证授权、资产补偿架构、Changelog、计划和索引已同步列表批量治理与管理端点显式权限规则 | `docs/PROJECT_REQUIREMENTS.md`、`docs/architecture/admin-engineering-standard.md`、`docs/architecture/authentication-authorization.md`、`docs/architecture/file-asset-storage.md` |

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
| Admin 工程实施标准 | `docs/architecture/admin-engineering-standard.md` | 保存 Admin Umi/Pro、Feature、请求、状态、组件选择和依赖准入的实施方式；长期红线继续由 Admin AGENTS 负责 |
| Markdown 格式规则与检查 | 根 `.markdownlint.json`、`package.json` 的 `lint:md` | GFM 语法基线、统一具体写法及固定版本的全仓库命令行检查 |
| Codex Windows 权限、网络、凭据与 ACL 治理 | `docs/operations/codex-windows-config-acl-governance.md` | 保存 `config.toml`、默认联网、Schannel、GitHub CLI Keyring、原生沙箱、迁移、Owner/ACL、缓存、Git 审批、验证、最小修复和回滚标准 |
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

## 本次文档治理补充

| 路径 | 状态 | 用途 |
| --- | --- | --- |
| docs/operations/admin-local-development-and-validation-troubleshooting.md | 生效 | Admin Umi 本地启动、测试、浏览器验证、跨栈前置条件和迁移故障排查 |
| plans/2026-08-20_Admin本地运行与故障排查文档治理计划.md | 已结束 | 沉淀本次运行、测试和 Windows 系统故障的规则分层结果 |
