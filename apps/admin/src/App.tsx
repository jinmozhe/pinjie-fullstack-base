import type { AdminRead } from "@pinjie/api-client";
import {
  AuditOutlined,
  DashboardOutlined,
  KeyOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Avatar, Button, Drawer, Dropdown, Flex, Form, Grid, Input, Layout, Menu, Result, Skeleton, Typography, message } from "antd";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router";

import { AdminsPage } from "@/features/admins/AdminsPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { AdminContext, canAccess } from "@/features/auth/auth-context";
import { RolesPage } from "@/features/roles/RolesPage";
import { SecurityPage } from "@/features/security/SecurityPage";
import { SystemStatusPage } from "@/features/system/SystemStatusPage";
import { UsersPage } from "@/features/users/UsersPage";
import { adminApi } from "@/lib/api/admin";
import { ApiError, errorMessage } from "@/lib/api/http";

const { Header, Sider, Content } = Layout;

type NavItem = { key: string; label: string; icon: ReactNode; permission?: string };
const NAV_ITEMS: NavItem[] = [
  { key: "/users", label: "用户", icon: <UserOutlined />, permission: "users:read" },
  { key: "/admins", label: "管理员", icon: <TeamOutlined />, permission: "admins:read" },
  { key: "/roles", label: "角色权限", icon: <SafetyCertificateOutlined />, permission: "roles:read" },
  { key: "/security", label: "安全日志", icon: <AuditOutlined />, permission: "security:login-events:read" },
  { key: "/system", label: "系统状态", icon: <DashboardOutlined /> },
];

function Guard({ admin, permission, children }: { admin: AdminRead; permission?: string; children: ReactNode }) {
  if (permission && !canAccess(admin, permission)) return <Result status="403" title="无权访问" subTitle="当前管理员缺少此页面所需权限。" />;
  return children;
}

function AccountDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form] = Form.useForm<{ current_password: string; new_password: string }>();
  const mutation = useMutation({
    mutationFn: (values: { current_password: string; new_password: string }) => adminApi.changePassword(values.current_password, values.new_password),
    onSuccess: () => { message.success("密码已修改，请使用新密码重新登录"); form.resetFields(); onClose(); window.location.assign("/login"); },
  });
  return <Drawer open={open} title="账户安全" width={420} onClose={onClose}>
    <Typography.Paragraph type="secondary">修改密码会撤销当前管理员的全部会话。</Typography.Paragraph>
    {mutation.isError && <Alert showIcon type="error" message={errorMessage(mutation.error)} />}
    <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
      <Form.Item label="当前密码" name="current_password" rules={[{ required: true }, { max: 64, message: "密码最多 64 个字符" }]}><Input.Password autoComplete="current-password" maxLength={64} /></Form.Item>
      <Form.Item label="新密码" name="new_password" rules={[{ required: true }, { min: 6, max: 64, message: "密码必须为 6 至 64 个字符" }]}><Input.Password autoComplete="new-password" maxLength={64} /></Form.Item>
      <Button type="primary" htmlType="submit" loading={mutation.isPending}>修改密码</Button>
    </Form>
  </Drawer>;
}

function AdminShell({ admin }: { admin: AdminRead }) {
  const screens = Grid.useBreakpoint();
  const mobile = !screens.lg;
  const [collapsed, setCollapsed] = useState(mobile);
  const [accountOpen, setAccountOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logout = useMutation({
    mutationFn: adminApi.logout,
    onSettled: async () => { queryClient.clear(); await navigate("/login", { replace: true }); },
  });
  const navigation = useMemo(() => NAV_ITEMS.filter((item) => !item.permission || canAccess(admin, item.permission)), [admin]);

  return <AdminContext.Provider value={admin}>
    <Layout className="admin-shell">
      <Sider breakpoint="lg" collapsed={collapsed} collapsedWidth={mobile ? 0 : 72} theme="light" width={224} onBreakpoint={(broken) => setCollapsed(broken)}>
        <div className="brand-mark"><span className="brand-mark__symbol">P</span>{!collapsed && <span>Pinjie Console</span>}</div>
        <Menu mode="inline" selectedKeys={[navigation.find((item) => location.pathname.startsWith(item.key))?.key ?? "/system"]} items={navigation.map((item) => ({ key: item.key, icon: item.icon, label: <Link to={item.key}>{item.label}</Link> }))} />
      </Sider>
      <Layout>
        <Header className="admin-header">
          <Button className="menu-trigger" type="text" aria-label={collapsed ? "展开导航" : "收起导航"} icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed((value) => !value)} />
          <div className="admin-header__spacer" />
          <Dropdown menu={{ items: [
            { key: "password", icon: <KeyOutlined />, label: "修改密码", onClick: () => setAccountOpen(true) },
            { type: "divider" },
            { key: "logout", icon: <LogoutOutlined />, label: "退出登录", danger: true, onClick: () => logout.mutate() },
          ] }}>
            <Button
              type="text"
              className="account-trigger"
              aria-label={`账户菜单：${admin.display_name || admin.username}`}
            >
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{admin.display_name || admin.username}</span>
            </Button>
          </Dropdown>
        </Header>
        <Content className="admin-content">
          <Routes>
            <Route path="/users" element={<Guard admin={admin} permission="users:read"><UsersPage /></Guard>} />
            <Route path="/admins" element={<Guard admin={admin} permission="admins:read"><AdminsPage /></Guard>} />
            <Route path="/roles" element={<Guard admin={admin} permission="roles:read"><RolesPage /></Guard>} />
            <Route path="/security" element={<Guard admin={admin} permission="security:login-events:read"><SecurityPage /></Guard>} />
            <Route path="/system" element={<SystemStatusPage />} />
            <Route path="*" element={<Navigate to={navigation[0]?.key ?? "/system"} replace />} />
          </Routes>
        </Content>
      </Layout>
      <AccountDrawer open={accountOpen} onClose={() => setAccountOpen(false)} />
    </Layout>
  </AdminContext.Provider>;
}

export default function App() {
  const location = useLocation();
  const me = useQuery({
    queryKey: ["admin-me"],
    queryFn: adminApi.me,
    enabled: location.pathname !== "/login",
    retry: false,
  });
  const unauthenticated = me.error instanceof ApiError && me.error.status === 401;
  if (location.pathname === "/login") return <LoginPage authenticated={Boolean(me.data)} />;
  if (me.isLoading) return <main className="bootstrap-state"><Flex vertical gap={18}><Skeleton.Avatar active size={56} /><Skeleton active paragraph={{ rows: 4 }} /></Flex></main>;
  if (unauthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (me.isError) return <main className="bootstrap-state"><Result status="warning" title="管理服务暂不可用" subTitle={errorMessage(me.error)} extra={<Button type="primary" onClick={() => void me.refetch()}>重试</Button>} /></main>;
  return <AdminShell admin={me.data!} />;
}
