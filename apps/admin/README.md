# apps/admin

B 端管理后台，基于官方 Ant Design Pro v6 的 Umi Max 应用架构。

## 技术栈

- @umijs/max 4.7.x + React 19 + TypeScript
- Ant Design 6.x + @ant-design/pro-components 3.x + @ant-design/icons 6.x
- ProLayout、Umi 配置式路由、Access 权限和运行时 `app.tsx`
- TanStack Query v5，Browser Cookie 认证由项目 HTTP 层维护
- @pinjie/api-client（自动生成 SDK）

## 本地启动

```powershell
pnpm install
pnpm dev   # http://localhost:3001
```

开发服务器会把同域 `/api/v1` 请求代理到 Backend。生产构建输出 `dist`，静态容器使用 Nginx 维持相同代理路径。

## 当前范围

当前 Admin 已接入登录、Cookie 会话、RBAC 权限导航、用户、管理员、角色权限、安全日志和系统状态页面。页面继续通过 `@pinjie/api-client` 与 Backend 契约协作，危险操作保留二次确认、CSRF 和请求追踪。
