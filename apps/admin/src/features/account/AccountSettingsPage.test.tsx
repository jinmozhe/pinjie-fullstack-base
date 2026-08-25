import type { AdminRead } from "@pinjie/api-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { AdminContext } from "@/features/auth";
import { server } from "@/test/setup";
import { AccountSettingsPage } from "./AccountSettingsPage";

const mockAdmin: AdminRead = {
  id: "01900000-0000-7000-8000-000000000001",
  username: "settings-admin",
  display_name: "设置管理员",
  avatar: "https://example.com/avatar.png",
  is_active: true,
  is_superuser: true,
  roles: [{ id: "01900000-0000-7000-8000-000000000002", code: "super_admin", name: "超级管理组" }],
  permissions: ["users:read", "users:update"],
  created_at: "2026-08-24T00:00:00Z",
  updated_at: "2026-08-24T00:00:00Z",
};

function renderAccountSettingsPage(principal: AdminRead = mockAdmin) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <ConfigProvider locale={zhCN}>
      <QueryClientProvider client={client}>
        <AdminContext.Provider value={principal}>
          <AccountSettingsPage />
        </AdminContext.Provider>
      </QueryClientProvider>
    </ConfigProvider>,
  );
}

describe("AccountSettingsPage", () => {
  it("renders base settings tab with admin information", () => {
    renderAccountSettingsPage(mockAdmin);
    expect(screen.getByText("个人设置")).toBeInTheDocument();
    expect(screen.getByText("基本设置")).toBeInTheDocument();
    expect(screen.getByText("安全设置")).toBeInTheDocument();
    expect(screen.getByDisplayValue("settings-admin")).toBeDisabled();
    expect(screen.getByDisplayValue("设置管理员")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://example.com/avatar.png")).toBeInTheDocument();
  });

  it("submits profile update successfully", async () => {
    server.use(
      http.patch("http://localhost:3000/api/v1/admin/auth/profile", () =>
        HttpResponse.json({
          code: "OK",
          message: "个人资料已更新",
          data: { ...mockAdmin, display_name: "新昵称" },
        }),
      ),
    );

    const user = userEvent.setup();
    renderAccountSettingsPage(mockAdmin);

    const displayNameInput = screen.getByDisplayValue("设置管理员");
    await user.clear(displayNameInput);
    await user.type(displayNameInput, "新昵称");
    await user.click(screen.getByRole("button", { name: "更新基本信息" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "更新基本信息" })).toBeInTheDocument();
    });
  });

  it("switches to security tab and renders password form and security metadata", async () => {
    renderAccountSettingsPage(mockAdmin);
    fireEvent.click(screen.getByText("安全设置"));

    expect(screen.getByText("修改账户密码")).toBeInTheDocument();
    expect(screen.getByLabelText("当前密码")).toBeInTheDocument();
    expect(screen.getByLabelText("新密码")).toBeInTheDocument();
    expect(screen.getByLabelText("确认新密码")).toBeInTheDocument();

    expect(screen.getByText("账号身份与安全信息")).toBeInTheDocument();
    expect(screen.getByText("超级管理员")).toBeInTheDocument();
    expect(screen.getByText("超级管理组")).toBeInTheDocument();
    expect(screen.getByText("2 项有效权限")).toBeInTheDocument();
  });
});
