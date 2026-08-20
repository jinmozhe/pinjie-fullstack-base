import type { AdminInitialState } from "./app";

export default function access(initialState?: AdminInitialState) {
  const admin = initialState?.currentAdmin;
  return {
    canUsers: Boolean(admin && (admin.is_superuser || admin.permissions.includes("users:read"))),
    canAdmins: Boolean(admin && (admin.is_superuser || admin.permissions.includes("admins:read"))),
    canRoles: Boolean(admin && (admin.is_superuser || admin.permissions.includes("roles:read"))),
    canSecurity: Boolean(admin && (admin.is_superuser || admin.permissions.includes("security:login-events:read"))),
  };
}
