import type { AdminRead } from "@pinjie/api-client";
import { KeyOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { history, Link } from "@umijs/max";
import { QueryClient, QueryClientProvider, useMutation } from "@tanstack/react-query";
import { Alert, Avatar, Button, ConfigProvider, Drawer, Dropdown, Form, Input, Result, Typography, message, theme } from "antd";
import zhCN from "antd/locale/zh_CN";
import type { ReactNode } from "react";
import { useState } from "react";

import defaultSettings from "../config/defaultSettings";
import { AdminContext } from "./features/auth/auth-context";
import { adminApi } from "./lib/api/admin";
import { ApiError, errorMessage } from "./lib/api/http";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: 15_000 }, mutations: { retry: false } },
});

export type AdminInitialState = {
  currentAdmin?: AdminRead;
  bootstrapError?: string;
  settings: typeof defaultSettings;
};

export async function getInitialState(): Promise<AdminInitialState> {
  const settings = defaultSettings;
  if (history.location.pathname === "/login") return { settings };
  try {
    return { currentAdmin: await adminApi.me(), settings };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const { pathname, search, hash } = history.location;
      history.replace(`/login?redirect=${encodeURIComponent(pathname + search + hash)}`);
      return { settings };
    }
    return { settings, bootstrapError: errorMessage(error) };
  }
}

function PasswordDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form] = Form.useForm<{ current_password: string; new_password: string }>();
  const mutation = useMutation({
    mutationFn: (values: { current_password: string; new_password: string }) => adminApi.changePassword(values.current_password, values.new_password),
    onSuccess: () => {
      message.success("密码已修改，当前会话已更新，其他会话已撤销");
      form.resetFields();
      onClose();
    },
  });
  return <Drawer open={open} title="账户安全" styles={{ wrapper: { width: 420 } }} onClose={onClose}>
    <Typography.Paragraph type="secondary">修改密码会保留当前会话并撤销其他会话。</Typography.Paragraph>
    {mutation.isError && <Alert showIcon type="error" title={errorMessage(mutation.error)} />}
    <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
      <Form.Item label="当前密码" name="current_password" rules={[{ required: true }, { max: 64, message: "密码最多 64 个字符" }]}><Input.Password autoComplete="current-password" maxLength={64} /></Form.Item>
      <Form.Item label="新密码" name="new_password" rules={[{ required: true }, { min: 6, max: 64, message: "密码必须为 6 至 64 个字符" }]}><Input.Password autoComplete="new-password" maxLength={64} /></Form.Item>
      <Button type="primary" htmlType="submit" loading={mutation.isPending}>修改密码</Button>
    </Form>
  </Drawer>;
}

function AccountMenu({ admin }: { admin: AdminRead }) {
  const [passwordOpen, setPasswordOpen] = useState(false);
  const logout = useMutation({
    mutationFn: adminApi.logout,
    onSuccess: () => {
      queryClient.clear();
      history.replace("/login");
      window.location.reload();
    },
    onError: (error) => message.error(errorMessage(error)),
  });
  return <>
    <Dropdown menu={{ items: [
      { key: "password", icon: <KeyOutlined />, label: "修改密码", onClick: () => setPasswordOpen(true) },
      { type: "divider" },
      { key: "logout", icon: <LogoutOutlined />, label: "退出登录", danger: true, disabled: logout.isPending, onClick: () => logout.mutate() },
    ] }}>
      <Button type="text" className="account-trigger" aria-label={`账户菜单：${admin.display_name || admin.username}`}>
        <Avatar size="small" icon={<UserOutlined />} />
        <span>{admin.display_name || admin.username}</span>
      </Button>
    </Dropdown>
    <PasswordDrawer open={passwordOpen} onClose={() => setPasswordOpen(false)} />
  </>;
}

function AdminLayoutFrame({ initialState, children }: { initialState: AdminInitialState; children: ReactNode }) {
  if (initialState.bootstrapError) {
    return <main className="bootstrap-state"><Result status="warning" title="管理服务暂不可用" subTitle={initialState.bootstrapError} extra={<Button type="primary" onClick={() => window.location.reload()}>重试</Button>} /></main>;
  }
  if (!initialState.currentAdmin) return <main className="bootstrap-state"><Typography.Text>正在初始化管理工作区</Typography.Text></main>;
  return <AdminContext.Provider value={initialState.currentAdmin}>{children}</AdminContext.Provider>;
}

export const layout = ({ initialState }: { initialState?: unknown }) => {
  const state = initialState as AdminInitialState | undefined;
  return {
    title: "Pinjie Console",
    menuItemRender: (item: { path?: string }, dom: ReactNode) => item.path ? <Link to={item.path}>{dom}</Link> : dom,
    menuHeaderRender: () => <div className="brand-mark"><span className="brand-mark__symbol">P</span><span className="brand-mark__title">Pinjie Console</span></div>,
    avatarProps: state?.currentAdmin ? {
      title: state.currentAdmin.display_name || state.currentAdmin.username,
      render: () => state.currentAdmin ? <AccountMenu admin={state.currentAdmin} /> : null,
    } : undefined,
    actionsRender: () => [],
    footerRender: () => <footer className="admin-footer">Pinjie Console</footer>,
    childrenRender: (children: ReactNode) => <AdminLayoutFrame initialState={state ?? { settings: defaultSettings }}>{children}</AdminLayoutFrame>,
    ...state?.settings,
    siderWidth: 224,
    token: {
      bgLayout: "#f5f7fa",
      header: {
        colorBgHeader: "#ffffff",
        colorBgScrollHeader: "#ffffff",
        colorHeaderTitle: "#101828",
        colorTextRightActionsItem: "#344054",
        heightLayoutHeader: 56,
      },
      sider: {
        colorMenuBackground: "#001529",
        colorBgCollapsedButton: "#0b1f33",
        colorTextCollapsedButton: "#ffffff",
        colorTextCollapsedButtonHover: "#ffffff",
        colorBgMenuItemCollapsedElevated: "#0b1f33",
        colorMenuItemDivider: "rgb(255 255 255 / 10%)",
        colorBgMenuItemHover: "#14395c",
        colorBgMenuItemActive: "#0958d9",
        colorBgMenuItemSelected: "#0958d9",
        colorTextMenuSelected: "#ffffff",
        colorTextMenuItemHover: "#ffffff",
        colorTextMenuActive: "#ffffff",
        colorTextMenu: "#c7d2e0",
        colorTextMenuSecondary: "#94a3b8",
        colorTextMenuTitle: "#ffffff",
        colorTextSubMenuSelected: "#ffffff",
      },
      pageContainer: {
        colorBgPageContainer: "#f5f7fa",
        colorBgPageContainerFixed: "#ffffff",
      },
    },
  };
};

export function rootContainer(container: ReactNode) {
  return <ConfigProvider locale={zhCN} theme={{ algorithm: theme.defaultAlgorithm, token: {
    borderRadius: 8,
    borderRadiusLG: 8,
    controlHeight: 36,
    colorError: "#b42318",
    colorBgLayout: "#f5f7fa",
    colorPrimary: "#0958d9",
    colorSuccess: "#135200",
    colorSuccessBg: "#f6ffed",
    colorSuccessBorder: "#95de64",
    colorSuccessText: "#135200",
    colorTextDescription: "#595959",
    colorTextSecondary: "#595959",
    fontFamily: '"Segoe UI", "Microsoft YaHei", sans-serif',
  }, components: {
    Card: { headerBg: "#ffffff" },
    Table: { headerBg: "#f7f8fa", headerColor: "#344054", rowHoverBg: "#f5f9ff" },
  } }}><QueryClientProvider client={queryClient}>{container}</QueryClientProvider></ConfigProvider>;
}
