# 候选镜像验收与部署预检

## 1. 职责与顺序

GitHub 手动 Full Validation 验证源码和前端构建结果，CNB 构建并扫描生产镜像，TCR 保存镜像。手动 `Validate Candidate Images` 拉取三张固定 digest，在独立容器中运行现有 Chromium E2E，成功后生成部署组合。1Panel 继续只从 TCR 拉镜像，晋级过程不重新构建、不改变 digest、不自动部署。

候选验收放在 GitHub 托管 Linux Runner，避免让 CNB 的自动 Push 隐式执行重型测试。该 Runner 到 TCR 的拉取时间计入候选验收成本，生产腾讯云服务器的镜像下载路径不变。后续若测得这段网络成为瓶颈，可在独立计划中迁移验收执行位置，保持清单协议和授权边界。

源码交接的 `strict` 和 `fast` 保持原含义。`fast` 不免除部署前的三端镜像组合验收，也不能被描述为 pytest、Vitest 已通过。只读拉取身份、源码交接身份、镜像发布身份和生产部署身份继续分离。

## 2. 首次启用

1. 将流程代码通过既有轻量门禁交付到 `main`。本地实现完成不代表云端验收成功。
2. 在 GitHub 创建 `candidate-image-validation` Environment，只允许受保护的 `main`，按现有单维护者审批策略配置。
3. 配置专用于候选验收的 `TCR_READ_USERNAME`、`TCR_READ_PASSWORD` Secrets，权限限定为三个 TCR 仓库的只读拉取。不要复用生产凭据或 CNB 写入凭据。个人版配置步骤见 [CAM 最小权限手册](tencent-tcr-personal-cam-accounts.md)。
4. 显式运行新版 Full Validation，再执行严格源码交接和 CNB 三端构建。新版证据为 `pinjie-full-validation-v2`，明确包含 Admin `nginx-dist` 和 Web `standalone`；旧 v1 证据不能证明修正后的生产产物验收，不再被新版严格门禁接受。
5. 下载三条成功 CNB Pipeline 的附件，分别保留其中 `backend-release-manifest.json`、`web-release-manifest.json`、`admin-release-manifest.json`，以及原始扫描、SBOM 和 provenance 证据。

已有生产镜像和历史回滚资料继续保留。新组合验收要求来源具有新版 `source-handoff-<SHA>-<attempt>` Artifact；缺少历史交接证据时不伪造补录。首次启用应使用包含本流程的新提交构建三端并取得新的完整证据。

## 3. 生成请求

在已安装 Node.js 24 和锁定 pnpm 依赖的仓库根目录执行。下面的路径、SHA、Run ID 和域名均需换成实际非敏感发布值。

```powershell
node scripts/release/release-tools.mjs request `
  --backend C:/release/backend-release-manifest.json `
  --web C:/release/web-release-manifest.json `
  --admin C:/release/admin-release-manifest.json `
  --backend-handoff 123456789 `
  --web-handoff 123456789 `
  --admin-handoff 123456789 `
  --test-commit <完整40位SHA> `
  --web-origin https://www.example.com `
  --output C:/release/candidate-request.json
```

命令只生成文件，不触发工作流。输出文件已存在时拒绝覆盖。输入使用完整 CNB 单镜像清单，禁止只把标签或人工拼接的 digest 当作发布证据。

`test_commit` 是本次组合的目标源码与浏览器测试版本。未改动端可以使用较早的 SHA；脚本核对该 SHA 是 `test_commit` 的祖先，并直接复用 `.cnb.yml` 的应用路径规则检查两者差异。受影响端必须重新构建，不能让旧镜像冒充新提交产物。公开契约或数据库语义变化仍需人工按全栈计划评审，路径检查不代替兼容性判断。

## 4. 手动验收

1. 在 GitHub Actions 选择 `Validate Candidate Images`，从 `main` 手动运行，将请求文件的 JSON 填入 `request_json`。
2. 等待整个 Run 成功。该操作明确运行三端镜像、测试数据库迁移和现有 Chromium E2E，不执行 pytest、Vitest，也不重新构建前端或生产镜像。
3. 下载 `deployment-composition-<Run ID>-<attempt>` 中的 `deployment-composition.json` 和 `images.env`。
4. 同时保存 Run URL、三端 CNB 附件、当前生产和回滚清单。部署证据默认保留 90 天，长期审计应在受控发布记录中归档；不能把 Artifact 过期当作允许绕过校验的理由。

执行门禁包括：

- 三张单镜像清单字段、固定仓库、源码祖先和应用构建输入一致性。
- GitHub API 核对同仓库、默认分支、手动成功的 Handoff Run，再下载其实际 Artifact；交接模式、快速模式理由、Full Validation Run 和 attempt 随组合保存。
- TCR SHA 标签对应的 digest、Linux AMD64 平台、OCI source/revision 和 BuildKit attestation 存在性。CNB 证据与注册表由受限发布身份写入，不能把 JSON 校验描述为密码学签名认证。
- 使用固定应用 digest、独立 Compose 项目、临时 PostgreSQL/Redis、随机测试凭据，容器中执行 Alembic、权限同步、注册设置和初始管理员创建。
- 三端健康检查、现有桌面与移动端 E2E；继续使用单 worker，CI 中重试后才成功的 flaky 测试也会阻断。
- 成功退出并清理本次容器、网络和数据卷后才生成部署组合。工作流另有 `always()` 收尾。测试环境不接入 `1panel-network`，不读取生产配置。

验收范围是独立测试环境中的生产镜像组合，不包含公网 TLS、1Panel OpenResty、真实生产参数、生产数据升级或高可用。运行成功不能替代生产迁移评审、备份和上线健康复验。

## 5. 1Panel 变量预检

`images.env` 只包含 `BACKEND_IMAGE`、`WEB_IMAGE`、`ADMIN_IMAGE`、`WEB_PUBLIC_ORIGIN`。根据批准组合更新服务器根 `.env` 和 1Panel 编排“环境变量”页，然后把该页四项值导出或整理为单行赋值格式的 `panel.env`，不包含 Backend 密钥。

在受控操作机的仓库根目录执行，操作机需要 Node.js 24、项目依赖及具备仓库 Actions 读取权限的 GitHub CLI 登录态：

```powershell
node scripts/release/release-tools.mjs preflight `
  --manifest C:/release/deployment-composition.json `
  --env-file C:/release/server-images.env `
  --panel-env C:/release/panel.env
```

工具通过 GitHub API 重新核对候选 Run、工作流路径、attempt、源码及其实际 Artifact，再比较本地清单和两份变量。字段缺失、重复、可变标签、digest 或 Origin 不一致均失败；错误只指出字段名，不输出变量值。它不访问 1Panel API，不读取 `apps/backend/.env`，也不代替操作人员确认导出内容与面板当前状态一致。

预检通过后再按 [1Panel 运行手册](1panel-production-runbook.md) 执行已授权的拉取、迁移、更新和健康检查。服务器只需要既有 Docker、Compose 和 1Panel，不需要为这个预检安装 Node.js 或 GitHub CLI。

## 6. TCR 保留计划

工具只计算审查清单，不调用 TCR 删除 API。先从控制台或已授权的只读 API 导出三个仓库的完整标签清单，规范为以下结构；时间使用注册表实际推送时间，digest 使用 OCI index digest：

```json
{
  "schema": "pinjie-tcr-inventory-v1",
  "captured_at": "2026-09-06T00:00:00Z",
  "tags": [
    {
      "app": "backend",
      "tag": "candidate-123456789",
      "digest": "sha256:<64位实际摘要>",
      "created_at": "2026-08-01T00:00:00Z"
    }
  ]
}
```

```powershell
node scripts/release/release-tools.mjs retention `
  --inventory C:/release/tcr-inventory.json `
  --protect C:/release/production-composition.json `
  --protect C:/release/rollback-composition.json `
  --output C:/release/retention-review.json
```

清单必须在 24 小时内采集，至少提供生产与回滚两个组合，并能在库存中找到全部受保护 digest。还可重复 `--protect` 增加其他环境、待部署组合或历史回滚点。没有新版组合的历史版本需继续人工保护，不能为运行工具伪造验收清单。

默认保护生产与回滚 digest 的全部标签、缓存标签、30 天内候选、90 天内源码标签及无法识别的支持制品。超期候选和源码标签仅进入 `review`，操作人员还须核对正在运行的 CNB Build、未结束发布和审计保留要求。实际删除需独立授权、重新核对实时库存，并确认平台删除标签不会破坏共享 manifest、子架构、attestation 或 SBOM。工具不提供 manifest/blob 垃圾回收。

TCR 个人版每仓版本额度有限，不能只依赖按天保留；接近容量上限时优先审查已失效候选标签与重复别名，再按回滚需求调整保留窗口。需要 SLA、自动保留或 VPC 内网拉取时再评估同地域企业版，当前方案不要求升级。

## 7. 诊断与维护

Full Validation 的 Backend、Admin、Web 阶段并行，E2E 等全部成功后下载同一 Run 的构建结果。前端产物保留 3 天，耗时与脱敏结果保留 14 天，成功 v2 证据保留 30 天。只重跑失败 Job 时可以复用同 Run、同 SHA 的成功产物；产物过期后应重跑所有 Job。

候选失败 Artifact 仅含阶段、耗时、退出状态及浏览器文件位置、项目和重试结果。CI 不生成 Trace/Video，不上传 HTML、Cookie、HAR、数据库连接串、原始服务日志或截图。诊断信息不足时针对失败范围显式授权复现；不能直接把含会话数据的报告打包上传。

首次云端运行应记录依赖安装、pytest、Vitest、构建、制品上传下载、镜像拉取和 E2E 耗时，再决定是否继续加缓存或迁移 Runner。历史固定 epoch 测得的缓存收益不代表当前 Git committer time 策略的收益。

官方依据：[GitHub YAML 锚点](https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations)、[Playwright CI](https://playwright.dev/docs/ci)、[Trivy 报告转换](https://trivy.dev/latest/docs/configuration/reporting/)、[TCR 个人版限制](https://cloud.tencent.com/document/product/1141/57780)。
