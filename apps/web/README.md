# apps/web

C 端用户前端，基于 Next.js App Router。

## 技术栈

- Next.js（App Router，`output: standalone`）
- Tailwind CSS + shadcn/ui
- Framer Motion
- TanStack Query v5 + Zustand
- @pinjie/api-client（自动生成 SDK）

## 本地启动

```powershell
pnpm install
pnpm dev   # http://localhost:3000
```

## 生产部署模式

使用 `output: standalone` 容器模式，禁止在容器化环境使用 ISR（Incremental Static Regeneration）。商品详情页等实时性要求高的页面统一使用 SSR 模式，结合后端 Redis 缓存层保障性能。

## 通用功能范围

母版只包含以下 feature：

- `features/auth/`：认证（登录表单、登出）
- `features/user/`：用户中心（个人资料、密码修改）

业务 feature（如 products、cart、orders）通过派生仓库添加，不放入母版。
