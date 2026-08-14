import { defineConfig, devices } from "@playwright/test";

const backendURL = process.env.E2E_BACKEND_URL ?? "http://127.0.0.1:8000";
const reuseExistingServer = !process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "web-desktop",
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3000" },
    },
    {
      name: "web-mobile",
      use: { ...devices["Pixel 7"], baseURL: "http://127.0.0.1:3000" },
    },
    {
      name: "admin-desktop",
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3001" },
    },
    {
      name: "admin-mobile",
      use: { ...devices["Pixel 7"], baseURL: "http://127.0.0.1:3001" },
    },
  ],
  webServer: [
    {
      command: "pnpm --filter @pinjie/web start --hostname 127.0.0.1 --port 3000",
      url: "http://127.0.0.1:3000",
      reuseExistingServer,
      timeout: 120_000,
      env: { BACKEND_INTERNAL_URL: backendURL },
    },
    {
      command: "pnpm --filter @pinjie/admin preview --host 127.0.0.1",
      url: "http://127.0.0.1:3001",
      reuseExistingServer,
      timeout: 120_000,
      env: { BACKEND_INTERNAL_URL: backendURL },
    },
  ],
});
