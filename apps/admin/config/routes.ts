export default [
  { path: "/login", component: "../features/auth/LoginPage", layout: false },
  { path: "/", redirect: "/welcome" },
  { path: "/welcome", name: "欢迎", icon: "HomeOutlined", component: "../features/welcome/WelcomePage" },
  { path: "/users", name: "用户", icon: "UserOutlined", component: "../features/users/UsersPage", access: "canUsers" },
  { path: "/admins", name: "管理员", icon: "TeamOutlined", component: "../features/admins/AdminsPage", access: "canAdmins" },
  { path: "/roles", name: "角色权限", icon: "SafetyCertificateOutlined", component: "../features/roles/RolesPage", access: "canRoles" },
  { path: "/security", name: "安全日志", icon: "AuditOutlined", component: "../features/security/SecurityPage", access: "canSecurity" },
  { path: "/system", name: "系统状态", icon: "DashboardOutlined", component: "../features/system/SystemStatusPage" },
  { path: "*", redirect: "/welcome" },
];
