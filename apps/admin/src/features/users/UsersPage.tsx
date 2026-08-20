import type { ConfirmationAction, UserPrincipalOut } from "@pinjie/api-client";
import { EditOutlined, KeyOutlined, LaptopOutlined, PoweroffOutlined, SearchOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Drawer, Flex, Form, Input, Modal, Space, Table, Tag, Typography, message } from "antd";
import { useState } from "react";

import { PageFrame, QueryState, formatTime } from "@/components/PageFrame";
import { ConfirmActionModal, canAccess, useCurrentAdmin } from "@/features/auth";
import { adminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/http";

type Confirmation = { action: ConfirmationAction; title: string; execute: (token: string) => Promise<void> };

export function UsersPage() {
  const current = useCurrentAdmin();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<UserPrincipalOut | null>(null);
  const [editing, setEditing] = useState<UserPrincipalOut | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<UserPrincipalOut | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [editForm] = Form.useForm<{ display_name?: string; email?: string }>();
  const [passwordForm] = Form.useForm<{ new_password: string }>();
  const users = useQuery({ queryKey: ["admin-users", page, search], queryFn: () => adminApi.users(page, search || undefined) });
  const sessions = useQuery({
    queryKey: ["admin-user-sessions", selected?.id],
    queryFn: () => adminApi.userSessions(selected!.id),
    enabled: Boolean(selected),
  });
  const invalidate = async () => queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  const editMutation = useMutation({
    mutationFn: (values: { display_name?: string; email?: string }) => adminApi.updateUser(editing!.id, values),
    onSuccess: async () => { message.success("用户资料已更新"); setEditing(null); await invalidate(); },
  });

  const beginConfirmation = (action: ConfirmationAction, title: string, execute: (token: string) => Promise<void>) => {
    setConfirmation({ action, title, execute });
  };

  return (
    <PageFrame title="用户管理" description="查询账户状态、维护基础资料并处理凭据与会话。">
      <Flex gap={12} className="table-toolbar" wrap>
        <Input
          allowClear
          aria-label="搜索用户"
          prefix={<SearchOutlined />}
          placeholder="用户名或显示名称"
          value={search}
          onChange={(event) => { setPage(1); setSearch(event.target.value); }}
        />
      </Flex>
      <QueryState loading={users.isLoading} error={users.isError ? errorMessage(users.error) : undefined} empty={users.data?.items.length === 0} onRetry={() => void users.refetch()} />
      {users.data && users.data.items.length > 0 && (
        <Table<UserPrincipalOut>
          rowKey="id"
          dataSource={users.data.items}
          scroll={{ x: 820 }}
          pagination={{ current: page, pageSize: 20, total: users.data.total, showSizeChanger: false, onChange: setPage }}
          columns={[
            { title: "用户", dataIndex: "username", render: (_, row) => <><Typography.Text strong>{row.display_name || row.username}</Typography.Text><br /><Typography.Text type="secondary">{row.username}</Typography.Text></> },
            { title: "邮箱", dataIndex: "email", render: (value) => value || "-" },
            { title: "状态", dataIndex: "is_active", width: 100, render: (value) => <Tag color={value ? "success" : "default"}>{value ? "正常" : "停用"}</Tag> },
            { title: "创建时间", dataIndex: "created_at", width: 170, render: formatTime },
            { title: "操作", key: "actions", fixed: "right", width: 270, render: (_, row) => (
              <Space size="small">
                {canAccess(current, "users:update") && <Button icon={<EditOutlined />} size="small" onClick={() => { setEditing(row); editForm.setFieldsValue({ display_name: row.display_name ?? undefined, email: row.email ?? undefined }); }}>编辑</Button>}
                {canAccess(current, "users:update") && <Button icon={<PoweroffOutlined />} size="small" danger={row.is_active} onClick={() => {
                  const run = async (token?: string) => { await adminApi.setUserStatus(row.id, !row.is_active, token); message.success("账户状态已更新"); await invalidate(); };
                  if (row.is_active) beginConfirmation("users:disable", "停用用户", (token) => run(token)); else void run();
                }}>{row.is_active ? "停用" : "启用"}</Button>}
                {canAccess(current, "users:sessions:read") && <Button icon={<LaptopOutlined />} size="small" onClick={() => setSelected(row)}>会话</Button>}
                {canAccess(current, "users:credentials:reset") && <Button icon={<KeyOutlined />} size="small" onClick={() => { setPasswordTarget(row); passwordForm.resetFields(); }}>重置密码</Button>}
              </Space>
            ) },
          ]}
        />
      )}

      <Modal open={Boolean(editing)} title="编辑用户资料" okText="保存" onCancel={() => setEditing(null)} confirmLoading={editMutation.isPending} onOk={() => editForm.submit()}>
        {editMutation.isError && <Alert showIcon type="error" title={errorMessage(editMutation.error)} />}
        <Form form={editForm} layout="vertical" onFinish={(values) => editMutation.mutate(values)}>
          <Form.Item label="显示名称" name="display_name"><Input maxLength={100} /></Form.Item>
          <Form.Item label="邮箱" name="email" rules={[{ type: "email", message: "请输入有效邮箱" }]}><Input maxLength={320} /></Form.Item>
        </Form>
      </Modal>

      <Modal open={Boolean(passwordTarget)} title="设置新的临时密码" okText="下一步" onCancel={() => setPasswordTarget(null)} onOk={() => passwordForm.submit()}>
        <Form form={passwordForm} layout="vertical" onFinish={({ new_password }) => {
          const target = passwordTarget;
          if (!target) return;
          setPasswordTarget(null);
          beginConfirmation("users:credentials:reset", "确认重置用户密码", async (token) => {
            await adminApi.resetUserPassword(target.id, new_password, token);
            message.success("密码已重置，用户现有会话已撤销");
          });
        }}>
          <Form.Item label="新密码" name="new_password" rules={[{ required: true }, { min: 6, max: 64, message: "密码必须为 6 至 64 个字符" }]}><Input.Password autoComplete="new-password" maxLength={64} /></Form.Item>
        </Form>
      </Modal>

      <Drawer open={Boolean(selected)} styles={{ wrapper: { width: 560 } }} title={selected ? `${selected.username} 的会话` : "用户会话"} onClose={() => setSelected(null)} extra={selected && canAccess(current, "users:sessions:revoke") ? <Button danger onClick={() => beginConfirmation("users:sessions:revoke", "撤销该用户全部会话", async (token) => { await adminApi.revokeUserSessions(selected.id, token); message.success("会话已撤销"); await sessions.refetch(); })}>撤销全部</Button> : null}>
        <QueryState loading={sessions.isLoading} error={sessions.isError ? errorMessage(sessions.error) : undefined} empty={sessions.data?.length === 0} onRetry={() => void sessions.refetch()} />
        {sessions.data?.map((session) => <div className="session-row" key={session.id}><Flex justify="space-between"><Typography.Text strong>{session.device_name || "未知设备"}</Typography.Text>{session.revoked_at ? <Tag>已撤销</Tag> : <Tag color="success">有效</Tag>}</Flex><Typography.Text type="secondary">{session.ip_masked || "未知地址"} · 最近活动 {formatTime(session.last_seen_at)}</Typography.Text></div>)}
      </Drawer>

      {confirmation && <ConfirmActionModal action={confirmation.action} open title={confirmation.title} onCancel={() => setConfirmation(null)} onConfirmed={confirmation.execute} />}
    </PageFrame>
  );
}
