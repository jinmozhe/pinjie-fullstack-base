import type { UserPrincipalOut } from "@pinjie/api-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "@/test/setup";

import { Providers } from "../app/providers";
import { AccountCenter } from "./account/AccountCenter";
import { AuthForm } from "./auth/AuthForm";

const replace = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));

const now = "2026-08-15T00:00:00Z";
const initialUser: UserPrincipalOut = { id: "01900000-0000-7000-8000-000000000002", username: "browser-user", display_name: "Browser User", email: "browser@example.test", is_active: true, created_at: now, updated_at: now };

function renderWithQuery(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

describe("stage C web account", () => {
  beforeEach(() => { replace.mockReset(); refresh.mockReset(); window.history.replaceState({}, "", "/"); });

  it("preserves an intentional login navigation when a protected request returns late", () => {
    window.history.replaceState({}, "", "/login");
    render(<Providers><p>登录页</p></Providers>);
    act(() => window.dispatchEvent(new Event("pinjie:session-expired")));
    expect(replace).not.toHaveBeenCalled();

    window.history.replaceState({}, "", "/account");
    act(() => window.dispatchEvent(new Event("pinjie:session-expired")));
    expect(replace).toHaveBeenCalledWith("/login?reason=session-expired");
    expect(refresh).toHaveBeenCalled();
  });

  it("submits the login form and enters the account center", async () => {
    const user = userEvent.setup();
    renderWithQuery(<AuthForm mode="login" />);
    await user.type(screen.getByLabelText("用户名"), "browser-user");
    await user.type(screen.getByLabelText("密码"), "stage-c-user-password");
    await user.click(screen.getByRole("button", { name: /登录/ }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/account"));
  });

  it("shows the complete registration fields", () => {
    renderWithQuery(<AuthForm mode="register" />);
    expect(screen.getByLabelText(/显示名称/)).toBeInTheDocument();
    expect(screen.getByLabelText(/邮箱/)).toBeInTheDocument();
    expect(screen.getByLabelText("密码")).toHaveAttribute("minlength", "6");
    expect(screen.getByLabelText("密码")).toHaveAttribute("maxlength", "64");
    expect(screen.getByText("至少 6 个字符，最多 64 个字符。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /注册并登录/ })).toBeInTheDocument();
  });

  it("shows the backend message and retry delay when registration is rate limited", async () => {
    server.use(
      http.post("http://localhost:3000/api/v1/auth/register", () => HttpResponse.json(
        { code: "RATE_LIMITED", message: "注册请求过于频繁" },
        { status: 429, headers: { "Retry-After": "30" } },
      )),
    );
    const user = userEvent.setup();
    renderWithQuery(<AuthForm mode="register" />);
    await user.type(screen.getByLabelText("用户名"), "browser-user");
    await user.type(screen.getByLabelText("密码"), "stage-c-user-password");
    await user.click(screen.getByRole("button", { name: /注册并登录/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("注册请求过于频繁，请在 30 秒后重试");
  });

  it("updates profile and loads current sessions", async () => {
    const user = userEvent.setup();
    renderWithQuery(<AccountCenter initialUser={initialUser} />);
    const displayName = screen.getByLabelText("显示名称");
    await user.clear(displayName);
    await user.type(displayName, "Updated User");
    await user.click(screen.getByRole("button", { name: "保存资料" }));
    expect(await screen.findByRole("status")).toHaveTextContent("个人资料已保存");
    await user.click(screen.getByRole("button", { name: /登录设备/ }));
    expect(await screen.findByText("Chrome on Windows")).toBeInTheDocument();
    expect(screen.getByText("当前设备")).toBeInTheDocument();
  });

  it("shows profile update failures without losing the form", async () => {
    server.use(
      http.patch("http://localhost:3000/api/v1/users/me", () => HttpResponse.json(
        { code: "UPDATE_FAILED", message: "资料暂时无法保存" },
        { status: 503 },
      )),
    );
    const user = userEvent.setup();
    renderWithQuery(<AccountCenter initialUser={initialUser} />);
    await user.click(screen.getByRole("button", { name: "保存资料" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("资料暂时无法保存");
    expect(screen.getByLabelText("显示名称")).toBeInTheDocument();
  });

  it("validates password and account deletion workflows", async () => {
    const user = userEvent.setup();
    renderWithQuery(<AccountCenter initialUser={initialUser} />);
    await user.click(screen.getByRole("button", { name: /密码安全/ }));
    expect(screen.getByLabelText("当前密码")).toHaveAttribute("maxlength", "64");
    expect(screen.getByLabelText("新密码")).toHaveAttribute("minlength", "6");
    expect(screen.getByLabelText("新密码")).toHaveAttribute("maxlength", "64");
    await user.type(screen.getByLabelText("当前密码"), "stage-c-user-password");
    await user.type(screen.getByLabelText("新密码"), "stage-c-user-password-next");
    await user.click(screen.getByRole("button", { name: "确认修改" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login?reason=password-changed"));
  });

  it("revokes sessions and signs out", async () => {
    const user = userEvent.setup();
    renderWithQuery(<AccountCenter initialUser={initialUser} />);
    await user.click(screen.getByRole("button", { name: /登录设备/ }));
    expect(await screen.findByText("Chrome on Windows")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "撤销其他设备" }));
    await user.click(screen.getByRole("button", { name: "退出" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("shows and revokes other active sessions while retaining revoked history", async () => {
    server.use(
      http.get("http://localhost:3000/api/v1/users/me/sessions", () => HttpResponse.json({
        code: "OK",
        message: "操作成功",
        request_id: "test-request",
        data: [
          { id: "01900000-0000-7000-8000-000000000004", device_name: null, ip_masked: null, user_agent_summary: null, created_at: now, last_seen_at: now, idle_expires_at: now, absolute_expires_at: now, is_current: false, revoked_at: null },
          { id: "01900000-0000-7000-8000-000000000005", device_name: "Old device", ip_masked: "10.0.0.*", user_agent_summary: "Old browser", created_at: now, last_seen_at: now, idle_expires_at: now, absolute_expires_at: now, is_current: false, revoked_at: now },
        ],
      })),
    );
    const user = userEvent.setup();
    renderWithQuery(<AccountCenter initialUser={initialUser} />);
    await user.click(screen.getByRole("button", { name: /登录设备/ }));
    expect(await screen.findByText("未知设备")).toBeInTheDocument();
    expect(screen.getByText(/未知地址/)).toBeInTheDocument();
    expect(screen.getByText("已撤销")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "撤销" }));
  });

  it("deletes an account after username and password confirmation", async () => {
    const user = userEvent.setup();
    renderWithQuery(<AccountCenter initialUser={initialUser} />);
    await user.click(screen.getByRole("button", { name: /注销账户/ }));
    await user.type(screen.getByLabelText(/输入用户名/), "browser-user");
    expect(screen.getByLabelText("当前密码")).toHaveAttribute("maxlength", "64");
    await user.type(screen.getByLabelText("当前密码"), "stage-c-user-password");
    await user.click(screen.getByRole("button", { name: /永久注销账户/ }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login?reason=account-deleted"));
  });
});
