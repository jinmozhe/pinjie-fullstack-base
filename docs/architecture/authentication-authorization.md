# 认证、授权与审计边界

## 1. 目标

本文件定义当前 Browser Cookie Profile 的身份认证、会话、权限声明、资源授权和审计机制。重大取舍以 [ADR 0010](../adr/0010-浏览器认证会话RBAC与审计决策.md) 为准，完整端点与验收规格保存在[阶段 C 计划](../../plans/2026-08-14_阶段C通用业务核心能力计划.md)。

## 2. 分层职责

| 层 | 职责 |
| --- | --- |
| Middleware | 请求 ID、Trace 上下文、安全头、可信代理边界和日志上下文 |
| Dependency | Cookie 或 Token 解析、会话校验、当前身份加载和通用权限依赖 |
| Router | 声明端点需要的身份、角色或权限，不执行资源查询 |
| Service/Policy | 结合资源归属、资源状态、租户或业务数据执行授权 |
| Database | 唯一约束、外键和适合数据库保证的数据不变量 |

身份认证失败使用 `401`，身份有效但无权执行使用 `403`。资源是否存在本身敏感时，可以按统一策略返回 `404`，同类接口必须保持一致。

## 3. 默认拒绝

- 受保护端点必须显式声明认证要求。
- 没有匹配授权规则时拒绝。
- 管理端页面隐藏、按钮禁用和客户端路由保护只改善体验，不承担安全控制。
- 超级管理员仍需经过统一身份、授权和审计链，禁止绕过。
- 后台任务和内部调用使用独立服务身份或明确调用上下文，禁止伪装最终用户。

## 4. 客户端认证 Profile

阶段 C 只开放 Web 与 Admin 的 Browser Cookie Profile：

- Access 与 Refresh 使用 `HttpOnly`、`SameSite=Lax` Cookie，生产必须启用 `Secure`，不设置 `Domain`。
- C 端 Cookie 使用 `pinjie_web_*` 命名，B 端使用 `pinjie_admin_*` 命名。Access 路径为 `/`，Refresh 分别限制到 `/api/v1/auth` 与 `/api/v1/admin/auth`。
- CSRF Cookie 允许浏览器读取，但只保存 Session 绑定的随机值。服务端只保存 HMAC 摘要，并以常量时间比较。
- 登录响应只返回主体、Session 与过期时间，不返回 Access Token 或 Refresh Token。
- Token 不进入 Zustand、`localStorage`、`sessionStorage`、URL、页面源码、日志或其他客户端可读持久化存储。
- Web 与 Admin 分别配置 `WEB_ORIGINS` 和 `ADMIN_ORIGINS`，两组值必须是无路径的绝对 HTTP(S) Origin 且不得重叠。登录、注册、Refresh、Logout 与其他 Cookie 写请求按当前 Profile 精确校验，不能用统一 CORS 列表替代 Profile 隔离。
- Web BFF 只允许已登记的方法与用户端路径，只转发 `pinjie_web_*` Cookie；Admin 反向代理只开放管理端路径和公共系统状态。代理过滤用于缩小攻击面，Backend 的 Profile、认证与授权检查仍是最终边界。

小程序、原生 App 和其他无法可靠使用 Cookie 的客户端属于后续 Public Client Bearer Profile。该 Profile 必须独立定义端点、Session 类型、客户端证明、Token 存储、轮换、撤销和测试契约，禁止临时复用浏览器登录响应输出 JSON Token。

## 5. JWT、密码与 Session

- Access JWT 使用 PyJWT 与固定 `HS256` allowlist。Web 和 Admin 分别使用独立 Secret 与 `pinjie-web`、`pinjie-admin` audience。
- JWT 必需 Claims 为 `iss`、`aud`、`sub`、`sid`、`jti`、`iat`、`nbf`、`exp`、`token_type` 和 `credential_version`，允许最多 30 秒时钟偏差。JWT 不保存角色、权限和个人资料。
- Web Access 默认 15 分钟，Admin Access 默认 10 分钟。验签后继续校验 PostgreSQL Session、主体状态与凭据版本。
- 密码使用 Argon2id。Hash 和 Verify 通过线程池执行，并由进程内信号量限制并发。未知用户名执行固定虚拟密码校验，避免明显的账号枚举时序差异。
- 用户和管理员在注册、修改、重置及初始创建时，新密码统一要求 6 至 64 个字符。登录、当前密码和二次确认输入最多接受 64 个字符；现存超过 64 个字符的密码需要先通过受控重置改为符合当前策略的密码。
- PostgreSQL 是 Session 和 Refresh Token 的权威来源。Refresh 原值只进入 `HttpOnly` Cookie，数据库保存 HMAC-SHA256 摘要。
- Refresh 闲置期限默认 7 天，Session 绝对期限默认 30 天。刷新通过行锁单次消费并旋转，已消费 Token 重放会撤销整个 Session Family。
- Session 列表统一使用 `items`、`total`、`page` 和 `page_size` 分页契约。超过绝对期限或撤销时间 30 天的 Session 由显式保留工具清理，关联 Refresh Token 通过外键级联删除。
- 用户或管理员修改自己的密码时递增 `credential_version`、保留并轮换当前 Session Cookie、撤销其他 Session。主体状态、管理员角色、超级管理员标记或管理员重置凭据变化时撤销受影响会话。

四个 JWT/HMAC Secret 必须至少包含 32 个 UTF-8 字节、彼此不同且不能使用模板值。认证启用后 Redis 必须为 `required`；生产缺少安全 Cookie、可信代理、明确 CORS 或 Release 配置时拒绝启动。

## 6. CSRF 与来源校验

- Cookie 身份的 `POST`、`PUT`、`PATCH` 和 `DELETE` 请求必须同时通过精确 Origin allowlist 与 `X-CSRF-Token` 校验。
- Refresh 与 Logout 使用 Refresh Cookie 和同一 Session 的 CSRF 对，普通受保护写请求使用 Access Cookie 对应的当前 Session。
- 登录和注册尚无 Session，仍执行 Origin 校验，并结合 `SameSite=Lax` Cookie 与 Redis 原子限流。
- 401 清理对应 Profile 的认证 Cookie。前端只允许一次受控 Refresh 和一次原请求重放，Refresh 端点本身不得递归重试；失败后才清理会话状态并进入登录失效流程。
- Logout 只有在服务端明确成功后才进入未认证页面；失败必须保留当前页面并展示可重试错误，不能把失败伪装为本地退出成功。

## 7. 权限模型边界

母版提供规范化 RBAC 基础，不预设复杂 ABAC、组织树和多租户数据权限。`PermissionCode` 与 `PERMISSION_CATALOG` 是权限目录源码，数据库通过显式 `scripts.sync_permissions --check/--apply` 同步；应用启动不自动修改权限表。

管理员、角色、权限及关联关系使用规范化表和外键。Admin 导航由前端代码维护，并按服务端返回的权限过滤，不建立动态菜单表。Dependency 校验端点权限，Service 在事务内读取权威资源状态并执行最终授权。超级管理员仍经过 Session、CSRF、二次确认、最后超级管理员保护和审计链；会减少有效超级管理员数量的写操作在同一 PostgreSQL 事务内取得固定 advisory lock，串行执行计数和修改。

高风险管理操作使用 5 分钟、一次性、动作与 Session 绑定的二次确认 Token。前端隐藏路由或按钮只改善体验，不承担授权控制。

## 8. 审计与请求元数据

以下事件默认属于高风险审计范围：

- 管理员登录成功、失败和会话失效。
- 角色、权限和管理员状态变化。
- 用户账号禁用、解锁、凭据重置和高风险资料变化。
- 数据导出、批量修改、删除和不可逆操作。
- 安全配置、部署和迁移等生产变更。

审计记录至少关联操作者、动作、目标、结果、时间和 `request_id`。高风险业务通过 `AuditCoordinator` 建立审计意图，成功变更与审计结果在同一事务提交；拒绝和异常由独立终结器记录。登录安全事件属于认证结果，写入失败时认证失败关闭。

普通访问日志使用结构化输出。可选请求持久化只支持 `REQUEST_LOG_MODE=metadata`，由 Redis Stream、Consumer Group、pending reclaim、DLQ 和 PostgreSQL `request_id` 唯一约束组成。正常请求不保存请求体；错误 JSON 请求只在非敏感路由捕获，递归脱敏敏感字段并限制为 4096 字符。登录、改密、二次确认等敏感路由、响应体、Cookie、Authorization 和 Token 永不进入请求日志。

登录安全事件和审计事件默认保留 180 天，请求元数据默认保留 30 天，已过期或已撤销 Session 默认额外保留 30 天。清理由显式 dry-run/`--apply` 脚本执行，不在请求进程内自动删除。应用日志、审计日志、指标和 Trace 各自承担独立职责。

## 9. 必测场景

- 未认证、凭据过期、凭据撤销和会话注销。
- 有身份但缺少权限。
- 资源属于其他主体或处于禁止操作状态。
- 权限在请求期间发生变化。
- 超级管理员和服务身份的审计链完整。
- 错误响应不泄露资源存在性或敏感上下文。
- C/B Secret、audience、Cookie、Session 和权限交叉使用均被拒绝。
- CSRF 缺失、错误 Origin、Refresh 并发与重放均失败关闭。
- 响应、浏览器存储、页面源码、日志和测试产物中没有 Token 泄露。
