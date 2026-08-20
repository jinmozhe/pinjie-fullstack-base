import { defineConfig } from "@umijs/max";
import routes from "./routes";

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  layout: {},
  routes,
  history: { type: "browser" },
  hash: false,
  esbuildMinifyIIFE: true,
  npmClient: "pnpm",
  proxy: {
    "/api/v1": {
      target: "http://localhost:8000",
      changeOrigin: true,
    },
  },
  define: {
    "process.env.APP_ENV": process.env.APP_ENV ?? "development",
    "process.env.VITE_API_URL": process.env.VITE_API_URL ?? "",
  },
});
