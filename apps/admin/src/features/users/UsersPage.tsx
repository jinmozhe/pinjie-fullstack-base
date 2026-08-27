import type { AdminUserRead } from "@pinjie/api-client";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  KeyOutlined,
  LaptopOutlined,
  PoweroffOutlined,
  StopOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { ProTable } from "@ant-design/pro-components";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Drawer, Flex, Form, Input, Modal, Pagination, Segmented, Space, Tag, Typography, message } from "antd";
import { useState } from "react";

import { PageFrame, QueryState, formatTime } from "@/components/PageFrame";
import { canAccess, useCurrentAdmin } from "@/features/auth";
import { adminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/http";

type UserLifecycle = "all" | "active" | "inactive" | "deleted";

function deletionReasonLabel(reason: string | null): string {
  if (reason === "admin_deleted") return "管理员删除";
  if (reason === "self_deleted") return "用户注销";
  return reason || "-";
}

function deletionActorLabel(actorType: string | null): string {
  if (actorType === "admin") return "管理员";
  if (actorType === "user") return "用户本人";
  if (actorType === "system") return "系统";
  return actorType || "-";
}

export function UsersPage() {
  const current = useCurrentAdmin();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [lifecycle, setLifecycle] = useState<UserLifecycle>("all");
  const [selected, setSelected] = useState<AdminUserRead | null>(null);
  const [sessionPage, setSessionPage] = useState(1);
  const [editing, setEditing] = useState<AdminUserRead | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<AdminUserRead | null>(null);
  const [deleteTargets, setDeleteTargets] = useState<string[] | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [editForm] = Form.useForm<{ display_name?: string; email?: string }>();
  const [passwordForm] = Form.useForm<{ new_password: string }>();
  const [deleteReasonForm] = Form.useForm<{ deletion_reason?: string }>();
  const users = useQuery({
    queryKey: ["admin-users", page, search, lifecycle],
    queryFn: () => adminApi.users({ page, search: search || undefined, lifecycle }),
  });
  const canUpdate = canAccess(current, "users:update");
  const canDelete = canAccess(current, "users:delete");
  const canRestore = canAccess(current, "users:restore");
  const sessions = useQuery({
    queryKey: ["admin-user-sessions", selected?.id, sessionPage],
    queryFn: () => adminApi.userSessions(selected!.id, sessionPage),
    enabled: Boolean(selected) && canAccess(current, "users:sessions:read"),
  });
  const invalidate = async () => queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  const editMutation = useMutation({
    mutationFn: (values: { display_name?: string; email?: string }) => adminApi.updateUser(editing!.id, values),
    onSuccess: async () => { message.success("用户资料已更新"); setEditing(null); await invalidate(); },
  });
  const batchStatusMutation = useMutation({
    mutationFn: ({ userIds, isActive }: { userIds: string[]; isActive: boolean }) =>
      adminApi.setUserStatusBulk({ user_ids: userIds, is_active: isActive }),
    onSuccess: async (result, { isActive }) => {
      message.success(`已批量${isActive ? "启用" : "停用"} ${result.completed_count} 名用户`);
      setSelectedRowKeys([]);
      await invalidate();
    },
  });
  const batchDeleteMutation = useMutation({
    mutationFn: ({ userIds, deletionReason }: { userIds: string[]; deletionReason?: string | null }) =>
      adminApi.deleteUsersBulk({ user_ids: userIds, deletion_reason: deletionReason ?? null }),
    onSuccess: async (result) => {
      message.success(`已将 ${result.completed_count} 名用户移入回收站`);
      setDeleteTargets(null);
      deleteReasonForm.resetFields();
      setSelectedRowKeys([]);
      await invalidate();
    },
  });
  const restoreMutation = useMutation({
    mutationFn: (userId: string) => adminApi.restoreUser(userId),
    onSuccess: async () => {
      message.success("用户已恢复，账户保持停用");
      await invalidate();
    },
  });
  const batchRestoreMutation = useMutation({
    mutationFn: (userIds: string[]) => adminApi.restoreUsersBulk({ user_ids: userIds }),
    onSuccess: async (result) => {
      message.success(`已恢复 ${result.completed_count} 名用户，账户保持停用`);
      setSelectedRowKeys([]);
      await invalidate();
    },
  });
  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
      adminApi.resetUserPassword(userId, newPassword),
    onSuccess: () => {
      message.success("密码已重置，用户现有会话已撤销");
      setPasswordTarget(null);
      passwordForm.resetFields();
    },
  });
  const revokeSessionsMutation = useMutation({
    mutationFn: (userId: string) => adminApi.revokeUserSessions(userId),
    onSuccess: async () => {
      message.success("会话已撤销");
      await sessions.refetch();
    },
  });
  const submitSearch = () => {
    setPage(1);
    setSelectedRowKeys([]);
    setSearch(searchDraft.trim());
  };
  const resetSearch = () => {
    setPage(1);
    setSelectedRowKeys([]);
    setSearch("");
    setSearchDraft("");
  };
  const beginBulkStatusChange = (isActive: boolean) => {
    const userIds = [...selectedRowKeys];
    void batchStatusMutation
      .mutateAsync({ userIds, isActive })
      .catch((error: unknown) => message.error(errorMessage(error)));
  };
  const beginBulkDelete = () => {
    setDeleteTargets([...selectedRowKeys]);
    deleteReasonForm.resetFields();
  };
  const beginBulkRestore = () => {
    const userIds = [...selectedRowKeys];
    void batchRestoreMutation.mutateAsync(userIds).catch((error: unknown) => message.error(errorMessage(error)));
  };

  return (
    <PageFrame title="用户管理" description="管理账户状态、回收站、基础资料、凭据与会话。">
      <QueryState loading={users.isLoading} error={users.isError ? errorMessage(users.error) : undefined} onRetry={() => void users.refetch()} />
      {users.data && (
        <ProTable<AdminUserRead>
          rowKey="id"
          headerTitle="用户列表"
          dataSource={users.data.items}
          search={false}
          options={{
            density: true,
            fullScreen: true,
            reload: () => void users.refetch(),
            setting: true,
          }}
          cardProps={false}
          rowSelection={
            (lifecycle === "deleted" ? canRestore : canUpdate || canDelete)
              ? {
                  selectedRowKeys,
                  onChange: (keys) => setSelectedRowKeys(keys.map(String)),
                  getCheckboxProps: (record) => ({
                    disabled: lifecycle === "deleted" && !record.can_restore,
                  }),
                }
              : false
          }
          tableAlertRender={({ selectedRowKeys: keys }) => <span>已选择 {keys.length} 项</span>}
          tableAlertOptionRender={({ onCleanSelected }) => lifecycle === "deleted" ? (
            <Space size={8} wrap={false}>
              <Button
                size="small"
                icon={<UndoOutlined />}
                loading={batchRestoreMutation.isPending}
                onClick={beginBulkRestore}
              >
                批量恢复
              </Button>
              <Button type="link" size="small" onClick={onCleanSelected}>取消选择</Button>
            </Space>
          ) : (
            <Space size={8} wrap={false}>
              {canUpdate && (
                <Button
                  size="small"
                  icon={<CheckCircleOutlined />}
                  disabled={batchStatusMutation.isPending || batchDeleteMutation.isPending}
                  loading={batchStatusMutation.isPending && batchStatusMutation.variables?.isActive}
                  onClick={() => beginBulkStatusChange(true)}
                >
                  批量启用
                </Button>
              )}
              {canUpdate && (
                <Button
                  size="small"
                  danger
                  icon={<StopOutlined />}
                  disabled={batchStatusMutation.isPending || batchDeleteMutation.isPending}
                  loading={batchStatusMutation.isPending && !batchStatusMutation.variables?.isActive}
                  onClick={() => beginBulkStatusChange(false)}
                >
                  批量停用
                </Button>
              )}
              {canDelete && (
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={batchStatusMutation.isPending || batchDeleteMutation.isPending}
                  loading={batchDeleteMutation.isPending}
                  onClick={beginBulkDelete}
                >
                  批量删除
                </Button>
              )}
              <Button type="link" size="small" onClick={onCleanSelected}>取消选择</Button>
            </Space>
          )}
          toolBarRender={() => [
            <Segmented<UserLifecycle>
              key="lifecycle"
              aria-label="用户生命周期"
              options={[
                { label: "全部", value: "all" },
                { label: "启用", value: "active" },
                { label: "停用", value: "inactive" },
                { label: "回收站", value: "deleted" },
              ]}
              value={lifecycle}
              onChange={(value) => {
                setLifecycle(value);
                setPage(1);
                setSelectedRowKeys([]);
              }}
            />,
            <Input.Search
              key="search"
              allowClear
              aria-label="搜索用户"
              placeholder="用户名、显示名称或邮箱"
              style={{ width: 240 }}
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              onSearch={submitSearch}
            />,
            <Button key="reset" onClick={resetSearch}>重置</Button>,
          ]}
          pagination={{
            current: page,
            pageSize: 20,
            total: users.data.total,
            showSizeChanger: false,
            onChange: (nextPage) => {
              setPage(nextPage);
              setSelectedRowKeys([]);
            },
          }}
          columns={[
            { title: "用户", dataIndex: "username", render: (_, row) => <div className="table-primary-cell"><Typography.Text strong>{row.display_name || row.username}</Typography.Text><Typography.Text type="secondary">{row.username}</Typography.Text></div> },
            { title: "邮箱", dataIndex: "email", responsive: ["lg"], render: (value) => value || "-" },
            { title: "状态", dataIndex: "is_active", width: 110, render: (value, row) => lifecycle === "deleted"
              ? row.can_restore ? <Tag color="warning">可恢复</Tag> : <Tag>不可恢复</Tag>
              : <Tag color={value ? "success" : "default"}>{value ? "正常" : "停用"}</Tag> },
            { title: "创建时间", dataIndex: "created_at", width: 170, responsive: ["xl"], render: (_, row) => formatTime(row.created_at) },
            ...(lifecycle === "deleted" ? [
              { title: "删除时间", dataIndex: "deleted_at", width: 170, render: (_: unknown, row: AdminUserRead) => formatTime(row.deleted_at) },
              { title: "删除主体", dataIndex: "deleted_by_type", width: 100, render: (_: unknown, row: AdminUserRead) => deletionActorLabel(row.deleted_by_type) },
              { title: "删除原因", dataIndex: "deletion_reason", width: 120, render: (_: unknown, row: AdminUserRead) => deletionReasonLabel(row.deletion_reason) },
            ] : []),
            { title: "操作", key: "actions", width: "1%", render: (_, row) => lifecycle === "deleted" ? (
              canRestore && (
                <Button
                  type="link"
                  size="small"
                  icon={<UndoOutlined />}
                  disabled={!row.can_restore}
                  loading={restoreMutation.isPending && restoreMutation.variables === row.id}
                  onClick={() => void restoreMutation.mutateAsync(row.id).catch((error: unknown) => message.error(errorMessage(error)))}
                >
                  恢复
                </Button>
              )
            ) : (
              <Space className="table-actions" size={[4, 0]} wrap={false}>
                {canUpdate && <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditing(row); editForm.setFieldsValue({ display_name: row.display_name ?? undefined, email: row.email ?? undefined }); }}>编辑</Button>}
                 {canUpdate && <Button type="link" size="small" icon={<PoweroffOutlined />} danger={row.is_active} onClick={() => {
                   void adminApi.setUserStatus(row.id, !row.is_active)
                     .then(async () => { message.success("账户状态已更新"); await invalidate(); })
                     .catch((error: unknown) => message.error(errorMessage(error)));
                 }}>{row.is_active ? "停用" : "启用"}</Button>}
                {canAccess(current, "users:sessions:read") && <Button type="link" size="small" icon={<LaptopOutlined />} onClick={() => { setSessionPage(1); setSelected(row); }}>会话</Button>}
                {canAccess(current, "users:credentials:reset") && <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => { setPasswordTarget(row); passwordForm.resetFields(); }}>重置密码</Button>}
                {canDelete && <Button type="link" size="small" danger icon={<DeleteOutlined />} loading={batchDeleteMutation.isPending && batchDeleteMutation.variables?.userIds.length === 1 && batchDeleteMutation.variables.userIds[0] === row.id} onClick={() => { setDeleteTargets([row.id]); deleteReasonForm.resetFields(); }}>删除</Button>}
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

      <Modal open={Boolean(passwordTarget)} title="设置新的临时密码" okText="确定" confirmLoading={resetPasswordMutation.isPending} onCancel={() => setPasswordTarget(null)} onOk={() => passwordForm.submit()}>
        {resetPasswordMutation.isError && <Alert showIcon type="error" title={errorMessage(resetPasswordMutation.error)} />}
        <Form form={passwordForm} layout="vertical" onFinish={({ new_password }) => {
           const target = passwordTarget;
           if (!target) return;
           resetPasswordMutation.mutate({ userId: target.id, newPassword: new_password });
         }}>
          <Form.Item label="新密码" name="new_password" rules={[{ required: true }, { min: 6, max: 64, message: "密码必须为 6 至 64 个字符" }]}><Input.Password autoComplete="new-password" maxLength={64} /></Form.Item>
        </Form>
      </Modal>

      <Modal
        open={Boolean(deleteTargets)}
        title="填写删除原因（可选）"
        okText="移入回收站"
        confirmLoading={batchDeleteMutation.isPending}
        onCancel={() => { setDeleteTargets(null); deleteReasonForm.resetFields(); }}
        onOk={() => deleteReasonForm.submit()}
      >
        <Form
          form={deleteReasonForm}
          layout="vertical"
          onFinish={({ deletion_reason }) => {
            const targets = deleteTargets;
            if (!targets) return;
            void batchDeleteMutation
              .mutateAsync({ userIds: targets, deletionReason: deletion_reason?.trim() || null })
              .catch((error: unknown) => message.error(errorMessage(error)));
          }}
        >
          <Form.Item label="删除原因" name="deletion_reason" extra="可留空，最多 100 个字符">
            <Input.TextArea maxLength={100} showCount autoFocus />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer open={Boolean(selected)} styles={{ wrapper: { width: 560 } }} title={selected ? `${selected.username} 的会话` : "用户会话"} onClose={() => { setSelected(null); setSessionPage(1); }} extra={selected && canAccess(current, "users:sessions:revoke") ? <Button danger loading={revokeSessionsMutation.isPending} onClick={() => revokeSessionsMutation.mutate(selected.id)}>撤销全部</Button> : null}>
        <QueryState loading={sessions.isLoading} error={sessions.isError ? errorMessage(sessions.error) : undefined} empty={sessions.data?.items.length === 0} onRetry={() => void sessions.refetch()} />
        {sessions.data?.items.map((session) => <div className="session-row" key={session.id}><Flex justify="space-between"><Typography.Text strong>{session.device_name || "未知设备"}</Typography.Text>{session.revoked_at ? <Tag>已撤销</Tag> : <Tag color="success">有效</Tag>}</Flex><Typography.Text type="secondary">{session.ip_masked || "未知地址"} · 最近活动 {formatTime(session.last_seen_at)}</Typography.Text></div>)}
        {sessions.data && sessions.data.total_pages > 1 && <Pagination current={sessionPage} pageSize={sessions.data.page_size} total={sessions.data.total} showSizeChanger={false} onChange={setSessionPage} />}
      </Drawer>

    </PageFrame>
  );
}

export default UsersPage;
