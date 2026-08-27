import type { AdminInitialState } from "./app";

export default function access(initialState?: AdminInitialState) {
  const admin = initialState?.currentAdmin;
  return {
    canUsers: Boolean(admin && (admin.is_superuser || admin.permissions.includes("users:read"))),
    canAdmins: Boolean(admin && (admin.is_superuser || admin.permissions.includes("admins:read"))),
    canRoles: Boolean(admin && (admin.is_superuser || admin.permissions.includes("roles:read"))),
    canAssets: Boolean(admin && (admin.is_superuser || admin.permissions.includes("assets:read"))),
    canSystem: Boolean(admin && (admin.is_superuser || admin.permissions.includes("system:overview:read"))),
    canSecurity: Boolean(admin && (admin.is_superuser || [
      "security:login-events:read",
      "security:audit-events:read",
      "system:request-logs:read",
    ].some((permission) => admin.permissions.includes(permission)))),
  };
}
