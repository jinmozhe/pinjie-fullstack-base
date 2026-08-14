import type { AdminCreateIn, AdminRead, ConfirmationAction } from "@pinjie/api-client";
import { PlusOutlined, SafetyCertificateOutlined, TeamOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Checkbox, Drawer, Flex, Form, Input, Modal, Select, Space, Table, Tag, Typography, message } from "antd";
import { useState } from "react";

import { PageFrame, QueryState, formatTime } from "@/components/PageFrame";
import { ConfirmActionModal, canAccess, useCurrentAdmin } from "@/features/auth";
import { adminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/http";

type Confirmation = { action: ConfirmationAction; title: string; execute: (token: string) => Promise<void> };

export function AdminsPage() {
  const current = useCurrentAdmin();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [roleTarget, setRoleTarget] = useState<AdminRead | null>(null);
  const [sessionTarget, setSessionTarget] = useState<AdminRead | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [createForm] = Form.useForm<AdminCreateIn>();
  const [roleForm] = Form.useForm<{ role_ids: string[] }>();
  const admins = useQuery({ queryKey: ["admins", page], queryFn: () => adminApi.admins(page) });
  const roles = useQuery({ queryKey: ["roles-options"], queryFn: () => adminApi.roles(1) });
  const sessions = useQuery({ queryKey: ["admin-sessions", sessionTarget?.id], queryFn: () => adminApi.adminSessions(sessionTarget!.id), enabled: Boolean(sessionTarget) });
  const invalidate = async () => queryClient.invalidateQueries({ queryKey: ["admins"] });
  const begin = (action: ConfirmationAction, title: string, execute: (token: string) => Promise<void>) => setConfirmation({ action, title, execute });
  const create = useMutation({
    mutationFn: async (values: AdminCreateIn) => {
      begin("admins:create", "确认创建管理员", async (token) => { await adminApi.createAdmin(values, token); message.success("管理员已创建"); setCreating(false); createForm.resetFields(); await invalidate(); });
    },
  });

  return (
    <PageFrame title="管理员" description="维护管理身份、超级管理员状态、角色和活动会话。" action={canAccess(current, "admins:create") ? <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>新建管理员</Button> : undefined}>
      <QueryState loading={admins.isLoading} error={admins.isError ? errorMessage(admins.error) : undefined} empty={admins.data?.items.length === 0} onRetry={() => void admins.refetch()} />
      {admins.data && admins.data.items.length > 0 && <Table<AdminRead>
        rowKey="id" dataSource={admins.data.items} scroll={{ x: 900 }} pagination={{ current: page, pageSize: 20, total: admins.data.total, showSizeChanger: false, onChange: setPage }}
        columns={[
          { title: "管理员", dataIndex: "username", render: (_, row) => <><Typography.Text strong>{row.display_name || row.username}</Typography.Text><br /><Typography.Text type="secondary">{row.username}</Typography.Text></> },
          { title: "身份", key: "identity", render: (_, row) => row.is_superuser ? <Tag color="gold" icon={<SafetyCertificateOutlined />}>超级管理员</Tag> : <Tag>管理员</Tag> },
          { title: "角色", dataIndex: "roles", render: (items: AdminRead["roles"]) => items.length ? items.map((role) => <Tag key={role.id}>{role.name}</Tag>) : "-" },
          { title: "状态", dataIndex: "is_active", width: 90, render: (value) => <Tag color={value ? "success" : "default"}>{value ? "正常" : "停用"}</Tag> },
          { title: "更新时间", dataIndex: "updated_at", width: 170, render: formatTime },
          { title: "操作", fixed: "right", width: 270, render: (_, row) => <Space size="small">
            {canAccess(current, "admins:roles:assign") && <Button size="small" icon={<TeamOutlined />} onClick={() => { setRoleTarget(row); roleForm.setFieldsValue({ role_ids: row.roles.map((role) => role.id) }); }}>角色</Button>}
            {canAccess(current, "admins:update") && <Button size="small" disabled={row.id === current.id} danger={row.is_active} onClick={() => begin("admins:status:change", `${row.is_active ? "停用" : "启用"}管理员`, async (token) => { await adminApi.setAdminStatus(row.id, !row.is_active, token); message.success("管理员状态已更新"); await invalidate(); })}>{row.is_active ? "停用" : "启用"}</Button>}
            {canAccess(current, "admins:sessions:read") && <Button size="small" onClick={() => setSessionTarget(row)}>会话</Button>}
          </Space> },
        ]}
      />}

      <Modal open={creating} title="新建管理员" okText="下一步" onCancel={() => setCreating(false)} onOk={() => createForm.submit()}>
        {create.isError && <Alert type="error" showIcon message={errorMessage(create.error)} />}
        <Form<AdminCreateIn> form={createForm} layout="vertical" initialValues={{ is_active: true, is_superuser: false, role_ids: [] }} onFinish={(values) => create.mutate(values)}>
          <Form.Item label="用户名" name="username" rules={[{ required: true }, { min: 3 }]}><Input autoComplete="off" /></Form.Item>
          <Form.Item label="显示名称" name="display_name"><Input maxLength={100} /></Form.Item>
          <Form.Item label="初始密码" name="initial_password" rules={[{ required: true }, { min: 12, message: "密码至少 12 个字符" }]}><Input.Password autoComplete="new-password" /></Form.Item>
          <Form.Item label="角色" name="role_ids"><Select mode="multiple" options={roles.data?.items.map((role) => ({ label: role.name, value: role.id }))} /></Form.Item>
          <Form.Item name="is_superuser" valuePropName="checked"><Checkbox>超级管理员</Checkbox></Form.Item>
        </Form>
      </Modal>

      <Modal open={Boolean(roleTarget)} title="分配角色" okText="下一步" onCancel={() => setRoleTarget(null)} onOk={() => roleForm.submit()}>
        <Form form={roleForm} layout="vertical" onFinish={({ role_ids }) => {
          const target = roleTarget; if (!target) return; setRoleTarget(null);
          begin("admins:roles:assign", "确认修改管理员角色", async (token) => { await adminApi.assignAdminRoles(target.id, role_ids, token); message.success("角色已更新，相关会话已撤销"); await invalidate(); });
        }}><Form.Item label="角色" name="role_ids"><Select mode="multiple" options={roles.data?.items.map((role) => ({ label: role.name, value: role.id }))} /></Form.Item></Form>
      </Modal>

      <Drawer open={Boolean(sessionTarget)} width={560} title={sessionTarget ? `${sessionTarget.username} 的会话` : "管理员会话"} onClose={() => setSessionTarget(null)} extra={sessionTarget && canAccess(current, "admins:sessions:revoke") ? <Button danger disabled={sessionTarget.id === current.id} onClick={() => begin("admins:sessions:revoke", "撤销管理员全部会话", async (token) => { await adminApi.revokeAdminSessions(sessionTarget.id, token); message.success("会话已撤销"); await sessions.refetch(); })}>撤销全部</Button> : null}>
        <QueryState loading={sessions.isLoading} error={sessions.isError ? errorMessage(sessions.error) : undefined} empty={sessions.data?.length === 0} onRetry={() => void sessions.refetch()} />
        {sessions.data?.map((session) => <div className="session-row" key={session.id}><Flex justify="space-between"><Typography.Text strong>{session.device_name || "未知设备"}</Typography.Text>{session.revoked_at ? <Tag>已撤销</Tag> : <Tag color="success">有效</Tag>}</Flex><Typography.Text type="secondary">{session.ip_masked || "未知地址"} · {formatTime(session.last_seen_at)}</Typography.Text></div>)}
      </Drawer>

      {confirmation && <ConfirmActionModal action={confirmation.action} open title={confirmation.title} onCancel={() => setConfirmation(null)} onConfirmed={confirmation.execute} />}
    </PageFrame>
  );
}
