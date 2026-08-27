import type { AdminCreateIn, AdminRead, AdminUpdateIn } from "@pinjie/api-client";
import {
  CheckCircleOutlined,
  EditOutlined,
  EllipsisOutlined,
  KeyOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { ProTable } from "@ant-design/pro-components";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Avatar,
  Button,
  Checkbox,
  Drawer,
  Dropdown,
  Flex,
  Form,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import type { MenuProps } from "antd";
import { useState } from "react";

import { PageFrame, QueryState, formatTime } from "@/components/PageFrame";
import { AvatarUploader } from "@/components/Uploader";
import { canAccess, useCurrentAdmin } from "@/features/auth";
import { adminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/http";

type PasswordFormValues = { new_password: string; confirm_password: string };

function fallbackAvatarText(admin: AdminRead) {
  return (admin.display_name?.trim() || admin.username.trim()).slice(0, 1).toUpperCase();
}

export function AdminsPage() {
  const current = useCurrentAdmin();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminRead | null>(null);
  const [roleTarget, setRoleTarget] = useState<AdminRead | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<AdminRead | null>(null);
  const [sessionTarget, setSessionTarget] = useState<AdminRead | null>(null);
  const [sessionPage, setSessionPage] = useState(1);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [createForm] = Form.useForm<AdminCreateIn>();
  const [editForm] = Form.useForm<AdminUpdateIn>();
  const [roleForm] = Form.useForm<{ role_ids: string[] }>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();
  const editAvatar = Form.useWatch("avatar", editForm);
  const admins = useQuery({ queryKey: ["admins", page], queryFn: () => adminApi.admins(page) });
  const canUpdate = canAccess(current, "admins:update");
  const canReadRoles = canAccess(current, "roles:read");
  const canAssignRoles = canAccess(current, "admins:roles:assign") && canReadRoles;
  const canReadSessions = canAccess(current, "admins:sessions:read");
  const canResetPassword = canAccess(current, "admins:credentials:reset");
  const roles = useQuery({ queryKey: ["roles-options"], queryFn: () => adminApi.roles(1), enabled: canReadRoles });
  const sessions = useQuery({
    queryKey: ["admin-sessions", sessionTarget?.id, sessionPage],
    queryFn: () => adminApi.adminSessions(sessionTarget!.id, sessionPage),
    enabled: Boolean(sessionTarget) && canReadSessions,
  });
  const invalidate = async () => queryClient.invalidateQueries({ queryKey: ["admins"] });
  const create = useMutation({
    mutationFn: (values: AdminCreateIn) => adminApi.createAdmin(values),
    onSuccess: async () => {
      message.success("管理员已创建");
      setCreating(false);
      createForm.resetFields();
      await invalidate();
    },
  });
  const edit = useMutation({
    mutationFn: async (values: AdminUpdateIn) => {
      if (!editTarget) throw new Error("未选择要编辑的管理员");
      return adminApi.updateAdmin(editTarget.id, values);
    },
    onSuccess: async () => {
      message.success("管理员资料已更新");
      setEditTarget(null);
      editForm.resetFields();
      await invalidate();
    },
  });
  const batchStatusMutation = useMutation({
    mutationFn: ({ adminIds, isActive }: { adminIds: string[]; isActive: boolean }) =>
      adminApi.setAdminStatusBulk({ admin_ids: adminIds, is_active: isActive }),
    onSuccess: async (_result, { adminIds, isActive }) => {
      message.success(`已批量${isActive ? "启用" : "停用"} ${adminIds.length} 名管理员`);
      setSelectedRowKeys([]);
      await invalidate();
    },
  });
  const statusMutation = useMutation({
    mutationFn: ({ adminId, isActive }: { adminId: string; isActive: boolean }) =>
      adminApi.setAdminStatus(adminId, isActive),
    onSuccess: async () => {
      message.success("管理员状态已更新");
      await invalidate();
    },
    onError: (error) => message.error(errorMessage(error)),
  });
  const superuserMutation = useMutation({
    mutationFn: ({ adminId, isSuperuser }: { adminId: string; isSuperuser: boolean }) =>
      adminApi.updateAdmin(adminId, { is_superuser: isSuperuser }),
    onSuccess: async () => {
      message.success("管理员身份已更新，相关会话已撤销");
      await invalidate();
    },
    onError: (error) => message.error(errorMessage(error)),
  });
  const resetPasswordMutation = useMutation({
    mutationFn: ({ adminId, newPassword }: { adminId: string; newPassword: string }) =>
      adminApi.resetAdminPassword(adminId, newPassword),
    onSuccess: () => {
      message.success("密码已重置，历史会话已撤销");
      setPasswordTarget(null);
      passwordForm.resetFields();
    },
  });
  const assignRolesMutation = useMutation({
    mutationFn: ({ adminId, roleIds }: { adminId: string; roleIds: string[] }) =>
      adminApi.assignAdminRoles(adminId, roleIds),
    onSuccess: async () => {
      message.success("角色已更新，相关会话已撤销");
      setRoleTarget(null);
      await invalidate();
    },
  });
  const revokeSessionsMutation = useMutation({
    mutationFn: (adminId: string) => adminApi.revokeAdminSessions(adminId),
    onSuccess: async () => {
      message.success("会话已撤销");
      await sessions.refetch();
    },
    onError: (error) => message.error(errorMessage(error)),
  });

  const closeEdit = () => {
    setEditTarget(null);
    editForm.resetFields();
    edit.reset();
  };

  const openEdit = (admin: AdminRead) => {
    setEditTarget(admin);
    edit.reset();
    editForm.setFieldsValue({ avatar: admin.avatar ?? null, display_name: admin.display_name ?? null });
  };

  const beginBulkStatusChange = (isActive: boolean) => {
    const adminIds = [...selectedRowKeys];
    void batchStatusMutation
      .mutateAsync({ adminIds, isActive })
      .catch((error: unknown) => message.error(errorMessage(error)));
  };

  const moreMenu = (admin: AdminRead): MenuProps => {
    const items: NonNullable<MenuProps["items"]> = [];
    if (canResetPassword && admin.id !== current.id) {
      items.push({
        key: "reset-password",
        icon: <KeyOutlined />,
        label: "重置密码",
        onClick: () => {
          passwordForm.resetFields();
          setPasswordTarget(admin);
        },
      });
    }
    if (canUpdate && admin.id !== current.id) {
      if (items.length) items.push({ type: "divider" });
      items.push({
        key: "status",
        danger: admin.is_active,
        icon: admin.is_active ? <StopOutlined /> : <CheckCircleOutlined />,
        label: admin.is_active ? "停用" : "启用",
        onClick: () => statusMutation.mutate({ adminId: admin.id, isActive: !admin.is_active }),
      });
    }
    return { items };
  };

  const identityTag = (admin: AdminRead) => {
    const tag = admin.is_superuser ? (
      <Tag color="blue" icon={<SafetyCertificateOutlined />}>
        超级管理员
      </Tag>
    ) : (
      <Tag>管理员</Tag>
    );
    if (!canUpdate || admin.id === current.id) {
      return (
        <Tooltip title={admin.id === current.id ? "不能修改自己的超级管理员身份" : "没有修改管理员的权限"}>
          <span>{tag}</span>
        </Tooltip>
      );
    }
    return (
      <Tooltip title={admin.is_superuser ? "取消超级管理员" : "设为超级管理员"}>
        <Button
          type="text"
          size="small"
          aria-label={`${admin.is_superuser ? "取消" : "设为"}超级管理员：${admin.username}`}
          style={{ height: "auto", padding: 0 }}
          loading={superuserMutation.isPending && superuserMutation.variables?.adminId === admin.id}
          onClick={() => superuserMutation.mutate({ adminId: admin.id, isSuperuser: !admin.is_superuser })}
        >
          {tag}
        </Button>
      </Tooltip>
    );
  };

  return (
    <PageFrame title="管理员" description="维护管理身份、超级管理员状态、角色和活动会话。">
      <QueryState
        loading={admins.isLoading}
        error={admins.isError ? errorMessage(admins.error) : undefined}
        onRetry={() => void admins.refetch()}
      />
      {admins.data && (
        <ProTable<AdminRead>
          className="admins-table"
          rowKey="id"
          dataSource={admins.data.items}
          search={false}
          options={{ density: true, fullScreen: true, reload: () => void admins.refetch(), setting: true }}
          cardProps={false}
          headerTitle="管理员列表"
          toolBarRender={() => [
            canAccess(current, "admins:create") ? (
              <Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
                新建管理员
              </Button>
            ) : null,
          ]}
          rowSelection={
            canUpdate
              ? {
                  selectedRowKeys,
                  onChange: (keys) => setSelectedRowKeys(keys.map(String)),
                  getCheckboxProps: (admin) => ({
                    disabled: admin.id === current.id,
                    title: admin.id === current.id ? "不能批量修改自己的启用状态" : undefined,
                  }),
                }
              : false
          }
          tableAlertRender={({ selectedRowKeys: keys }) => <span>已选择 {keys.length} 项</span>}
          tableAlertOptionRender={({ onCleanSelected }) => (
            <Space size={8} wrap={false}>
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                disabled={batchStatusMutation.isPending}
                loading={batchStatusMutation.isPending && batchStatusMutation.variables?.isActive}
                onClick={() => beginBulkStatusChange(true)}
              >
                批量启用
              </Button>
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                disabled={batchStatusMutation.isPending}
                loading={batchStatusMutation.isPending && !batchStatusMutation.variables?.isActive}
                onClick={() => beginBulkStatusChange(false)}
              >
                批量停用
              </Button>
              <Button type="link" size="small" onClick={onCleanSelected}>
                取消选择
              </Button>
            </Space>
          )}
          pagination={{
            current: page,
            pageSize: 20,
            total: admins.data.total,
            showSizeChanger: false,
            onChange: (nextPage) => {
              setPage(nextPage);
              setSelectedRowKeys([]);
            },
          }}
          scroll={{ x: "max-content" }}
          columns={[
            {
              title: "管理员",
              dataIndex: "username",
              render: (_, admin) => {
                const fallback = fallbackAvatarText(admin);
                return (
                  <Flex align="center" gap={10} style={{ minWidth: 180 }}>
                    <Avatar
                      size={36}
                      src={admin.avatar || undefined}
                      alt={`${admin.display_name || admin.username}的头像`}
                      icon={!admin.avatar && !fallback ? <UserOutlined /> : undefined}
                    >
                      {!admin.avatar ? fallback : null}
                    </Avatar>
                    <div className="table-primary-cell" style={{ minWidth: 0 }}>
                      <Typography.Text strong ellipsis={{ tooltip: admin.display_name || admin.username }}>
                        {admin.display_name || admin.username}
                      </Typography.Text>
                      <Typography.Text type="secondary" ellipsis={{ tooltip: admin.username }}>
                        {admin.username}
                      </Typography.Text>
                    </div>
                  </Flex>
                );
              },
            },
            { title: "身份", key: "identity", render: (_, admin) => identityTag(admin) },
            {
              title: "角色",
              dataIndex: "roles",
              render: (_, admin) =>
                admin.roles.length ? admin.roles.map((role) => <Tag key={role.id}>{role.name}</Tag>) : "-",
            },
            {
              title: "状态",
              dataIndex: "is_active",
              width: 90,
              render: (value) => <Tag color={value ? "success" : "default"}>{value ? "正常" : "停用"}</Tag>,
            },
            {
              title: "更新时间",
              dataIndex: "updated_at",
              width: 170,
              responsive: ["xl"],
              render: (_, admin) => formatTime(admin.updated_at),
            },
            {
              title: "操作",
              key: "actions",
              width: "1%",
              onHeaderCell: () => ({ style: { whiteSpace: "nowrap" } }),
              onCell: () => ({ style: { whiteSpace: "nowrap" } }),
              render: (_, admin) => {
                const menu = moreMenu(admin);
                return (
                  <Space className="table-actions" size={[2, 0]} wrap={false}>
                    {canUpdate && (
                      <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(admin)}>
                        编辑
                      </Button>
                    )}
                    {canAssignRoles && (
                      <Tooltip title={admin.id === current.id ? "不能修改自己的角色" : undefined}>
                        <span>
                          <Button
                            type="link"
                            size="small"
                            icon={<TeamOutlined />}
                            disabled={admin.id === current.id}
                            onClick={() => {
                              setRoleTarget(admin);
                              roleForm.setFieldsValue({ role_ids: admin.roles.map((role) => role.id) });
                            }}
                          >
                            角色
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                    {canReadSessions && (
                      <Button
                        type="link"
                        size="small"
                        onClick={() => {
                          setSessionPage(1);
                          setSessionTarget(admin);
                        }}
                      >
                        会话
                      </Button>
                    )}
                    {menu.items?.length ? (
                      <Tooltip title="更多操作">
                        <Dropdown menu={menu} trigger={["click"]} placement="bottomRight">
                          <Button
                            type="text"
                            size="small"
                            icon={<EllipsisOutlined />}
                            aria-label={`更多操作：${admin.username}`}
                          />
                        </Dropdown>
                      </Tooltip>
                    ) : null}
                  </Space>
                );
              },
            },
          ]}
        />
      )}

      <Modal open={creating} title="新建管理员" okText="保存" confirmLoading={create.isPending} onCancel={() => setCreating(false)} onOk={() => createForm.submit()}>
        {create.isError && <Alert type="error" showIcon title={errorMessage(create.error)} />}
        <Form<AdminCreateIn> form={createForm} layout="vertical" initialValues={{ is_active: true, is_superuser: false, role_ids: [] }} onFinish={(values) => create.mutate(values)}>
          <Form.Item label="用户名" name="username" rules={[{ required: true }, { min: 3 }]}><Input autoComplete="off" /></Form.Item>
          <Form.Item label="显示名称" name="display_name"><Input maxLength={100} /></Form.Item>
          <Form.Item label="初始密码" name="initial_password" rules={[{ required: true }, { min: 6, max: 64, message: "密码必须为 6 至 64 个字符" }]}><Input.Password autoComplete="new-password" maxLength={64} /></Form.Item>
          {canReadRoles && <Form.Item label="角色" name="role_ids"><Select mode="multiple" options={roles.data?.items.map((role) => ({ label: role.name, value: role.id }))} /></Form.Item>}
          <Form.Item name="is_superuser" valuePropName="checked"><Checkbox>超级管理员</Checkbox></Form.Item>
        </Form>
      </Modal>

      <Drawer open={Boolean(editTarget)} title={editTarget ? `编辑管理员：${editTarget.username}` : "编辑管理员"} size={480} destroyOnHidden onClose={closeEdit} extra={<Space><Button onClick={closeEdit}>取消</Button><Button type="primary" loading={edit.isPending} onClick={() => editForm.submit()}>保存</Button></Space>}>
        {edit.isError && <Alert type="error" showIcon title={errorMessage(edit.error)} style={{ marginBottom: 16 }} />}
        <Form<AdminUpdateIn> form={editForm} layout="vertical" onFinish={(values) => edit.mutate(values)}>
          <Form.Item label="头像">
            <Space orientation="vertical" size={4}>
              <Form.Item name="avatar" noStyle><AvatarUploader disabled={edit.isPending} /></Form.Item>
              {editAvatar ? <Button type="link" size="small" danger disabled={edit.isPending} onClick={() => editForm.setFieldValue("avatar", null)}>移除头像</Button> : null}
            </Space>
          </Form.Item>
          <Form.Item label="登录账号"><Input value={editTarget?.username} disabled prefix={<UserOutlined />} /></Form.Item>
          <Form.Item label="显示名称" name="display_name" rules={[{ max: 100, message: "显示名称最多 100 个字符" }]}><Input maxLength={100} placeholder="请输入显示名称" /></Form.Item>
        </Form>
      </Drawer>

      <Modal open={Boolean(passwordTarget)} title={passwordTarget ? `重置密码：${passwordTarget.username}` : "重置密码"} okText="确定" confirmLoading={resetPasswordMutation.isPending} destroyOnHidden onCancel={() => { setPasswordTarget(null); passwordForm.resetFields(); }} onOk={() => passwordForm.submit()}>
        {resetPasswordMutation.isError && <Alert type="error" showIcon title={errorMessage(resetPasswordMutation.error)} />}
        <Form<PasswordFormValues> form={passwordForm} layout="vertical" onFinish={({ new_password }) => {
          const target = passwordTarget;
          if (!target) return;
          resetPasswordMutation.mutate({ adminId: target.id, newPassword: new_password });
        }}>
          <Form.Item label="新密码" name="new_password" rules={[{ required: true, message: "请输入新密码" }, { min: 6, max: 64, message: "密码必须为 6 至 64 个字符" }]}><Input.Password autoComplete="new-password" maxLength={64} /></Form.Item>
          <Form.Item label="确认新密码" name="confirm_password" dependencies={["new_password"]} rules={[{ required: true, message: "请再次输入新密码" }, ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue("new_password") === value) return Promise.resolve(); return Promise.reject(new Error("两次输入的密码不一致")); } })]}><Input.Password autoComplete="new-password" maxLength={64} /></Form.Item>
        </Form>
      </Modal>

      <Modal open={Boolean(roleTarget)} title="分配角色" okText="保存" confirmLoading={assignRolesMutation.isPending} onCancel={() => setRoleTarget(null)} onOk={() => roleForm.submit()}>
        {assignRolesMutation.isError && <Alert type="error" showIcon title={errorMessage(assignRolesMutation.error)} />}
        <Form form={roleForm} layout="vertical" onFinish={({ role_ids }) => {
          const target = roleTarget;
          if (!target) return;
          assignRolesMutation.mutate({ adminId: target.id, roleIds: role_ids });
        }}><Form.Item label="角色" name="role_ids"><Select mode="multiple" options={roles.data?.items.map((role) => ({ label: role.name, value: role.id }))} /></Form.Item></Form>
      </Modal>

      <Drawer open={Boolean(sessionTarget)} styles={{ wrapper: { width: 560 } }} title={sessionTarget ? `${sessionTarget.username} 的会话` : "管理员会话"} onClose={() => { setSessionTarget(null); setSessionPage(1); }} extra={sessionTarget && canAccess(current, "admins:sessions:revoke") ? <Tooltip title={sessionTarget.id === current.id ? "不能在此处撤销自己的会话" : undefined}><span><Button danger disabled={sessionTarget.id === current.id} loading={revokeSessionsMutation.isPending} onClick={() => revokeSessionsMutation.mutate(sessionTarget.id)}>撤销全部</Button></span></Tooltip> : null}>
        <QueryState loading={sessions.isLoading} error={sessions.isError ? errorMessage(sessions.error) : undefined} empty={sessions.data?.items.length === 0} onRetry={() => void sessions.refetch()} />
        {sessions.data?.items.map((session) => <div className="session-row" key={session.id}><Flex justify="space-between"><Typography.Text strong>{session.device_name || "未知设备"}</Typography.Text>{session.revoked_at ? <Tag>已撤销</Tag> : <Tag color="success">有效</Tag>}</Flex><Typography.Text type="secondary">{session.ip_masked || "未知地址"} · {formatTime(session.last_seen_at)}</Typography.Text></div>)}
        {sessions.data && sessions.data.total_pages > 1 && <Pagination current={sessionPage} pageSize={sessions.data.page_size} total={sessions.data.total} showSizeChanger={false} onChange={setSessionPage} />}
      </Drawer>

    </PageFrame>
  );
}

export default AdminsPage;
