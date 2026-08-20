import { defineConfig } from "@umijs/max";
import routes from "./routes";

const backendURL = process.env.BACKEND_INTERNAL_URL ?? "http://127.0.0.1:8000";

export default defineConfig({
  title: "Pinjie Console",
  plugins: ["./config/html-accessibility"],
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
      target: backendURL,
      changeOrigin: false,
    },
  },
  define: {
    "process.env.APP_ENV": process.env.APP_ENV ?? "development",
    "process.env.VITE_API_URL": process.env.VITE_API_URL ?? "",
  },
});
