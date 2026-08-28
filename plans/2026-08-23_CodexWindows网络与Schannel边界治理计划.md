# Codex Windows 网络与 Schannel 边界治理计划

## 当前状态和结果

- 状态：已结束
- 结果：已完成。个人 Windows 开发机统一采用默认联网基线，Schannel 已知兼容边界、准确宿主升级兜底、禁止规避措施和升级复验删除条件已同步到权威手册、任务路由和根规则。

## 关联需求

- 无。此次调整属于个人 Windows 开发机的 Codex 运维与规则治理，不改变产品能力。

## 背景

本项目只由当前用户个人使用。用户已明确接受 Codex 沙箱命令联网风险，并将个人开发机基线确定为默认启用网络。

当前 Windows 原生 Codex `elevated + Custom` 沙箱中，DNS、TCP、HTTP 以及 Node HTTPS 已验证正常；Windows 自带 `curl.exe` 和 PowerShell HTTPS 在专用沙箱账户下可能返回 `SEC_E_NO_CREDENTIALS`。相同命令在宿主用户下正常，现有证据指向 Windows Schannel、沙箱账户 Profile 和受限 Token 的组合边界，但上游根因尚未最终确认。

现有权威文档仍以默认断网和网络反例为基线，需要同步为当前个人开发机事实，并固化安全的诊断与兜底边界。

## 目标

1. 将 Codex 沙箱命令默认联网写为当前项目唯一基线。
2. 记录 Schannel 已知兼容边界、客户端诊断矩阵和准确宿主升级兜底。
3. 禁止通过加载沙箱 Profile、挂载注册表 Hive、复制凭据、关闭 TLS 校验或长期完整访问规避问题。
4. 建立桌面端升级后的复验与兜底删除条件。

## 非目标

- 不修改 Backend、Admin、Web、API Client、数据库或部署行为。
- 不修改 Windows 沙箱账户、Profile、注册表、证书或凭据。
- 不把网络开启解释为 Git 提交、推送、发布或部署授权。
- 不把尚未由上游确认的底层原因写成确定事实。

## 现状分析

- 用户级配置采用 `workspace-write`、`elevated + Custom`、自动审查、精确 uv Cache 可写根和代理变量过滤。
- 用户已明确把 `network_access = true` 作为个人开发机默认值。
- Node HTTPS 在沙箱内可用，说明 DNS、TCP 和通用公网访问链路正常。
- Windows `curl.exe` 与 PowerShell HTTPS 使用 Schannel，在专用沙箱账户下可能失败并返回 `SEC_E_NO_CREDENTIALS`。
- 宿主用户执行相同 Windows HTTPS 命令正常，可作为按准确命令授权的临时兜底。

## 方案设计

### 1. 权威手册

更新 `docs/operations/codex-windows-config-acl-governance.md`，把默认联网、网络验收、Schannel 分类、兜底、禁止操作和升级复验集中维护在同一来源。

### 2. 任务路由与长期规则

- `docs/operations/ai-assisted-development-workflow.md` 只保留读取路由和简短当前基线。
- 根 `AGENTS.md` 增加稳定规则：遇到 `SEC_E_NO_CREDENTIALS` 时先按专项手册分类，禁止直接修改沙箱账户和 TLS 信任状态，必要时只升级准确宿主命令。

### 3. 治理同步

同步 `docs/README.md`、`PROJECT_INDEX.md`、`CHANGELOG.md` 和本计划结果，不新增 ADR 或应用级规则。

## 全栈影响矩阵

| 范围 | 是否涉及 | 工作内容 | 前置依赖 | 验证 |
| --- | --- | --- | --- | --- |
| Backend | 不涉及 | 无 | 无 | 不运行应用测试 |
| Admin | 不涉及 | 无 | 无 | 不运行应用测试 |
| Web | 不涉及 | 无 | 无 | 不运行应用测试 |
| API Client | 不涉及 | 无 | 无 | 不生成契约 |
| Database | 不涉及 | 无 | 无 | 不运行迁移 |
| Deployment | 不涉及 | 无 | 无 | 不运行部署检查 |
| Documentation | 涉及 | 更新 Codex Windows 运维手册、任务路由、根规则、索引和交付记录 | 用户已确认个人开发机默认联网 | Markdown 与治理门禁 |

## 实施顺序

1. 创建计划并同步全项目索引。
2. 更新 ACL 权威手册中的配置、分类、验收、禁止操作和升级复验。
3. 更新 AI 工作流和根 `AGENTS.md` 的稳定路由规则。
4. 同步文档索引、全项目索引、Changelog 和计划结果。
5. 运行 Markdown、工作区、边界、治理和差异检查。

## 影响文件

- `plans/2026-08-23_CodexWindows网络与Schannel边界治理计划.md`
- `PROJECT_INDEX.md`
- `AGENTS.md`
- `docs/operations/codex-windows-config-acl-governance.md`
- `docs/operations/ai-assisted-development-workflow.md`
- `docs/operations/local-dev-environment.md`
- `docs/README.md`
- `CHANGELOG.md`

## 风险与回滚

- 风险：把联网误解为其他外部副作用授权。通过根规则和权威手册明确分离。
- 风险：把当前 Schannel 现象写成永久产品限制。通过“已知边界”和升级复验删除条件控制。
- 回滚：只恢复本次文档与规则差异，不删除计划文件；计划按实际结果标记为已取消或已完成。

## 验证清单

- [x] `pnpm lint:md`
- [x] `pnpm check:workspace`
- [x] `pnpm check:boundaries`
- [x] `pnpm check:governance`
- [x] `git diff --check`
- [x] 复读所有修改段落并检查 UTF-8、链接、表格和规则一致性

## 待确认问题

- 无。用户已明确当前项目仅个人使用、默认启用网络、已接受风险，并授权直接修改文档且无需再次确认。

## 用户确认记录

- 2026-08-23：用户明确说明不存在团队与母版的不同基线，项目全部为个人使用；默认启用网络且已接受风险；授权直接修改相应文档，无需再次确认。

## 实施结果

- 权威手册的推荐配置已改为 `network_access = true`，并明确个人使用、风险接受、文件权限和外部副作用授权边界。
- 增加 Node/Python 与 Windows Schannel 客户端的对照诊断、`SEC_E_NO_CREDENTIALS` 分类、准确宿主升级兜底和敏感信息限制。
- 增加禁止加载沙箱 Profile/Hive、复制凭据、关闭 TLS 校验、修改系统信任库和建立常驻绕过机制的规则。
- 根 `AGENTS.md`、AI 工作流、本地环境手册、文档索引、全项目索引和 Changelog 已同步。
- `pnpm lint:md`、`pnpm check:workspace`、`pnpm check:boundaries`、`pnpm check:governance` 和 `git diff --check` 全部通过。
- 沙箱内首次边界检查因既有 `apps/backend/.pytest_cache` 读取 ACL 失败；未删除该非本次产生的缓存，改用准确宿主命令复验并通过。

## 剩余问题

- OpenAI 上游尚未确认或修复当前 Schannel 行为。该外部问题不阻塞文档治理，桌面端升级后按权威手册复验，系统客户端连续通过后删除宿主升级兜底。
