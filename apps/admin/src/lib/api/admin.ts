import type {
  AdminAuthSessionOut,
  AdminConfirmOut,
  AdminCreateIn,
  AdminLoginIn,
  AdminRead,
  ConfirmationAction,
  PageResultAdminRead,
  PageResultAuditEventRead,
  PageResultLoginEventRead,
  PageResultRequestLogRead,
  PageResultRoleRead,
  PageResultUserPrincipalOut,
  PermissionRead,
  RoleCreateIn,
  RoleRead,
  SessionRead,
  UserPrincipalOut,
} from "@pinjie/api-client";

import { apiRequest, jsonBody } from "./http";

export const adminApi = {
  login: (input: AdminLoginIn) =>
    apiRequest<AdminAuthSessionOut>("/api/v1/admin/auth/login", {
      method: "POST",
      body: jsonBody(input),
    }, { retryAuth: false }),
  me: () => apiRequest<AdminRead>("/api/v1/admin/auth/me"),
  logout: () => apiRequest<{ completed?: boolean }>("/api/v1/admin/auth/logout", { method: "POST" }, { retryAuth: false }),
  confirm: (action: ConfirmationAction, currentPassword: string) =>
    apiRequest<AdminConfirmOut>("/api/v1/admin/auth/confirm", {
      method: "POST",
      body: jsonBody({ action, current_password: currentPassword }),
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<{ completed?: boolean }>("/api/v1/admin/auth/password", {
      method: "POST",
      body: jsonBody({ current_password: currentPassword, new_password: newPassword }),
    }),
  users: (page: number, search?: string) => {
    const query = new URLSearchParams({ page: String(page), page_size: "20" });
    if (search) query.set("search", search);
    return apiRequest<PageResultUserPrincipalOut>(`/api/v1/admin/users?${query}`);
  },
  updateUser: (id: string, input: { display_name?: string | null; email?: string | null }) =>
    apiRequest<UserPrincipalOut>(`/api/v1/admin/users/${id}`, { method: "PATCH", body: jsonBody(input) }),
  setUserStatus: (id: string, isActive: boolean, confirmationToken?: string) =>
    apiRequest<UserPrincipalOut>(
      `/api/v1/admin/users/${id}/status`,
      { method: "PATCH", body: jsonBody({ is_active: isActive }) },
      { confirmationToken },
    ),
  resetUserPassword: (id: string, newPassword: string, confirmationToken: string) =>
    apiRequest<{ completed?: boolean }>(
      `/api/v1/admin/users/${id}/credentials/password`,
      { method: "PUT", body: jsonBody({ new_password: newPassword }) },
      { confirmationToken },
    ),
  userSessions: (id: string) => apiRequest<SessionRead[]>(`/api/v1/admin/users/${id}/sessions`),
  revokeUserSessions: (id: string, confirmationToken: string) =>
    apiRequest<{ completed?: boolean }>(
      `/api/v1/admin/users/${id}/sessions/revoke-all`,
      { method: "POST" },
      { confirmationToken },
    ),
  admins: (page: number) => apiRequest<PageResultAdminRead>(`/api/v1/admin/admins?page=${page}&page_size=20`),
  createAdmin: (input: AdminCreateIn, confirmationToken: string) =>
    apiRequest<AdminRead>("/api/v1/admin/admins", { method: "POST", body: jsonBody(input) }, { confirmationToken }),
  updateAdmin: (id: string, input: { display_name?: string | null; is_superuser?: boolean }, confirmationToken?: string) =>
    apiRequest<AdminRead>(
      `/api/v1/admin/admins/${id}`,
      { method: "PATCH", body: jsonBody(input) },
      { confirmationToken },
    ),
  setAdminStatus: (id: string, isActive: boolean, confirmationToken: string) =>
    apiRequest<AdminRead>(
      `/api/v1/admin/admins/${id}/status`,
      { method: "PATCH", body: jsonBody({ is_active: isActive }) },
      { confirmationToken },
    ),
  assignAdminRoles: (id: string, roleIds: string[], confirmationToken: string) =>
    apiRequest<AdminRead>(
      `/api/v1/admin/admins/${id}/roles`,
      { method: "PUT", body: jsonBody({ role_ids: roleIds }) },
      { confirmationToken },
    ),
  adminSessions: (id: string) => apiRequest<SessionRead[]>(`/api/v1/admin/admins/${id}/sessions`),
  revokeAdminSessions: (id: string, confirmationToken: string) =>
    apiRequest<{ completed?: boolean }>(
      `/api/v1/admin/admins/${id}/sessions/revoke-all`,
      { method: "POST" },
      { confirmationToken },
    ),
  roles: (page = 1) => apiRequest<PageResultRoleRead>(`/api/v1/admin/roles?page=${page}&page_size=100`),
  createRole: (input: RoleCreateIn) =>
    apiRequest<RoleRead>("/api/v1/admin/roles", { method: "POST", body: jsonBody(input) }),
  updateRole: (id: string, input: { name?: string; description?: string | null; is_active?: boolean }, confirmationToken?: string) =>
    apiRequest<RoleRead>(
      `/api/v1/admin/roles/${id}`,
      { method: "PATCH", body: jsonBody(input) },
      { confirmationToken },
    ),
  deleteRole: (id: string, confirmationToken: string) =>
    apiRequest<{ completed?: boolean }>(`/api/v1/admin/roles/${id}`, { method: "DELETE" }, { confirmationToken }),
  assignPermissions: (id: string, permissionCodes: string[], confirmationToken: string) =>
    apiRequest<RoleRead>(
      `/api/v1/admin/roles/${id}/permissions`,
      { method: "PUT", body: jsonBody({ permission_codes: permissionCodes }) },
      { confirmationToken },
    ),
  permissions: () => apiRequest<PermissionRead[]>("/api/v1/admin/permissions"),
  loginEvents: (page = 1) => apiRequest<PageResultLoginEventRead>(`/api/v1/admin/security/login-events?page=${page}&page_size=20`),
  auditEvents: (page = 1) => apiRequest<PageResultAuditEventRead>(`/api/v1/admin/security/audit-events?page=${page}&page_size=20`),
  requestLogs: (page = 1) => apiRequest<PageResultRequestLogRead>(`/api/v1/admin/system/request-logs?page=${page}&page_size=20`),
};
