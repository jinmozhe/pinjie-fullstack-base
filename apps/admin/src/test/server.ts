import { http, HttpResponse } from "msw";

const now = "2026-08-15T00:00:00Z";
const admin = {
  id: "01900000-0000-7000-8000-000000000001",
  username: "stage-admin",
  display_name: "Stage Admin",
  is_active: true,
  is_superuser: true,
  roles: [],
  permissions: [],
  created_at: now,
  updated_at: now,
};
const user = {
  id: "01900000-0000-7000-8000-000000000002",
  username: "browser-user",
  display_name: "Browser User",
  email: "browser@example.test",
  is_active: true,
  created_at: now,
  updated_at: now,
};
const role = {
  id: "01900000-0000-7000-8000-000000000003",
  code: "operators",
  name: "运营人员",
  description: "日常运营角色",
  is_active: true,
  permissions: ["users:read"],
  created_at: now,
  updated_at: now,
};

const ok = <T>(data: T) => HttpResponse.json({ code: "OK", message: "操作成功", data, request_id: "test-request" });

export const handlers = [
  http.get("http://localhost:3000/api/v1/system/status", () =>
    HttpResponse.json({ code: "OK", message: "操作成功", data: { status: "available" }, request_id: "test-request" }),
  ),
  http.get("http://localhost:8000/api/v1/system/status", () =>
    HttpResponse.json({ code: "OK", message: "操作成功", data: { status: "available" }, request_id: "test-request" }),
  ),
  http.get("http://localhost:3001/api/v1/system/status", () =>
    HttpResponse.json({ code: "OK", message: "操作成功", data: { status: "available" }, request_id: "test-request" }),
  ),
  http.get("http://localhost:3000/api/v1/admin/auth/me", () => ok(admin)),
  http.post("http://localhost:3000/api/v1/admin/auth/login", () => ok({ principal: admin, session_id: admin.id, access_expires_at: now, idle_expires_at: now, absolute_expires_at: now })),
  http.post("http://localhost:3000/api/v1/admin/auth/confirm", () => ok({ confirmation_token: "confirm-once", action: "users:disable", expires_at: now })),
  http.post("http://localhost:3000/api/v1/admin/auth/logout", () => ok({ completed: true })),
  http.post("http://localhost:3000/api/v1/admin/auth/password", () => ok({ completed: true })),
  http.get("http://localhost:3000/api/v1/admin/users", () => ok({ items: [user], page: 1, page_size: 20, total: 1, total_pages: 1 })),
  http.patch("http://localhost:3000/api/v1/admin/users/:id", () => ok(user)),
  http.patch("http://localhost:3000/api/v1/admin/users/:id/status", () => ok({ ...user, is_active: false })),
  http.put("http://localhost:3000/api/v1/admin/users/:id/credentials/password", () => ok({ completed: true })),
  http.get("http://localhost:3000/api/v1/admin/users/:id/sessions", () =>
    ok({ items: [], page: 1, page_size: 20, total: 0, total_pages: 0 }),
  ),
  http.post("http://localhost:3000/api/v1/admin/users/:id/sessions/revoke-all", () => ok({ completed: true })),
  http.get("http://localhost:3000/api/v1/admin/admins", () => ok({ items: [admin], page: 1, page_size: 20, total: 1, total_pages: 1 })),
  http.post("http://localhost:3000/api/v1/admin/admins", () => ok(admin)),
  http.get("http://localhost:3000/api/v1/admin/admins/:id/sessions", () =>
    ok({ items: [], page: 1, page_size: 20, total: 0, total_pages: 0 }),
  ),
  http.patch("http://localhost:3000/api/v1/admin/admins/:id/status", () => ok(admin)),
  http.put("http://localhost:3000/api/v1/admin/admins/:id/roles", () => ok(admin)),
  http.post("http://localhost:3000/api/v1/admin/admins/:id/sessions/revoke-all", () => ok({ completed: true })),
  http.get("http://localhost:3000/api/v1/admin/roles", () => ok({ items: [role], page: 1, page_size: 100, total: 1, total_pages: 1 })),
  http.post("http://localhost:3000/api/v1/admin/roles", () => ok(role)),
  http.patch("http://localhost:3000/api/v1/admin/roles/:id", () => ok(role)),
  http.delete("http://localhost:3000/api/v1/admin/roles/:id", () => ok({ completed: true })),
  http.put("http://localhost:3000/api/v1/admin/roles/:id/permissions", () => ok(role)),
  http.get("http://localhost:3000/api/v1/admin/permissions", () => ok([{ id: "01900000-0000-7000-8000-000000000004", code: "users:read", name: "查看用户", description: "查看用户列表", is_active: true, catalog_version: "v1" }])),
  http.get("http://localhost:3000/api/v1/admin/security/login-events", () => ok({ items: [{ id: "01900000-0000-7000-8000-000000000005", principal_type: "admin", principal_id: admin.id, event_type: "login", succeeded: true, reason_code: "success", ip_address: "127.0.0.1", user_agent_summary: "test", request_id: "test-request", occurred_at: now }], page: 1, page_size: 20, total: 1, total_pages: 1 })),
  http.get("http://localhost:3000/api/v1/admin/security/audit-events", () => ok({ items: [{ id: "01900000-0000-7000-8000-000000000006", actor_id: admin.id, action: "users:update", target_type: "user", target_id: user.id, result: "succeeded", changed_fields: {}, request_id: "test-request", occurred_at: now, completed_at: now }], page: 1, page_size: 20, total: 1, total_pages: 1 })),
  http.get("http://localhost:3000/api/v1/admin/system/request-logs", () => ok({ items: [{ id: "01900000-0000-7000-8000-000000000007", request_id: "test-request", trace_id: "test-trace", method: "GET", route_template: "/api/v1/users/me", status_code: 200, duration_ms: 8, principal_type: "user", release_version: "test", occurred_at: now }], page: 1, page_size: 20, total: 1, total_pages: 1 })),
];
