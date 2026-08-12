import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 生产部署使用 standalone 模式，适合容器化部署
  // 容器化场景下不使用 ISR，实时性页面统一走 SSR + 后端 Redis 缓存
  output: "standalone",
};

export default nextConfig;
