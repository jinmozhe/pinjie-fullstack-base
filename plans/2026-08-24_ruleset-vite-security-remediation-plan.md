# Ruleset 与 Vite 高危漏洞整改计划

## 当前状态和结果

- 状态：已结束
- 结果：已替代；活动实施统一维护在中文路径计划，永久保留本文件作为重复创建审计记录。

## 关联需求

- `BASE-OPS-001`：Windows 本地开发服务应使用可复现且边界明确的启动方式。
- `BASE-OPS-002`：Node.js 依赖继续由根 `pnpm-lock.yaml` 唯一锁定。
- `BASE-OPS-003`：依赖与 Admin 启动方式变化后执行受影响质量门禁。
- `BASE-OPS-007`：通过工作分支和 Pull Request 完成 CI 验证，发布与部署继续独立授权。
- `BASE-OPS-008`：高危依赖和关键检查失败必须阻断合并。
- `BASE-SEC-005`：依赖供应链风险必须接受可重复检查并形成闭环。
- `BASE-QUAL-001`：不得把风险接受、告警关闭或跳过检查表述为漏洞修复。
- `BASE-DOC-004`：通过本计划记录范围、确认、实施和验证证据。

## 背景

提交 `59cce0f9e4d19bc569b86828862493d9ce5c8268` 直接推送到 `main` 时，GitHub Rule Suite 结果为 `bypass`。远端 `Protect main` Ruleset 要求 Pull Request 和 13 项状态检查，但用户 `jinmozhe` 配置了 `always` bypass，因此失败的 Security 工作流无法阻止提交进入默认分支。

同一提交的 Security 工作流发现 2 个 High、13 个 Moderate 和 3 个 Low 的 npm 审计结果。GitHub 当前 15 个 Open Dependabot Alerts 全部来自 Admin 的 Umi 依赖链固定引入 `vite@4.5.2`。其中两个 High 为 `CVE-2024-52011` 和 `CVE-2026-53571`。

截至 2026-08-24，npm 官方 Registry 中最新稳定版 `@umijs/bundler-vite@4.7.7` 仍精确依赖 `vite@4.5.2`。仓库历史已经移除过将 Umi 内部 Vite 4 强制升级到 Vite 6 的不兼容 override，因此本次不能恢复该做法。

## 目标

1. 移除日常维护者的 `always` Ruleset bypass，让 `main` 的 Pull Request 和 13 项状态检查真正阻断不合格提交。
2. 保留 Admin 当前 Umi Max、Ant Design Pro、Webpack 构建方式和全部既有功能。
3. 对当前未使用的 Umi Vite bundler 建立精确上游补丁，从依赖解析中移除 `vite@4.5.2`，并在未来尝试启用 Vite bundler 时明确失败。
4. 将本地 Admin 开发服务固定监听 `127.0.0.1`，减少构建工具开发服务器的网络暴露面。
5. 完成依赖审计、Admin 回归、仓库治理门禁和线上 Pull Request 检查。

## 非目标

- 不把 Umi 内部 Vite 强制升级到上游未声明兼容的主版本。
- 不迁移或替换 Umi Max、Ant Design Pro、React Router、页面功能、权限模型和 UI 样式。
- 不降低 Trivy、`pnpm audit`、Dependency Review 或 Ruleset 的失败门槛。
- 不把 High 漏洞关闭为可接受风险。
- 不发布 GHCR 镜像，不部署生产，不创建 Tag 或 Release。

## 现状分析

### Ruleset

- Ruleset ID：`21152538`
- 名称：`Protect main`
- 目标：默认分支 `main`
- 强制规则：禁止删除、禁止非快进更新、要求 Pull Request、要求 13 项状态检查。
- 当前绕过：用户 `jinmozhe` 的 `bypass_mode` 为 `always`。

### 依赖链

```text
@pinjie/admin
  -> @umijs/max@4.7.5
  -> umi@4.7.5
  -> @umijs/preset-umi@4.7.5
  -> @umijs/bundler-vite@4.7.5
  -> vite@4.5.2
```

Admin 当前没有启用 Umi Vite bundler，production build 使用 Umi 默认 Webpack 构建器。`@umijs/preset-umi` 仍会静态解析 Vite schema 并预解析 Vite bundler，因此仅从依赖清单删除包会导致启动失败，必须同时补丁这两个入口。

## 方案设计

### 1. 收紧默认分支

通过 GitHub REST API 更新同一个 Ruleset，保留名称、目标、条件、PR 规则和 13 项状态检查，仅把 `bypass_actors` 改为空数组。更新后重新读取 Ruleset，确认 `current_user_can_bypass` 为 `never` 或不再具有 `always`，并确认其余规则没有漂移。

后续日常交付流程固定为：创建 `codex/*` 分支、推送分支、创建 Pull Request、等待全部必需检查满足后合并。紧急恢复不得复用永久个人 bypass；确需临时放行时，应单独修改 Ruleset 并保留审计记录，完成恢复后立即撤销。

### 2. 移除未使用的 Vite 构建器

- 使用根 `.pnpmfile.cjs` 的精确 `readPackage` Hook，只对 `@umijs/preset-umi@4.7.5` 删除 `@umijs/bundler-vite` 依赖。
- 使用 pnpm `patchedDependencies` 补丁同一版本的 `@umijs/preset-umi`：Webpack 模式只加载 Webpack schema；Vite 模式明确抛出安全错误；Vite bundler 只在实际选择该模式时解析。
- 重新生成根 `pnpm-lock.yaml`，确认 `vite@4.5.2` 和 `@umijs/bundler-vite@4.7.5` 不再解析，Vitest 所需的安全 `vite@6.4.3` 继续保留。
- 补丁只允许命中精确版本。未来升级 `@umijs/preset-umi` 时安装必须重新评估，禁止让补丁静默套用到未知版本。

补丁负责人为仓库维护者。删除条件为 Umi 稳定版不再引入受影响 Vite，或 Admin 经新计划迁移到官方支持的安全构建链。最迟复核日期为 2026-09-21。

### 3. 限制本地监听

在 `apps/admin/scripts/run-umi.mjs` 中为开发进程显式设置 `HOST=127.0.0.1`，允许调用方通过显式环境变量覆盖。运维文档同步默认监听地址和覆盖风险，局域网共享必须由使用者有意配置并承担相应安全边界。

## 全栈影响矩阵

| 范围 | 是否涉及 | 工作内容 | 前置依赖 | 验证 |
| --- | --- | --- | --- | --- |
| Backend | 不涉及 | 不修改 Python 实现、接口和依赖 | 无 | 确认 OpenAPI 和 Backend 文件无漂移 |
| Admin | 涉及 | 补丁 Umi 依赖解析并限制开发监听 | 根锁文件重新解析成功 | lint、typecheck、test、build、启动监听检查 |
| Web | 不涉及 | 不修改 Web 实现 | 根锁文件可能机械变化 | `pnpm --filter @pinjie/web build` 或依赖差异证明不受影响 |
| API Client | 不涉及 | 不修改契约和生成客户端 | 无 | 检查生成目录无漂移 |
| Database | 不涉及 | 不修改 Model、迁移和数据 | 无 | 不执行数据库操作 |
| Deployment | 涉及 | 收紧 Ruleset，保留 13 项检查和 Security 门禁 | GitHub 身份认证可用 | API 复读、PR 线上检查 |
| Documentation | 涉及 | 同步计划、索引、安全与运维事实 | 实施和验证结果 | `pnpm lint:md`、文本卫生、治理门禁 |

## 实施顺序

1. 创建 `codex/security-ruleset-vite-governance` 分支，创建并登记本计划。
2. 更新远端 Ruleset，移除个人 `always` bypass 并复核其余规则。
3. 建立精确 pnpm Hook 和 Umi 上游补丁，重新生成根锁文件。
4. 修改 Admin 启动器并增加适用测试或机械验证。
5. 运行依赖审计、Admin 质量、必要 Web 构建和仓库治理门禁。
6. 同步 `SECURITY.md`、GitHub Actions 运维文档、Admin 运维文档、索引和 Changelog。
7. 推送工作分支、创建 Pull Request，等待 13 项必需检查满足后合并。

## 影响文件

- `.pnpmfile.cjs`
- `patches/`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `apps/admin/scripts/run-umi.mjs`
- `apps/admin/AGENTS.md`
- `SECURITY.md`
- `docs/operations/github-actions-workflows.md`
- `docs/operations/admin-local-development-and-validation-troubleshooting.md`
- `.agents/agents-index.md`
- `CHANGELOG.md`
- `plans/2026-08-24_ruleset-vite-security-remediation-plan.md`

## 风险与回滚

- 上游补丁可能遗漏 Umi 对 Vite bundler 的其他预加载路径。必须用冻结安装、Admin dev、test 和 production build 共同证明 Webpack 路径完整；失败时回退 Hook、补丁和锁文件。
- 未来 Umi 升级可能让精确补丁失效。版本不匹配应在安装阶段明确失败，并由新计划重新评估上游实现。
- 移除 `always` bypass 后，直接推送 `main` 会被拒绝。回滚时只允许在确认紧急恢复场景、影响范围和审计记录后临时恢复原 actor 配置。
- Admin 默认绑定回环地址后，局域网其他设备无法直接访问开发服务。需要共享时由维护者显式设置 `HOST`，不得把临时暴露写成默认值。
- 所有文件回滚以本计划开始前 Git 快照为边界，禁止改写历史或覆盖任务外修改。

## 验证清单

- [ ] Ruleset 不再包含 `always` bypass，PR 和 13 项状态检查保持不变。
- [ ] 冻结安装成功，锁文件不再包含 `vite@4.5.2` 和 `@umijs/bundler-vite@4.7.5`。
- [ ] `pnpm audit --audit-level high` 通过，High 和 Critical 为 0。
- [ ] `pnpm audit --audit-level low --json` 只保留既有三项限时接受风险，或如实记录新上游事实。
- [ ] Admin lint、typecheck、Vitest、production build 和开发监听检查通过。
- [ ] Web 受影响验证通过，API Client 无漂移。
- [ ] `pnpm check:workspace`、`pnpm check:boundaries` 和 `pnpm check:governance` 通过。
- [ ] `pnpm lint:md`、文本卫生和 `git diff --check` 通过。
- [ ] 工作分支 Pull Request 的必需检查满足后再合并。

## 待确认问题

- 无。用户已明确要求按照诊断建议实施修改并确认执行。

## 用户确认记录

- 2026-08-24：用户确认实施 Ruleset 收紧、依赖漏洞整改、回环监听和标准 PR 交付流程。

## 实施结果

- 已替代；未在本文件继续实施。

## 剩余问题

- 已替代；未在本文件继续实施。
