# Admin 登录页品牌 Logo 统一计划

## 1. 当前状态和结果

- 当前状态：已结束
- 结果：已完成；登录页使用 `36px`、`#D32029` 扁平深红单色 SVG Mask，Admin typecheck、lint 与 Markdown lint 通过，浏览器验证按用户要求未执行。

## 2. 关联需求

- `BASE-ADMIN-002`：提供管理员登录与权限入口。

## 3. 背景

Admin 登录页当前使用临时的 `PJ` 菱形标识，与浏览器 `favicon.ico` 使用的红色品捷品牌图形不一致。仓库已存在同源矢量资源 `apps/admin/public/logo.svg`，可以直接用于登录页。

## 4. 目标

1. 将登录页临时标识替换为与 Admin 浏览器图标一致的品牌 Logo。
2. 使用仓库已有 SVG 资源，保证高分辨率显示清晰且不重复维护轮廓。
3. 保持登录、错误反馈、安全会话说明和忘记密码交互不变。
4. 保留品牌红色识别，将登录页版本收敛为 `#D32029` 扁平单色并缩小至 `36px`。

## 5. 非目标

1. 不修改认证接口、会话机制或权限逻辑。
2. 不调整登录页其他版式、文案和交互。
3. 不修改侧栏、顶部栏或 Web 应用品牌展示。

## 6. 现状分析

- `LoginPage.tsx` 使用嵌套 `span` 绘制旋转方框，并显示 `PJ` 文本。
- `apps/admin/public/logo.svg` 与 Admin 浏览器图标使用相同的红色三瓣旋流图形。
- `styles.css` 包含其他任务的未提交修改，本计划只精确调整登录页 Logo 规则。

## 7. 方案设计

1. 登录页通过 CSS Mask 加载 `/logo.svg` 的透明轮廓，不修改原始品牌资产。
2. Logo 作为装饰图形从无障碍树隐藏，页面标题继续提供品牌语义。
3. Mask 使用固定 `36px` 宽高和 `#D32029` 单色填充，移除 SVG 原有高光渐变在登录页中的视觉重量。
4. 同时声明标准 `mask` 与 `-webkit-mask`，覆盖 Admin 的现代浏览器运行环境。

## 8. 全栈影响矩阵

| 范围 | 是否涉及 | 工作内容 | 前置依赖 | 验证 |
| --- | --- | --- | --- | --- |
| Backend | 不涉及 | 无 | 无 | 无 |
| Admin | 涉及 | 替换登录页 Logo 结构和样式 | 已有 `/logo.svg` | Admin typecheck、lint |
| Web | 不涉及 | 无 | 无 | 无 |
| API Client | 不涉及 | 无 | 无 | 无 |
| Database | 不涉及 | 无 | 无 | 无 |
| Deployment | 不涉及 | 无 | 无 | 无 |
| Documentation | 涉及 | 维护计划、索引和 Changelog | 无 | Markdown lint |

## 9. 实施顺序

1. 更新登录页 Logo JSX。
2. 精确更新登录页 Logo 样式。
3. 运行 Admin typecheck、lint 和 Markdown lint。
4. 复读差异并回写计划结果。

## 10. 影响文件

- `apps/admin/src/features/auth/LoginPage.tsx`
- `apps/admin/src/styles.css`
- `plans/2026-08-28_Admin登录页品牌Logo统一计划.md`
- `.agents/agents-index.md`
- `CHANGELOG.md`

## 11. 风险与回滚

- 风险：SVG 可视边界与旧占位 Logo 不同，可能影响标题间距。
- 控制：固定 Logo 尺寸并保留现有 Flex 布局和间距。
- 回滚：恢复本计划对登录页 JSX 和 Logo CSS 规则的精确差异。

## 12. 验证清单

- [x] `pnpm --filter @pinjie/admin typecheck`
- [x] `pnpm --filter @pinjie/admin lint`
- [x] `pnpm lint:md`
- [x] 复读登录页 JSX、Logo CSS 和 Git 差异
- [x] 浏览器验证按用户要求不执行

## 13. 待确认问题

- 无。

## 14. 用户确认记录

- 2026-08-28：用户明确要求将登录页 Logo 换成实际 Admin 浏览器图标，并允许使用 SVG 或样式实现。
- 2026-08-28：用户明确要求不运行浏览器验证。
- 2026-08-28：用户确认采用扁平深红 `#D32029` 单色 Logo，并要求直接实施。

## 15. 实施结果

- 已将登录页临时 `PJ` 菱形标识替换为复用 `/logo.svg` 轮廓的 CSS Mask。
- 已使用固定 `36px` 尺寸和 `#D32029` 单色填充，去除登录页版本的高光渐变并降低视觉重量。
- 原始 SVG 与浏览器 favicon 保持原色，没有修改品牌源资产。
- 登录认证、错误反馈、安全会话说明和忘记密码弹窗没有改动。
- Admin typecheck、Admin lint 与全仓库 Markdown lint 均通过。
- 未运行 production build、Vitest、Playwright 和浏览器自动化。

## 16. 剩余问题

- 浏览器视觉效果未自动验证，这是用户明确要求保留的验证边界。
