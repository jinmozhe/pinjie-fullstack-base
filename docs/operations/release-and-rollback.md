# 发布与回滚手册

## 1. 适用范围

本手册适用于母版及派生项目的镜像发布、生产部署和应用回滚。当前阶段只建立流程，任何真实发布、部署和回滚都需要用户分别授权。每个 GitHub Actions 工作流的触发条件、步骤和失败定位见[GitHub Actions 工作流说明](github-actions-workflows.md)。

## 2. 职责分离

| 流程 | 输入 | 输出 | 是否接触生产 |
| --- | --- | --- | --- |
| CI | Pull Request 或提交 | 质量与安全验证结果 | 否 |
| 镜像发布 | 完整 40 位 Commit SHA | 三个应用的镜像 digest、SBOM 和构建证明 | 否 |
| 生产部署 | 已验证的三个镜像 digest | GitHub Environment 部署记录 | 是 |
| 回滚 | 上一个已验证版本的三个 digest | 恢复后的部署记录 | 是 |

CI 通过不自动授权镜像发布，镜像发布完成不自动授权生产部署。

## 3. 发布前检查

1. 确认目标 Commit SHA 为完整 40 位十六进制值且存在于受保护分支。
2. 确认适用轻量 CI 全部通过，并为同一 Commit SHA 人工完成完整验证，生成仍在保留期内的 GitHub Artifact；没有关键 `skipped`、过期豁免或未解释告警。
3. 确认 OpenAPI、生成客户端、迁移和文档不存在未提交漂移。
4. 确认安全扫描、依赖审查和容器扫描满足当前门禁。
5. 确认数据库迁移的前向、回滚或恢复策略已经评审。
6. 确认生产配置、Secret 名称和权限没有在日志中暴露。
7. 确认回滚版本的三个镜像 digest 和数据库兼容范围。
8. 确认维护窗口、负责人、观察时长和停止条件。

任一关键证据缺失时停止，不使用 `latest`、重新构建旧版本或跳过检查替代。

## 4. 镜像发布

镜像发布分为 GitHub 源码交接和 CNB 构建发布两段，两段继续使用同一完整 Commit SHA：

1. 人工触发 GitHub `Handoff Source to CNB`，输入完整 40 位 Commit SHA。
2. GitHub 确认工作流从默认分支启动，检出指定提交并核对 `git rev-parse HEAD`。
3. GitHub 确认指定提交属于默认分支历史，且同一 SHA 的 Governance、Backend、Frontend 和 Security 四个 Push Run 全部成功。
4. GitHub 下载未过期的 `full-validation-<完整提交>` Artifact，核对 Full Validation Run、Commit SHA、pytest、Vitest、production build、Chromium Playwright、PostgreSQL 和 Redis 证据字段。
5. GitHub 使用受 `cnb-source-handoff` Environment 保护的最小权限 Token，把批准提交以非强制、只能快进的方式更新到 CNB `main`；CNB 已有提交不是目标 SHA 的祖先时停止。
6. CNB `main` Push 自动触发 `.cnb.yml`，再次核对仓库、分支、工作区 `HEAD` 和 `CNB_COMMIT` 完全一致。
7. CNB 使用固定 digest 的构建环境和 Trivy，按现有三个 Dockerfile 构建镜像，通过 TCR Registry 缓存加速二次构建，并以无标签候选 digest 推送到 TCR。
8. CNB 对三个候选 digest 执行 High、Critical 且已有修复的漏洞阻断，生成 CycloneDX JSON SBOM，验证 BuildKit 最大级别 provenance 和 TCR attestation manifest。
9. 三张镜像全部通过后，CNB 先检查三个 `sha-<完整提交>` 标签；标签指向不同 digest 时立即失败，全部无冲突后才创建标签并执行写后复核。
10. CNB 生成 `pinjie-cnb-tcr-release-v1` 结构化清单，保存 Build ID、Build URL、完整 Commit SHA、三个 TCR digest、扫描、SBOM 和 provenance 状态，并连同原始证据作为构建附件保留。

GitHub 源码交接成功只说明 CNB 已接收批准提交，不能表述为镜像发布成功。只有整个 CNB Pipeline 成功且发布清单通过结构化校验，三个 digest 才能进入部署授权。TCR 三个仓库之间没有事务，标签创建期间仍可能短暂部分可见；任一 CNB 阶段失败时部署停止。生产始终使用完整 digest，不依赖 SHA 标签不可变假设。

候选镜像因基础镜像中的可修复 High 或 Critical 漏洞失败时，先核对固定基础镜像摘要和上游修复版本。需要更新摘要时必须形成新提交，重新取得轻量 Push 工作流和同 SHA 完整验证证据，再重新发布；禁止移动既有 Tag、覆盖既有不可变标签、跳过扫描或把失败候选 digest 用于部署。

## 5. 生产部署

使用独立的 `Deploy Production` 工作流，输入三张镜像共同对应的完整 Commit SHA，以及 Backend、Web 和 Admin 的完整 `sha256:<64位十六进制>` digest。

部署前：

1. GitHub `production` Environment 必须配置所需评审者和受限分支。
2. 在该 Environment 中设置 `PRODUCTION_DEPLOYMENT_ENABLED=true`、绝对路径 `DEPLOY_PATH` 和部署所需 SSH Secret。
3. 确认部署目录的 `apps/backend/.env` 已配置生产运行变量且未进入仓库，根 `.env` 保存 Compose 镜像引用和 PostgreSQL 初始化变量。
4. 当前部署工作流仍从 GHCR 解析 `sha-<commit>` 标签，并确认三个 manifest digest 与输入完全一致。迁移到 TCR 时必须在独立生产部署授权下改为核对 CNB 发布清单和三个 TCR digest，当前 CNB 发布实现不会自动触发部署。
5. 确认当前数据库 Revision、目标 Revision 和备份恢复点。
6. 确认服务器 `compose.prod.yml` 与目标 Commit 中的文件哈希一致。
7. 验证 `compose.prod.yml` 解析结果只包含固定 digest。

部署时：

1. 使用并发锁保证同一环境只有一个部署或回滚。
2. 通过临时镜像变量文件完成配置校验、固定 digest 拉取和应用切换。
3. 应用等待成功后，逐个确认运行容器记录的镜像引用与批准 digest 完全一致。
4. 版本一致后原子替换根 `.env`，并写入 `.deployment-version` 保存 Commit SHA 与 Compose 哈希。
5. 观察 Startup、Readiness 和关键冒烟结果。
6. 达到停止条件时立即中止后续步骤，不自动选择其他版本。

部署后：

1. 查询实际运行容器 digest，并与输入逐一比较。
2. 记录完整 Commit SHA、三个镜像 digest、数据库 Revision、执行者、时间和验证结果。
3. 在观察窗口检查错误率、关键延迟和日志异常。
4. 未完成真实核验时不能标记部署成功。

## 6. 回滚决策

满足以下任一条件时评估回滚：

- Readiness 持续失败。
- 关键用户流程不可用或错误预算快速消耗。
- 数据校验失败或出现不可接受的不一致。
- 安全控制失效或发现高危暴露。
- 实际运行 digest 与批准输入不一致。

回滚使用上一个已验证 digest，禁止从旧源码临时重建。数据库已经执行向前迁移时，先判断旧应用是否仍兼容当前结构；无法证明兼容时按数据库恢复方案执行，不能只回滚应用。

## 7. 回滚步骤

1. 宣布进入回滚，暂停新的部署和高风险写操作。
2. 核对目标环境、当前 digest、回滚 digest 和数据库 Revision。
3. 确认回滚版本仍在镜像仓库且签名、SBOM 和来源证明可验证。
4. 执行数据库降级或恢复时再次取得专项授权。
5. 部署固定回滚 digest。
6. 验证探针、关键用户流程、数据摘要和审计链。
7. 记录原因、实际恢复时间、数据损失窗口和遗留风险。

## 8. 禁止事项

- 禁止 `latest`、分支标签和缺失版本默认值。
- 禁止在 CI 工作流中保存生产 SSH 密钥或执行生产部署。
- 禁止因应用回滚方便而执行未验证的数据库降级。
- 禁止通过删除健康检查、关闭安全扫描或扩大权限使部署变绿。
- 禁止把 Workflow 启动成功表述为生产部署成功。
