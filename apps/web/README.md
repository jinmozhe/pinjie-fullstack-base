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

浏览器请求使用同域 `/api/v1`，Next.js Route Handler 在服务端转发到 `BACKEND_INTERNAL_URL`。

## 生产部署模式

使用 `output: standalone` 容器模式，禁止在容器化环境使用 ISR（Incremental Static Regeneration）。商品详情页等实时性要求高的页面统一使用 SSR 模式，结合后端 Redis 缓存层保障性能。

## 阶段 B 范围

当前首页是业务中立的系统状态页，并包含基础错误、加载和不可用状态。认证、用户中心和具体业务 feature 由派生仓库在后续阶段添加。
