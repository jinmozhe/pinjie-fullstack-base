# Admin 角色权限 TreeSelect 树选择计划

## 当前状态和结果

- 状态：已结束
- 结果：已完成

## 关联需求

- `BASE-ADMIN-003`：提供角色与权限管理的清晰扩展位置。
- `BASE-ADMIN-004`：权限配置覆盖加载、空数据、失败、禁用和成功状态。
- `BASE-ADMIN-005`：高频权限配置保持紧凑、可搜索和可扫描。
- `BASE-ADMIN-006`：继续通过共享 API Client 消费后端权限契约。

## 背景

Admin 角色权限弹窗当前使用平铺的 `Checkbox.Group`。权限数量增长后，管理员难以快速定位同一业务域的权限，也无法按权限名称或代码搜索。用户要求参考 Ant Design `TreeSelect`，将权限配置改为树选择形式。

后端权限目录已经返回扁平 `PermissionRead[]`，每项包含稳定权限码、名称、说明和启停状态；角色权限保存接口接收 `permission_codes: string[]`。这些字段足以在 Admin 端按权限码前缀构建展示树，无需改变公开契约。

## 目标

- 使用 Ant Design `TreeSelect` 呈现角色权限目录。
- 按用户、管理员、角色与权限、安全与系统、文件资产等业务域分组。
- 支持父子联动勾选、名称和权限码搜索、默认展开与响应式标签展示。
- 已分配权限能够准确回填，停用权限保持可见但不可新增选择。
- 保存时只提交后端目录中的真实权限码，不提交内部父节点值。
- 未识别的权限前缀进入“其他权限”，避免新增权限静默丢失。

## 非目标

- 不修改 Backend 权限模型、权限目录和授权校验。
- 不修改 OpenAPI 契约、生成 API Client 或数据库结构。
- 不引入独立权限树接口或持久化分组字段。
- 不改变角色创建、编辑、删除、批量操作和会话撤销逻辑。

## 现状分析

- `GET /api/v1/admin/permissions` 返回扁平 `PermissionRead[]`，适合作为客户端树转换的唯一数据源。
- `PUT /api/v1/admin/roles/{role_id}/permissions` 接收权限码数组，TreeSelect 表单值可以继续保持 `string[]`。
- 当前权限弹窗已具备查询加载、失败、空态和保存错误反馈，改造时保留这些状态。
- 当前 `Checkbox.Group` 对停用权限使用 `disabled`，TreeSelect 叶节点应延续相同行为。
- Ant Design 6 `TreeSelect` 支持 `treeCheckable`、`showCheckedStrategy`、`showSearch` 和自定义 `filterTreeNode`，满足现有技术栈要求。

## 方案设计

1. 在角色 Feature 内定义权限分组配置，并按权限码第一个冒号前的资源前缀匹配分组。
2. 将每个权限映射为叶节点，标题同时展示名称与代码；分组节点使用内部命名空间值，避免与真实权限码冲突。
3. TreeSelect 启用多选树、父子联动、默认展开、搜索和 `SHOW_CHILD`，表单值继续使用 `string[]`。
4. 搜索同时匹配权限名称、权限码和分组名称。
5. 停用权限叶节点设为禁用；现有角色已经持有的停用权限仍回填显示，保存过滤不删除有效目录项。
6. 提交前建立真实权限码集合并过滤 TreeSelect 值，保证内部父节点永不进入请求体。
7. 调整权限弹窗宽度与 TreeSelect 节点样式，沿用当前 Ant Design Pro 的紧凑、克制视觉体系。
8. 更新角色权限组件测试源码，覆盖分组、回填、搜索、停用状态和真实权限码提交过滤。

## 全栈影响矩阵

| 范围 | 是否涉及 | 工作内容 | 前置依赖 | 验证 |
| --- | --- | --- | --- | --- |
| Backend | 不涉及 | 继续返回扁平权限目录并接收权限码数组 | 现有权限契约 | 无 |
| Admin | 涉及 | TreeSelect 树转换、交互、提交过滤、样式和测试源码 | Ant Design 6、共享 API Client | typecheck、lint、源码复读 |
| Web | 不涉及 | 无 | 无 | 无 |
| API Client | 不涉及 | 继续消费现有生成类型 | 根 OpenAPI 契约无变化 | 无漂移预期 |
| Database | 不涉及 | 无 | 无 | 无 |
| Deployment | 不涉及 | 无 | 无 | 无 |
| Documentation | 涉及 | 维护计划、索引和 Changelog | 用户确认与实施结果 | Markdown lint |

## 实施顺序

1. 创建计划并同步全项目索引。
2. 实现权限树分组、TreeSelect 表单和保存过滤。
3. 更新权限弹窗样式和角色权限测试源码。
4. 运行 Admin typecheck、lint 和 Markdown lint。
5. 复读差异，回写计划结果、索引和 Changelog。

## 影响文件

- `apps/admin/src/features/roles/RolesPage.tsx`
- `apps/admin/src/features/StageC.test.tsx`
- `apps/admin/src/styles.css`
- `plans/2026-08-28_Admin角色权限TreeSelect树选择计划.md`
- `PROJECT_INDEX.md`
- `CHANGELOG.md`

## 风险与回滚

- 风险：父节点内部值被误提交，导致后端拒绝请求或产生无效权限码。
- 控制：父节点使用保留前缀，提交前按当前权限目录集合过滤，并在测试源码中断言请求体。
- 风险：停用权限禁用后，已持有权限可能无法显示或被意外移除。
- 控制：回填仍使用真实权限码，停用只阻止新选择，提交保留目录中已有的有效权限码。
- 风险：未来新增权限前缀未登记分组。
- 控制：未知权限统一落入“其他权限”，避免静默丢失，后续可只调整前端分组配置。
- 回滚：恢复权限弹窗的 `Checkbox.Group` 与原样式，不涉及后端、契约和数据回滚。

## 验证清单

- [x] 固定业务域按树分组显示，未知权限进入“其他权限”。
- [x] 已有角色权限正确回填。
- [x] 叶节点和分组节点支持父子联动选择。
- [x] 搜索可按权限名称和权限码过滤。
- [x] 停用权限可见且不可新增选择。
- [x] 保存请求只包含真实权限码。
- [x] 原有加载、空数据、失败和保存错误状态保持不变。
- [x] `pnpm --filter @pinjie/admin typecheck` 通过。
- [x] `pnpm --filter @pinjie/admin lint` 通过。
- [x] `pnpm lint:md` 通过。
- [x] Vitest、production build、Playwright 和浏览器自动化按本轮授权边界记录为未执行。

## 待确认问题

- 无。用户已明确要求创建计划并实现，沿用讨论中确认的前端树转换方案。

## 用户确认记录

- 2026-08-28：用户确认参考 Ant Design TreeSelect 改造角色权限选择，并明确要求创建计划文档后直接实现。

## 实施结果

- 角色权限弹窗已从平铺 `Checkbox.Group` 升级为 Ant Design `TreeSelect`，启用父子联动勾选、`SHOW_CHILD`、默认展开、搜索和响应式标签。
- 扁平权限目录按资源前缀分为用户、管理员、角色与权限、安全与系统、文件资产五组，未知前缀稳定进入“其他权限”。
- 权限叶节点同时展示名称和代码，停用权限显示状态并禁用新增选择；现有角色权限继续使用真实权限码回填。
- 保存前按本次查询到的权限目录过滤并去重，内部父节点值和未知权限码不会进入后端请求。
- 新增纯函数与组件测试源码，覆盖固定分组、未知权限、停用状态、回填、搜索、叶节点选择和请求体过滤。
- 后端、OpenAPI、生成 API Client 和数据库均未修改。
- `pnpm --filter @pinjie/admin typecheck` 与 `pnpm --filter @pinjie/admin lint` 通过。

## 剩余问题

- Vitest、production build、Playwright 和浏览器自动化未执行；本次只完成项目默认轻量门禁与源码复读。
