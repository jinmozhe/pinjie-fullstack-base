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

开发服务器会把同域 `/api/v1` 请求代理到 Backend。生产静态容器使用 Nginx 维持相同代理路径。

## 阶段 B 范围

当前首页是业务中立的系统状态页，只消费真实 Backend 状态。认证、权限、业务菜单和具体领域由派生仓库在后续阶段添加。
