# apps/admin

B 端管理后台，基于 Vite + React + Ant Design。

## 技术栈

- Vite + React 19 + TypeScript
- Ant Design 5.x + @ant-design/pro-components
- TanStack Query v5 + Zustand
- React Router v7
- @pinjie/api-client（自动生成 SDK）

## 本地启动

```powershell
pnpm install
pnpm dev   # http://localhost:3001
```

## 通用模块范围

母版只包含以下页面：

- `pages/login/`：登录页
- `pages/dashboard/`：数据大盘
- `pages/system/`：RBAC 权限管理与系统日志

业务扩展页面（如电商运营模块）通过派生仓库添加，不放入母版。
