import type { AdminRead } from "@pinjie/api-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";

import { AdminsPage } from "./admins/AdminsPage";
import { LoginPage } from "./auth/LoginPage";
import { AdminContext } from "./auth/auth-context";
import { RolesPage } from "./roles/RolesPage";
import { SecurityPage } from "./security/SecurityPage";
import { UsersPage } from "./users/UsersPage";
import { server } from "../test/setup";

const now = "2026-08-15T00:00:00Z";
const current: AdminRead = { id: "01900000-0000-7000-8000-000000000001", username: "stage-admin", display_name: "Stage Admin", is_active: true, is_superuser: true, roles: [], permissions: [], created_at: now, updated_at: now };
const restricted: AdminRead = { ...current, id: "01900000-0000-7000-8000-000000000009", username: "read-only", display_name: "Read Only", is_superuser: false, permissions: ["users:read", "admins:read", "roles:read"] };

function renderPage(node: ReactNode, principal: AdminRead | null = current) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<ConfigProvider locale={zhCN}><QueryClientProvider client={client}><MemoryRouter>{principal ? <AdminContext.Provider value={principal}>{node}</AdminContext.Provider> : node}</MemoryRouter></QueryClientProvider></ConfigProvider>);
}

async function confirmAction(user: ReturnType<typeof userEvent.setup>) {
  const password = await screen.findByLabelText("当前密码");
  await user.type(password, "stage-c-admin-password");
  await user.click(screen.getByRole("button", { name: /确认执行/ }));
  await waitFor(() => {
    const field = screen.queryByLabelText("当前密码");
    if (field) expect(field).not.toBeVisible();
    else expect(field).toBeNull();
  });
}

describe("stage C admin workspace", () => {
  it("logs in with an accessible form", async () => {
    const user = userEvent.setup();
    renderPage(<LoginPage authenticated={false} />, null);
    await user.type(screen.getByLabelText("用户名"), "stage-admin");
    await user.type(screen.getByLabelText("密码"), "stage-c-admin-password");
    await user.click(screen.getByRole("button", { name: /登\s*录/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /登\s*录/ })).toBeEnabled());
  });

  it("redirects authenticated administrators away from the login page", () => {
    renderPage(<Routes><Route path="/" element={<LoginPage authenticated />} /><Route path="/users" element={<p>已进入用户管理</p>} /></Routes>, null);
    expect(screen.getByText("已进入用户管理")).toBeInTheDocument();
  });

  it("loads users and supports editing and session inspection", async () => {
    const user = userEvent.setup();
    renderPage(<UsersPage />);
    expect(await screen.findByText("Browser User")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /编辑/ }));
    const displayName = screen.getByLabelText("显示名称");
    await user.clear(displayName);
    await user.type(displayName, "Updated User");
    await user.click(screen.getByRole("button", { name: /保\s*存/ }));
    await waitFor(() => {
      const dialog = screen.queryByRole("dialog", { name: "编辑用户资料" });
      if (dialog) expect(dialog).not.toBeVisible();
      else expect(dialog).toBeNull();
    });
    await user.click(screen.getByRole("button", { name: /会话/ }));
    expect(await screen.findByText("暂无数据", { selector: "div" })).toBeVisible();
  });

  it("protects user status, credential, and session operations with confirmation", async () => {
    const user = userEvent.setup();
    renderPage(<UsersPage />);
    expect(await screen.findByText("Browser User")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /停\s*用/ }));
    await confirmAction(user);

    await user.click(screen.getByRole("button", { name: /重置密码/ }));
    await user.type(screen.getByLabelText("新密码"), "replacement-password");
    await user.click(screen.getByRole("button", { name: /下一步/ }));
    await confirmAction(user);

    await user.click(screen.getByRole("button", { name: /会话/ }));
    expect(await screen.findByText("暂无数据", { selector: "div" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: /撤销全部/ }));
    await confirmAction(user);
  }, 20_000);

  it("loads administrators and opens role assignment", async () => {
    const user = userEvent.setup();
    renderPage(<AdminsPage />);
    expect(await screen.findByText("Stage Admin")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /角色/ }));
    expect(screen.getByText("分配角色")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /取\s*消/ }));
  });

  it("creates an administrator and confirms role assignment", async () => {
    const user = userEvent.setup();
    renderPage(<AdminsPage />);
    expect(await screen.findByText("Stage Admin")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /新建管理员/ }));
    await user.type(screen.getByLabelText("用户名"), "new-operator");
    await user.type(screen.getByLabelText("初始密码"), "new-operator-password");
    await user.click(screen.getByRole("button", { name: /下一步/ }));
    await confirmAction(user);

    await user.click(screen.getByRole("button", { name: /角色/ }));
    await user.click(screen.getByRole("button", { name: /下一步/ }));
    await confirmAction(user);
  }, 20_000);

  it("loads roles and the source-controlled permission catalog", async () => {
    const user = userEvent.setup();
    renderPage(<RolesPage />);
    expect(await screen.findByText("运营人员")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /权限/ }));
    expect(await screen.findByText("查看用户")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /下一步/ }));
    await confirmAction(user);
    await user.click(screen.getByRole("button", { name: /删除/ }));
    await confirmAction(user);
  }, 20_000);

  it("creates and edits source-controlled roles", async () => {
    const user = userEvent.setup();
    renderPage(<RolesPage />);
    expect(await screen.findByText("运营人员")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /新建角色/ }));
    await user.type(screen.getByLabelText("角色代码"), "auditors");
    await user.type(screen.getByLabelText("名称"), "审计员");
    await user.click(screen.getByRole("button", { name: /保\s*存/ }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "新建角色" })).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /编辑/ }));
    const dialog = await screen.findByRole("dialog", { name: "编辑角色" });
    const name = within(dialog).getByLabelText("名称");
    await user.clear(name);
    await user.type(name, "运营管理员");
    await user.click(within(dialog).getByRole("button", { name: /保\s*存/ }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "编辑角色" })).not.toBeInTheDocument());
  }, 20_000);

  it("switches between login, audit, and request metadata logs", async () => {
    const user = userEvent.setup();
    renderPage(<SecurityPage />);
    expect(await screen.findByText("success")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "审计事件" }));
    expect(await screen.findByText("users:update")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "请求元数据" }));
    expect(await screen.findByText("/api/v1/users/me")).toBeInTheDocument();
  });

  it("renders denied login, in-progress audit, and failed request states", async () => {
    const ok = (data: unknown) => HttpResponse.json({ code: "OK", message: "OK", data, request_id: "test-request" });
    server.use(
      http.get("http://localhost:3000/api/v1/admin/security/login-events", () => ok({ items: [{ id: "01900000-0000-7000-8000-000000000015", principal_type: "admin", principal_id: null, event_type: "login", succeeded: false, reason_code: "invalid_credentials", ip_address: null, user_agent_summary: null, request_id: "test-request", occurred_at: now }], page: 1, page_size: 20, total: 1, total_pages: 1 })),
      http.get("http://localhost:3000/api/v1/admin/security/audit-events", () => ok({ items: [{ id: "01900000-0000-7000-8000-000000000016", actor_id: current.id, action: "roles:update", target_type: "role", target_id: null, result: "started", changed_fields: {}, request_id: "test-request", occurred_at: now, completed_at: null }], page: 1, page_size: 20, total: 1, total_pages: 1 })),
      http.get("http://localhost:3000/api/v1/admin/system/request-logs", () => ok({ items: [{ id: "01900000-0000-7000-8000-000000000017", request_id: "test-request", trace_id: "test-trace", method: "POST", route_template: "/api/v1/admin/roles", status_code: 500, duration_ms: 12, principal_type: "admin", release_version: "test", occurred_at: now }], page: 1, page_size: 20, total: 1, total_pages: 1 })),
    );
    const user = userEvent.setup();
    renderPage(<SecurityPage />);
    expect(await screen.findByText("拒绝")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "审计事件" }));
    expect(await screen.findByText("started")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "请求元数据" }));
    expect(await screen.findByText("500")).toBeInTheDocument();
  });

  it("explains when request metadata logging is disabled", async () => {
    server.use(http.get("http://localhost:3000/api/v1/admin/system/request-logs", () => HttpResponse.json({ code: "REQUEST_LOG_DISABLED", message: "disabled", details: null, request_id: "test-request" }, { status: 409 })));
    const user = userEvent.setup();
    renderPage(<SecurityPage />);
    await user.click(screen.getByRole("tab", { name: "请求元数据" }));
    expect(await screen.findByText("请求元数据日志当前未启用")).toBeInTheDocument();
  });

  it("hides mutation controls from read-only administrators", async () => {
    const users = renderPage(<UsersPage />, restricted);
    expect(await screen.findByText("Browser User")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /编辑|停用|会话|重置密码/ })).not.toBeInTheDocument();
    users.unmount();

    const admins = renderPage(<AdminsPage />, restricted);
    expect(await screen.findByText("Stage Admin")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /新建管理员|角色|停用|会话/ })).not.toBeInTheDocument();
    admins.unmount();

    renderPage(<RolesPage />, restricted);
    expect(await screen.findByText("运营人员")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /新建角色|编辑|权限|删除/ })).not.toBeInTheDocument();
  }, 20_000);
});
