# 安全策略

## 支持范围

当前仓库处于 `0.x` 母版开发阶段，安全修复只维护默认分支的最新状态。正式版本发布后，需要在发布计划中补充受支持版本和停止支持日期。

## 报告漏洞

请通过 GitHub 仓库的 Private Vulnerability Reporting 提交安全问题，不要创建公开 Issue、Discussion 或 Pull Request。

报告应尽量包含：

- 受影响的路径、版本或完整 Commit SHA。
- 可重复的最小步骤和前置条件。
- 实际影响与可达权限。
- 已确认的日志或截图摘要，删除 Token、Cookie、密码、私钥和个人数据。
- 建议的缓解措施。

不要上传真实 `.env`、数据库备份、浏览器 Profile、HAR 原文或生产数据。若 GitHub 私密报告入口不可用，请只创建不含漏洞细节的普通 Issue，请求维护者提供私密渠道。

## 响应目标

以下是默认处理上限，派生项目可以在不降低安全性的前提下设置更严格目标：

| 严重级别 | 初次确认 | 缓解或修复目标 |
| --- | --- | --- |
| Critical | 1 个工作日 | 72 小时内完成缓解，随后完成根因修复 |
| High | 3 个工作日 | 14 个自然日内修复 |
| Medium | 7 个工作日 | 30 个自然日内修复 |
| Low | 10 个工作日 | 进入最近的计划迭代 |

无法按目标完成时，必须记录风险、临时控制、负责人和新的确认日期。临时控制不能依靠关闭认证、授权、审计或其他安全门禁。

## 安全开发要求

- 认证、授权、输入校验和资源权限在服务端生效。
- 真实密钥、凭据、生产数据和敏感样本不得进入仓库或日志。
- 安全修复必须包含回归测试或明确的验证证据。
- 公开 API、权限模型、迁移、生产工作流和安全配置属于高风险变更，需要 Code Owner 评审。
- 秘密、代码、依赖、容器和构建来源在对应阶段接受自动检查。
- 私有仓库静态代码扫描使用固定版本的 Semgrep Community Edition 和官方 `p/default` 规则集，在 CI Runner 内本地执行，不依赖云端账号或源码上传；`--error --strict` 确保安全发现、规则或解析警告和内部错误都使门禁失败，`--metrics off` 禁止使用指标上报。
- Python 和 Node.js 新发布依赖默认经过七天冷却期后才可进入新的解析结果；pnpm 同时拒绝奇异传递依赖和包信任等级降级。历史依赖只允许精确包版本例外，紧急安全更新必须单独评审，不得永久关闭整项供应链策略。
- 已知高危问题不得通过无期限豁免、`continue-on-error` 或静默降级绕过。
- GitHub 远端启用漏洞告警、Secret Scanning、Push Protection 和 Private Vulnerability
  Reporting；Dependabot security updates 保持关闭，依赖修复继续通过人工计划、评审和验证交付。
- Actions 仅允许 GitHub-owned Actions 与当前工作流明确列出的第三方 Action，并要求完整
  Commit SHA Pinning；`main` Ruleset 和 `production` Environment 的单维护者审批风险以
  [GitHub Actions 工作流说明](docs/operations/github-actions-workflows.md)为当前事实来源。

详细边界见：

- [认证、授权与审计边界](docs/architecture/authentication-authorization.md)
- [错误与失败模型](docs/architecture/error-model.md)
- [事故响应手册](docs/operations/incident-response.md)
- [发布与回滚手册](docs/operations/release-and-rollback.md)

## 披露

修复完成并验证后，由维护者决定披露范围、时间和安全公告。未经协调不得公开仍可利用的细节、生产目标或敏感证据。
