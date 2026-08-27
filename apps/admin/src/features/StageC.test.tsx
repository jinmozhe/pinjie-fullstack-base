import type { AdminRead } from "@pinjie/api-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";

import { describe, expect, it } from "vitest";

import { AdminsPage } from "./admins/AdminsPage";
import { AssetsPage } from "./assets/AssetsPage";
import { LoginPage } from "./auth/LoginPage";
import { AdminContext } from "./auth/auth-context";
import { RolesPage } from "./roles/RolesPage";
import { SecurityPage } from "./security/SecurityPage";
import { UsersPage } from "./users/UsersPage";
import { server } from "../test/setup";

const now = "2026-08-15T00:00:00Z";
const current: AdminRead = { id: "01900000-0000-7000-8000-000000000001", username: "stage-admin", display_name: "Stage Admin", is_active: true, is_superuser: true, roles: [], permissions: [], created_at: now, updated_at: now };
const restricted: AdminRead = { ...current, id: "01900000-0000-7000-8000-000000000009", username: "read-only", display_name: "Read Only", is_superuser: false, permissions: ["users:read", "admins:read", "roles:read", "assets:read"] };
const otherAdmin: AdminRead = { ...current, id: "01900000-0000-7000-8000-000000000010", username: "other-admin", display_name: "Other Admin", avatar: "/static/uploads/avatar/other.png", is_superuser: false };

function renderPage(node: ReactNode, principal: AdminRead | null = current) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  window.history.replaceState({}, "", "/");
  return render(<ConfigProvider locale={zhCN}><QueryClientProvider client={client}>{principal ? <AdminContext.Provider value={principal}>{node}</AdminContext.Provider> : node}</QueryClientProvider></ConfigProvider>);
}

async function confirmWarning(user: ReturnType<typeof userEvent.setup>, title: string) {
  const dialog = screen.getByRole("dialog", { name: title });
  expect(within(dialog).queryByLabelText("当前密码")).not.toBeInTheDocument();
  await user.click(within(dialog).getByRole("button", { name: "确定" }));
}

describe("stage C admin workspace", () => {
  it("logs in with an accessible form", async () => {
    const user = userEvent.setup();
    renderPage(<LoginPage authenticated={false} />, null);
    await user.type(screen.getByLabelText("用户名"), "stage-admin");
    expect(screen.getByLabelText("密码")).toHaveAttribute("maxlength", "64");
    await user.type(screen.getByLabelText("密码"), "stage-c-admin-password");
    await user.click(screen.getByRole("button", { name: /登\s*录/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /登\s*录/ })).toBeEnabled());
  });

  it("redirects authenticated administrators away from the login page", () => {
    renderPage(<LoginPage authenticated />, null);
    expect(window.location.pathname).toBe("/welcome");
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
    await user.click(await screen.findByRole("button", { name: /会\s*话/ }));
    expect(await screen.findByText("暂无数据", { selector: "div" })).toBeVisible();
  });

  it("executes user status, credential, and session operations without password confirmation", async () => {
    const user = userEvent.setup();
    renderPage(<UsersPage />);
    expect(await screen.findByText("Browser User")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /停\s*用/ }));

    await user.click(screen.getByRole("button", { name: /重置密码/ }));
    expect(screen.getByLabelText("新密码")).toHaveAttribute("maxlength", "64");
    await user.type(screen.getByLabelText("新密码"), "replacement-password");
    await user.click(screen.getByRole("button", { name: "确定" }));

    await user.click(await screen.findByRole("button", { name: /会话/ }));
    expect(await screen.findByText("暂无数据", { selector: "div" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: /撤销全部/ }));
    expect(screen.queryByLabelText("当前密码")).not.toBeInTheDocument();
  }, 120_000);

  it("selects users and sends one atomic bulk soft-delete request", async () => {
    const user = userEvent.setup();
    let bulkPayload: unknown;
    server.use(
      http.delete("http://localhost:3000/api/v1/admin/users/batch", async ({ request }) => {
        bulkPayload = await request.json();
        return HttpResponse.json({
          code: "OK",
          message: "操作成功",
          data: { completed_count: 1, target_ids: ["01900000-0000-7000-8000-000000000002"] },
          request_id: "test-request",
        });
      }),
    );
    renderPage(<UsersPage />);

    expect(await screen.findByText("Browser User")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /Select row/ }));
    expect(screen.getByText("已选择 1 项")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "批量删除" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await waitFor(() =>
      expect(bulkPayload).toEqual({ user_ids: ["01900000-0000-7000-8000-000000000002"] }),
    );
  }, 60_000);

  it("loads the recycle bin and sends one atomic bulk restore request", async () => {
    const user = userEvent.setup();
    let restorePayload: unknown;
    const ok = (data: unknown) => HttpResponse.json({ code: "OK", message: "操作成功", data, request_id: "test-request" });
    const deletedUser = {
      id: "01900000-0000-7000-8000-000000000002",
      username: "browser-user",
      display_name: "Browser User",
      email: "browser@example.test",
      is_active: false,
      created_at: now,
      updated_at: now,
      deleted_at: now,
      deleted_by_admin_id: current.id,
      deletion_reason: "admin_deleted",
      anonymized_at: null,
      restore_expires_at: "2026-09-14T00:00:00Z",
      can_restore: true,
    };
    server.use(
      http.get("http://localhost:3000/api/v1/admin/users", ({ request }) => {
        const lifecycle = new globalThis.URL(request.url).searchParams.get("lifecycle");
        return ok({
          items: lifecycle === "deleted" ? [deletedUser] : [],
          page: 1,
          page_size: 20,
          total: lifecycle === "deleted" ? 1 : 0,
          total_pages: lifecycle === "deleted" ? 1 : 0,
        });
      }),
      http.post("http://localhost:3000/api/v1/admin/users/restore/batch", async ({ request }) => {
        restorePayload = await request.json();
        return ok({ completed_count: 1, target_ids: [deletedUser.id] });
      }),
    );
    renderPage(<UsersPage />);

    await user.click(screen.getByText("回收站"));
    expect(await screen.findByText("可恢复")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /Select row/ }));
    await user.click(screen.getByRole("button", { name: "批量恢复" }));

    await waitFor(() => expect(restorePayload).toEqual({ user_ids: [deletedUser.id] }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  }, 60_000);

  it("loads administrators and assigns roles directly", async () => {
    const user = userEvent.setup();
    server.use(http.get("http://localhost:3000/api/v1/admin/admins", () => HttpResponse.json({ code: "OK", message: "操作成功", data: { items: [otherAdmin], page: 1, page_size: 20, total: 1, total_pages: 1 }, request_id: "test-request" })));
    renderPage(<AdminsPage />);
    expect(await screen.findByText("Other Admin")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /角色/ }));
    expect(screen.getByText("分配角色")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /保\s*存/ }));
  }, 60_000);

  it("protects administrator status and session operations", async () => {
    const user = userEvent.setup();
    server.use(http.get("http://localhost:3000/api/v1/admin/admins", () => HttpResponse.json({
      code: "OK",
      message: "操作成功",
      data: { items: [otherAdmin], page: 1, page_size: 20, total: 1, total_pages: 1 },
      request_id: "test-request",
    })));
    renderPage(<AdminsPage />);
    expect(await screen.findByText("Other Admin")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "更多操作：other-admin" }));
    await user.click(await screen.findByRole("menuitem", { name: /停\s*用/ }));
    await user.click(screen.getByRole("button", { name: /会\s*话/ }));
    expect(await screen.findByText("暂无数据", { selector: "div" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: /撤销全部/ }));
    expect(screen.queryByLabelText("当前密码")).not.toBeInTheDocument();
  }, 60_000);

  it("edits administrator avatar and display name", async () => {
    const user = userEvent.setup();
    let updatePayload: unknown;
    server.use(
      http.get("http://localhost:3000/api/v1/admin/admins", () => HttpResponse.json({ code: "OK", message: "操作成功", data: { items: [otherAdmin], page: 1, page_size: 20, total: 1, total_pages: 1 }, request_id: "test-request" })),
      http.patch("http://localhost:3000/api/v1/admin/admins/:id", async ({ request }) => {
        updatePayload = await request.json();
        return HttpResponse.json({ code: "OK", message: "操作成功", data: otherAdmin, request_id: "test-request" });
      }),
    );
    renderPage(<AdminsPage />);

    expect(await screen.findByRole("img", { name: "Other Admin的头像" })).toHaveAttribute("src", "/static/uploads/avatar/other.png");
    await user.click(screen.getByRole("button", { name: /编辑/ }));
    const displayName = screen.getByLabelText("显示名称");
    await user.clear(displayName);
    await user.type(displayName, "Updated Admin");
    await user.click(screen.getByRole("button", { name: "移除头像" }));
    await user.click(screen.getByRole("button", { name: /保\s*存/ }));

    await waitFor(() => expect(updatePayload).toEqual({ avatar: null, display_name: "Updated Admin" }));
  }, 60_000);

  it("switches administrator identity directly", async () => {
    const user = userEvent.setup();
    let updatePayload: unknown;
    server.use(
      http.get("http://localhost:3000/api/v1/admin/admins", () => HttpResponse.json({ code: "OK", message: "操作成功", data: { items: [otherAdmin], page: 1, page_size: 20, total: 1, total_pages: 1 }, request_id: "test-request" })),
      http.patch("http://localhost:3000/api/v1/admin/admins/:id", async ({ request }) => {
        updatePayload = await request.json();
        return HttpResponse.json({ code: "OK", message: "操作成功", data: { ...otherAdmin, is_superuser: true }, request_id: "test-request" });
      }),
    );
    renderPage(<AdminsPage />);

    await user.click(await screen.findByRole("button", { name: "设为超级管理员：other-admin" }));
    await waitFor(() => expect(updatePayload).toEqual({ is_superuser: true }));
  }, 60_000);

  it("resets an administrator password from the more menu", async () => {
    const user = userEvent.setup();
    let resetPayload: unknown;
    server.use(
      http.get("http://localhost:3000/api/v1/admin/admins", () => HttpResponse.json({ code: "OK", message: "操作成功", data: { items: [otherAdmin], page: 1, page_size: 20, total: 1, total_pages: 1 }, request_id: "test-request" })),
      http.put("http://localhost:3000/api/v1/admin/admins/:id/credentials/password", async ({ request }) => {
        resetPayload = await request.json();
        return HttpResponse.json({ code: "OK", message: "操作成功", data: { completed: true }, request_id: "test-request" });
      }),
    );
    renderPage(<AdminsPage />);

    await user.click(await screen.findByRole("button", { name: "更多操作：other-admin" }));
    await user.click(await screen.findByRole("menuitem", { name: /重置密码/ }));
    await user.type(screen.getByLabelText("新密码"), "replacement-password");
    await user.type(screen.getByLabelText("确认新密码"), "replacement-password");
    await user.click(screen.getByRole("button", { name: "确定" }));

    await waitFor(() => expect(resetPayload).toEqual({ new_password: "replacement-password" }));
  }, 60_000);

  it("selects administrators and performs one atomic bulk status request", async () => {
    const user = userEvent.setup();
    const thirdAdmin: AdminRead = { ...otherAdmin, id: "01900000-0000-7000-8000-000000000011", username: "third-admin", display_name: "Third Admin" };
    let bulkPayload: unknown;
    server.use(
      http.get("http://localhost:3000/api/v1/admin/admins", () => HttpResponse.json({ code: "OK", message: "操作成功", data: { items: [current, otherAdmin, thirdAdmin], page: 1, page_size: 20, total: 3, total_pages: 1 }, request_id: "test-request" })),
      http.patch("http://localhost:3000/api/v1/admin/admins/status/batch", async ({ request }) => {
        bulkPayload = await request.json();
        return HttpResponse.json({ code: "OK", message: "操作成功", data: [otherAdmin, thirdAdmin], request_id: "test-request" });
      }),
    );
    renderPage(<AdminsPage />);

    expect(await screen.findByText("Third Admin")).toBeInTheDocument();
    const rowCheckboxes = screen.getAllByRole("checkbox", { name: /Select row/ });
    expect(rowCheckboxes[0]).toBeDisabled();
    const secondCheckbox = rowCheckboxes[1];
    const thirdCheckbox = rowCheckboxes[2];
    if (!secondCheckbox || !thirdCheckbox) throw new Error("批量选择列未完整渲染");
    await user.click(secondCheckbox);
    await user.click(thirdCheckbox);
    expect(screen.getByText("已选择 2 项")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /批量停用/ }));

    await waitFor(() => expect(bulkPayload).toEqual({ admin_ids: [otherAdmin.id, thirdAdmin.id], is_active: false }));
    expect(screen.getByRole("columnheader", { name: "操作" })).toHaveStyle({ whiteSpace: "nowrap" });
    expect(document.querySelector('col[style*="width: 1%"]')).not.toBeNull();
  }, 60_000);

  it("renders inactive records, empty fields, and active session details", async () => {
    const user = userEvent.setup();
    const inactiveUser = {
      id: "01900000-0000-7000-8000-000000000020",
      username: "inactive-user",
      display_name: null,
      email: null,
      is_active: false,
      created_at: now,
      updated_at: now,
    };
    const inactiveAdmin = {
      ...current,
      id: "01900000-0000-7000-8000-000000000021",
      username: "inactive-admin",
      display_name: null,
      is_active: false,
      is_superuser: false,
      roles: [{ id: "01900000-0000-7000-8000-000000000022", code: "auditors", name: "审计员" }],
    };
    const activeSession = { id: "01900000-0000-7000-8000-000000000023", device_name: null, ip_masked: null, last_seen_at: now, revoked_at: null };
    const revokedSession = { ...activeSession, id: "01900000-0000-7000-8000-000000000024", device_name: "旧设备", revoked_at: now };
    const ok = (data: unknown) => HttpResponse.json({ code: "OK", message: "操作成功", data, request_id: "test-request" });
    server.use(
      http.get("http://localhost:3000/api/v1/admin/users", () => ok({ items: [inactiveUser], page: 1, page_size: 20, total: 1, total_pages: 1 })),
      http.get("http://localhost:3000/api/v1/admin/users/:id/sessions", () => ok({ items: [activeSession, revokedSession], page: 1, page_size: 20, total: 2, total_pages: 1 })),
      http.post("http://localhost:3000/api/v1/admin/users/:id/sessions/revoke-all", () => ok({ completed: true })),
      http.get("http://localhost:3000/api/v1/admin/admins", () => ok({ items: [inactiveAdmin], page: 1, page_size: 20, total: 1, total_pages: 1 })),
      http.get("http://localhost:3000/api/v1/admin/admins/:id/sessions", () => ok({ items: [activeSession, revokedSession], page: 1, page_size: 20, total: 2, total_pages: 1 })),
      http.get("http://localhost:3000/api/v1/admin/roles", () => ok({ items: [{ id: "01900000-0000-7000-8000-000000000025", code: "auditors", name: "审计员", description: null, is_active: false, permissions: [], created_at: now, updated_at: now }], page: 1, page_size: 100, total: 1, total_pages: 1 })),
      http.get("http://localhost:3000/api/v1/admin/permissions", () => ok([{ id: "01900000-0000-7000-8000-000000000026", code: "users:read", name: "查看用户", description: null, is_active: false, catalog_version: "v1" }])),
    );

    const users = renderPage(<UsersPage />);
    expect((await screen.findAllByText("inactive-user")).length).toBeGreaterThan(0);
    expect(screen.getByText("停用", { selector: "span" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /启\s*用/ }));
    await user.click(screen.getByRole("button", { name: /会\s*话/ }));
    expect(await screen.findByText("旧设备")).toBeInTheDocument();
    expect(screen.getByText("未知设备")).toBeInTheDocument();
    expect(screen.getByText("已撤销")).toBeInTheDocument();
    users.unmount();

    const admins = renderPage(<AdminsPage />);
    expect((await screen.findAllByText("inactive-admin")).length).toBeGreaterThan(0);
    expect(screen.getByText("审计员")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "更多操作：inactive-admin" }));
    await user.click(await screen.findByRole("menuitem", { name: /启\s*用/ }));
    await user.click(screen.getByRole("button", { name: /会\s*话/ }));
    expect(await screen.findByText("旧设备")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /撤销全部/ }));
    admins.unmount();

    renderPage(<RolesPage />);
    expect(await screen.findByText("审计员")).toBeInTheDocument();
    expect(screen.getByText("停用")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  }, 60_000);

  it("creates an administrator directly", async () => {
    const user = userEvent.setup();
    renderPage(<AdminsPage />);
    expect(await screen.findByText("Stage Admin")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /新建管理员/ }));
    await user.type(screen.getByLabelText("用户名"), "new-operator");
    expect(screen.getByLabelText("初始密码")).toHaveAttribute("maxlength", "64");
    await user.type(screen.getByLabelText("初始密码"), "new-operator-password");
    await user.click(screen.getByRole("button", { name: /保\s*存/ }));

  }, 60_000);

  it("rejects administrator passwords shorter than six characters", async () => {
    const user = userEvent.setup();
    renderPage(<AdminsPage />);
    expect(await screen.findByText("Stage Admin")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /新建管理员/ }));
    await user.type(screen.getByLabelText("用户名"), "new-operator");
    await user.type(screen.getByLabelText("初始密码"), "short");
    await user.click(screen.getByRole("button", { name: /保\s*存/ }));
    expect(await screen.findByText("密码必须为 6 至 64 个字符")).toBeInTheDocument();
  });

  it("loads roles and the source-controlled permission catalog", async () => {
    const user = userEvent.setup();
    renderPage(<RolesPage />);
    expect(await screen.findByText("运营人员")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /权限/ }));
    expect(await screen.findByText("查看用户")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /保\s*存/ }));
    await user.click(screen.getByRole("button", { name: /删除/ }));
    await confirmWarning(user, "删除未使用角色");
  }, 60_000);

  it("selects roles and sends one atomic bulk hard-delete request", async () => {
    const user = userEvent.setup();
    let bulkPayload: unknown;
    server.use(
      http.delete("http://localhost:3000/api/v1/admin/roles/batch", async ({ request }) => {
        bulkPayload = await request.json();
        return HttpResponse.json({
          code: "OK",
          message: "操作成功",
          data: { completed_count: 1, target_ids: ["01900000-0000-7000-8000-000000000003"] },
          request_id: "test-request",
        });
      }),
    );
    renderPage(<RolesPage />);

    expect(await screen.findByText("运营人员")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /Select row/ }));
    expect(screen.getByText("已选择 1 项")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "批量删除" }));
    await confirmWarning(user, "确认批量删除 1 个角色");

    await waitFor(() =>
      expect(bulkPayload).toEqual({ role_ids: ["01900000-0000-7000-8000-000000000003"] }),
    );
  }, 60_000);

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
  }, 60_000);

  it("switches between login, audit, and request metadata logs", async () => {
    const user = userEvent.setup();
    renderPage(<SecurityPage />);
    expect((await screen.findAllByText("成功")).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("tab", { name: "审计事件" }));
    expect(await screen.findByText("users:update")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "请求元数据" }));
    expect(await screen.findByText("/api/v1/users/me")).toBeInTheDocument();
  });

  it("renders denied login, in-progress audit, and failed request states", async () => {
    const ok = (data: unknown) => HttpResponse.json({ code: "OK", message: "操作成功", data, request_id: "test-request" });
    server.use(
      http.get("http://localhost:3000/api/v1/admin/security/login-events", () => ok({ items: [{ id: "01900000-0000-7000-8000-000000000015", principal_type: "admin", principal_id: null, event_type: "login", succeeded: false, reason_code: "invalid_credentials", ip_address: null, user_agent_summary: null, request_id: "test-request", occurred_at: now }], page: 1, page_size: 20, total: 1, total_pages: 1 })),
      http.get("http://localhost:3000/api/v1/admin/security/audit-events", () => ok({ items: [{ id: "01900000-0000-7000-8000-000000000016", actor_id: current.id, action: "roles:update", target_type: "role", target_id: null, result: "started", changed_fields: {}, request_id: "test-request", occurred_at: now, completed_at: null }], page: 1, page_size: 20, total: 1, total_pages: 1 })),
      http.get("http://localhost:3000/api/v1/admin/system/request-logs", () => ok({ items: [{ id: "01900000-0000-7000-8000-000000000017", request_id: "test-request", trace_id: "test-trace", method: "POST", route_template: "/api/v1/admin/roles", status_code: 500, duration_ms: 12, principal_type: "admin", release_version: "test", occurred_at: now, request_body: '{"password":"***"}' }], page: 1, page_size: 20, total: 1, total_pages: 1 })),
    );
    const user = userEvent.setup();
    renderPage(<SecurityPage />);
    expect(await screen.findByText("拒绝")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "审计事件" }));
    expect(await screen.findByText("处理中")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "请求元数据" }));
    expect(await screen.findByText("500")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "查看入参" }));
    expect(await screen.findByText('{"password":"***"}')).toBeInTheDocument();
  });

  it("explains when request metadata logging is disabled", async () => {
    server.use(http.get("http://localhost:3000/api/v1/admin/system/request-logs", () => HttpResponse.json({ code: "REQUEST_LOG_DISABLED", message: "请求日志功能已关闭", details: null, request_id: "test-request" }, { status: 409 })));
    const user = userEvent.setup();
    renderPage(<SecurityPage />);
    await user.click(screen.getByRole("tab", { name: "请求元数据" }));
    expect(await screen.findByText("请求元数据日志当前未启用")).toBeInTheDocument();
  });

  it("loads file assets and applies filename, scene, and uploader filters", async () => {
    const user = userEvent.setup();
    let lastQuery = "";
    server.use(
      http.get("http://localhost:3000/api/v1/assets", ({ request }) => {
        lastQuery = new globalThis.URL(request.url).search;
        return HttpResponse.json({
          code: "OK",
          message: "操作成功",
          data: {
            items: [{
              id: "01900000-0000-7000-8000-000000000008",
              uploader_type: "admin",
              uploader_id: current.id,
              storage_driver: "local",
              file_key: "product/catalog-cover.png",
              original_name: "catalog-cover.png",
              mime_type: "image/png",
              file_size: 2048,
              file_hash: "a".repeat(64),
              url: "/static/uploads/product/catalog-cover.png",
              scene: "product",
              created_at: now,
              updated_at: now,
            }],
            page: 1,
            page_size: 20,
            total: 1,
            total_pages: 1,
          },
          request_id: "test-request",
        });
      }),
    );
    renderPage(<AssetsPage />);

    expect(await screen.findByText("catalog-cover.png")).toBeInTheDocument();
    await user.type(screen.getByLabelText("搜索文件名"), "catalog{Enter}");
    await user.click(screen.getByLabelText("筛选使用场景"));
    await user.click(await screen.findByRole("option", { name: "商品" }));
    await user.click(screen.getByLabelText("筛选上传主体"));
    await user.click(await screen.findByRole("option", { name: "管理员" }));

    await waitFor(() => {
      const params = new URLSearchParams(lastQuery);
      expect(params.get("search")).toBe("catalog");
      expect(params.get("scene")).toBe("product");
      expect(params.get("uploader_type")).toBe("admin");
    });
  }, 60_000);

  it("selects assets and sends one atomic bulk hard-delete request", async () => {
    const user = userEvent.setup();
    let bulkPayload: unknown;
    server.use(
      http.delete("http://localhost:3000/api/v1/assets/batch", async ({ request }) => {
        bulkPayload = await request.json();
        return HttpResponse.json({
          code: "OK",
          message: "操作成功",
          data: { completed_count: 1, target_ids: ["01900000-0000-7000-8000-000000000008"] },
          request_id: "test-request",
        });
      }),
    );
    renderPage(<AssetsPage />);

    expect(await screen.findByText("catalog-cover.png")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /Select row/ }));
    expect(screen.getByText("已选择 1 项")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "批量删除" }));
    await confirmWarning(user, "确认批量删除 1 个文件资产");

    await waitFor(() =>
      expect(bulkPayload).toEqual({ asset_ids: ["01900000-0000-7000-8000-000000000008"] }),
    );
  }, 60_000);

  it("hides mutation controls from read-only administrators", async () => {
    const users = renderPage(<UsersPage />, restricted);
    expect(await screen.findByText("Browser User")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /编辑|停用|会话|重置密码/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    users.unmount();

    const admins = renderPage(<AdminsPage />, restricted);
    expect(await screen.findByText("Stage Admin")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /新建管理员|编辑|角色|更多操作|会话/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    admins.unmount();

    const roles = renderPage(<RolesPage />, restricted);
    expect(await screen.findByText("运营人员")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /新建角色|编辑|权限|删除/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    roles.unmount();

    renderPage(<AssetsPage />, restricted);
    expect(await screen.findByText("catalog-cover.png")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /删除|批量删除/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  }, 60_000);
});
