# Admin 登录输入框 Filled 半透明视觉计划

## 当前状态和结果

- 状态：已结束
- 结果：已完成 Ant Design Filled 变体、透明默认边框和半透明分层背景；Admin typecheck、lint、Markdown lint 与文本卫生检查通过，重型验证按项目策略未执行。

## 关联需求

- `BASE-ADMIN-002`：保留清晰、可识别的管理员登录入口。
- `BASE-ADMIN-005`：登录表单保持紧凑、清晰并适合高频操作。

## 背景

当前登录页用户名与密码输入框已经使用半透明白色背景，但默认状态仍显示低对比度边框。用户参考 Ant Design Filled 输入框，希望两个控件采用视觉无边框与半透明填充效果，并继续融入当前登录页的多色浅背景。

## 目标

- 用户名和密码输入框统一使用 Ant Design 原生 `filled` 变体。
- 默认状态使用透明边框与半透明白色填充，形成视觉无边框效果。
- hover 提高填充不透明度，focus 保留轻量蓝色边界和焦点环。
- 保留现有高度、圆角、图标、文案、字重、校验、清除按钮和自动填充行为。
- 样式只作用于登录页，不影响 Admin 其他业务表单。

## 非目标

- 不修改登录接口、认证流程、会话、权限和错误处理。
- 不调整登录页背景、Logo、标题、按钮、辅助说明和版权文本。
- 不全局修改 Ant Design Input 主题或其他页面输入框。
- 不运行 production build、Vitest、Playwright 或浏览器自动化。

## 现状分析

- 两个控件当前使用 Ant Design 默认 outlined 变体。
- 登录页局部 CSS 已设置 `rgba(255, 255, 255, 0.72)` 半透明背景。
- 默认边框来自 `var(--login-control-border)`，视觉上仍可识别为有边框输入框。
- 当前 hover、focus、placeholder、内容字号和字重已经具有独立登录页样式，应完整保留并只调整边界与填充层次。

## 方案设计

1. 为 `Input` 和 `Input.Password` 显式设置 `variant="filled"`。
2. 登录页 Filled 包装器保留 `1px` 透明边框占位，避免状态变化引起尺寸跳动。
3. 默认背景使用较低不透明度白色，hover 提高不透明度，focus 使用接近实白背景。
4. focus 恢复低透明度蓝色边界与焦点环，保证键盘焦点可见。
5. 继续由内部 `.ant-input` 使用透明背景，避免内外层出现双重填充。

## 全栈影响矩阵

| 范围 | 是否涉及 | 工作内容 | 前置依赖 | 验证 |
| --- | --- | --- | --- | --- |
| Backend | 不涉及 | 登录接口和认证逻辑不变 | 无 | 无 |
| Admin | 涉及 | 登录输入框 Filled 变体和局部半透明样式 | Ant Design 6 | typecheck、lint、源码复读 |
| Web | 不涉及 | 无 | 无 | 无 |
| API Client | 不涉及 | 无契约变化 | 无 | 无 |
| Database | 不涉及 | 无 | 无 | 无 |
| Deployment | 不涉及 | 无 | 无 | 无 |
| Documentation | 涉及 | 维护计划、索引和 Changelog | 用户确认 | Markdown lint |

## 实施顺序

1. 创建计划并同步全项目索引。
2. 为登录页两个输入框设置 Filled 变体。
3. 调整登录页默认、hover 和 focus 局部样式。
4. 更新 Changelog。
5. 运行 Admin typecheck、lint 和 Markdown lint。
6. 复读差异并回写计划与索引完成状态。

## 影响文件

- `apps/admin/src/features/auth/LoginPage.tsx`
- `apps/admin/src/styles.css`
- `plans/2026-08-28_Admin登录输入框Filled半透明视觉计划.md`
- `PROJECT_INDEX.md`
- `CHANGELOG.md`

## 风险与回滚

- 风险：透明边框和过低背景不透明度可能降低输入框边界识别度。
- 控制：保留 Filled 背景层次，并在 hover 和 focus 状态增强边界与填充。
- 风险：直接移除边框可能造成聚焦状态尺寸跳动。
- 控制：保留透明 `1px` 边框占位，只隐藏默认视觉边界。
- 风险：选择器范围过宽影响其他表单。
- 控制：所有覆盖继续限定在 `.login-main` 下。
- 回滚：移除两个 `variant="filled"`，恢复当前登录页输入框边框和背景值。

## 验证清单

- [x] 用户名与密码输入框均使用 Ant Design Filled 变体。
- [x] 默认状态呈现视觉无边框与半透明填充。
- [x] hover 和 focus 状态层次清晰且无尺寸跳动。
- [x] 原有图标、文案、校验、自动填充和清除行为保持不变。
- [x] `pnpm --filter @pinjie/admin typecheck` 通过。
- [x] `pnpm --filter @pinjie/admin lint` 通过。
- [x] `pnpm lint:md` 通过。
- [x] production build、Vitest、Playwright 和浏览器自动化按项目策略记录为未执行。

## 待确认问题

- 无。用户已明确要求直接采用视觉无边框和半透明填充效果。

## 用户确认记录

- 2026-08-28：用户确认直接执行登录输入框 Filled 半透明视觉调整。

## 实施结果

- 用户名和密码控件均显式设置 `variant="filled"`，继续保留现有尺寸、圆角、图标、placeholder、校验和自动填充行为。
- 默认边框改为透明并保留原有边框占位，半透明白色背景调整为 `0.58`；hover 提升至 `0.72`。
- focus 使用 `0.9` 白色背景、`0.22` 透明度蓝色边界和低透明度焦点环，保持键盘焦点可见且不引起尺寸跳动。
- 所有视觉覆盖继续限制在 `.login-main`，Admin 其他业务表单不受影响。
- Changelog 已就地更新原有登录输入框条目，未建立重复事实。
- Admin typecheck、lint、Markdown lint、文本编码和差异卫生检查均通过。

## 剩余问题

- production build、Vitest、Playwright 和浏览器自动化按项目策略未执行。
