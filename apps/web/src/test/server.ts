import { http, HttpResponse } from "msw";

const now = "2026-08-15T00:00:00Z";
const user = { id: "01900000-0000-7000-8000-000000000002", username: "browser-user", display_name: "Browser User", email: "browser@example.test", is_active: true, created_at: now, updated_at: now };
const session = { id: "01900000-0000-7000-8000-000000000003", device_name: "Chrome on Windows", ip_masked: "127.0.0.*", user_agent_summary: "Chrome", created_at: now, last_seen_at: now, idle_expires_at: now, absolute_expires_at: now, is_current: true, revoked_at: null };
const ok = <T>(data: T) => HttpResponse.json({ code: "OK", message: "操作成功", data, request_id: "test-request" });

export const handlers = [
  http.get("http://localhost:3000/api/v1/system/status", () =>
    HttpResponse.json({ code: "OK", message: "操作成功", data: { status: "available" }, request_id: "test-request" }),
  ),
  http.get("http://localhost:3000/api/v1/system/capabilities", () =>
    ok({ registration_enabled: true }),
  ),
  http.post("http://localhost:3000/api/v1/auth/login", () => ok({ principal: user, session_id: session.id, access_expires_at: now, idle_expires_at: now, absolute_expires_at: now })),
  http.post("http://localhost:3000/api/v1/auth/register", () => ok({ principal: user, session_id: session.id, access_expires_at: now, idle_expires_at: now, absolute_expires_at: now })),
  http.post("http://localhost:3000/api/v1/auth/logout", () => ok({ completed: true })),
  http.post("http://localhost:3000/api/v1/auth/refresh", () => ok({ session_id: session.id, access_expires_at: now, idle_expires_at: now, absolute_expires_at: now })),
  http.get("http://localhost:3000/api/v1/users/me", () => ok(user)),
  http.patch("http://localhost:3000/api/v1/users/me", () => ok({ ...user, display_name: "Updated User" })),
  http.delete("http://localhost:3000/api/v1/users/me", () => ok({ completed: true })),
  http.post("http://localhost:3000/api/v1/users/me/password", () => ok({ completed: true })),
  http.get("http://localhost:3000/api/v1/users/me/sessions", () =>
    ok({ items: [session], page: 1, page_size: 100, total: 1, total_pages: 1 }),
  ),
  http.delete("http://localhost:3000/api/v1/users/me/sessions/:id", () => ok({ completed: true })),
  http.post("http://localhost:3000/api/v1/users/me/sessions/revoke-others", () => ok({ completed: true })),
];
