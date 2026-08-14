import type { ConfirmationAction, RoleCreateIn, RoleRead } from "@pinjie/api-client";
import { DeleteOutlined, EditOutlined, PlusOutlined, SafetyOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Checkbox, Form, Input, Modal, Space, Table, Tag, Typography, message } from "antd";
import { useState } from "react";

import { PageFrame, QueryState, formatTime } from "@/components/PageFrame";
import { ConfirmActionModal, canAccess, useCurrentAdmin } from "@/features/auth";
import { adminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/http";

type RoleForm = RoleCreateIn;
type Confirmation = { action: ConfirmationAction; title: string; execute: (token: string) => Promise<void> };

export function RolesPage() {
  const current = useCurrentAdmin();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<RoleRead | "new" | null>(null);
  const [permissionTarget, setPermissionTarget] = useState<RoleRead | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [roleForm] = Form.useForm<RoleForm>();
  const [permissionForm] = Form.useForm<{ permission_codes: string[] }>();
  const roles = useQuery({ queryKey: ["roles"], queryFn: () => adminApi.roles() });
  const permissions = useQuery({ queryKey: ["permissions"], queryFn: adminApi.permissions });
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["roles"] }),
      queryClient.invalidateQueries({ queryKey: ["roles-options"] }),
    ]);
  };
  const saveRole = useMutation({
    mutationFn: (values: RoleForm) => editing === "new"
      ? adminApi.createRole(values)
      : adminApi.updateRole(editing!.id, { name: values.name, description: values.description, is_active: values.is_active }),
    onSuccess: async () => { message.success("角色已保存"); setEditing(null); await invalidate(); },
  });
  const begin = (action: ConfirmationAction, title: string, execute: (token: string) => Promise<void>) => setConfirmation({ action, title, execute });

  return (
    <PageFrame title="角色与权限" description="角色可维护，权限目录由源码定义并以只读方式呈现。" action={canAccess(current, "roles:create") ? <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing("new"); roleForm.resetFields(); roleForm.setFieldsValue({ is_active: true }); }}>新建角色</Button> : undefined}>
      <QueryState loading={roles.isLoading} error={roles.isError ? errorMessage(roles.error) : undefined} empty={roles.data?.items.length === 0} onRetry={() => void roles.refetch()} />
      {roles.data && roles.data.items.length > 0 && <Table<RoleRead>
        rowKey="id" dataSource={roles.data.items} scroll={{ x: 820 }} pagination={false}
        columns={[
          { title: "角色", dataIndex: "name", render: (_, row) => <><Typography.Text strong>{row.name}</Typography.Text><br /><Typography.Text code>{row.code}</Typography.Text></> },
          { title: "说明", dataIndex: "description", ellipsis: true, render: (value) => value || "-" },
          { title: "权限数", dataIndex: "permissions", width: 100, render: (items: string[]) => items.length },
          { title: "状态", dataIndex: "is_active", width: 90, render: (value) => <Tag color={value ? "success" : "default"}>{value ? "启用" : "停用"}</Tag> },
          { title: "更新时间", dataIndex: "updated_at", width: 170, render: formatTime },
          { title: "操作", fixed: "right", width: 250, render: (_, row) => <Space size="small">
            {canAccess(current, "roles:update") && <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(row); roleForm.setFieldsValue({ code: row.code, name: row.name, description: row.description, is_active: row.is_active }); }}>编辑</Button>}
            {canAccess(current, "roles:permissions:assign") && <Button size="small" icon={<SafetyOutlined />} onClick={() => { setPermissionTarget(row); permissionForm.setFieldsValue({ permission_codes: row.permissions }); }}>权限</Button>}
            {canAccess(current, "roles:delete") && <Button danger size="small" icon={<DeleteOutlined />} onClick={() => begin("roles:delete", "删除未使用角色", async (token) => { await adminApi.deleteRole(row.id, token); message.success("角色已删除"); await invalidate(); })}>删除</Button>}
          </Space> },
        ]}
      />}

      <Modal open={Boolean(editing)} title={editing === "new" ? "新建角色" : "编辑角色"} okText="保存" confirmLoading={saveRole.isPending} onCancel={() => setEditing(null)} onOk={() => roleForm.submit()}>
        {saveRole.isError && <Alert showIcon type="error" message={errorMessage(saveRole.error)} />}
        <Form<RoleForm> form={roleForm} layout="vertical" onFinish={(values) => saveRole.mutate(values)}>
          <Form.Item label="角色代码" name="code" rules={[{ required: true }, { pattern: /^[a-z][a-z0-9_-]{2,99}$/, message: "使用小写字母、数字、下划线或连字符" }]}><Input disabled={editing !== "new"} /></Form.Item>
          <Form.Item label="名称" name="name" rules={[{ required: true }]}><Input maxLength={100} /></Form.Item>
          <Form.Item label="说明" name="description"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="is_active" valuePropName="checked"><Checkbox>启用角色</Checkbox></Form.Item>
        </Form>
      </Modal>

      <Modal width={720} open={Boolean(permissionTarget)} title={permissionTarget ? `配置 ${permissionTarget.name} 的权限` : "配置权限"} okText="下一步" onCancel={() => setPermissionTarget(null)} onOk={() => permissionForm.submit()}>
        <QueryState loading={permissions.isLoading} error={permissions.isError ? errorMessage(permissions.error) : undefined} empty={permissions.data?.length === 0} onRetry={() => void permissions.refetch()} />
        <Form form={permissionForm} onFinish={({ permission_codes }) => { const target = permissionTarget; if (!target) return; setPermissionTarget(null); begin("roles:permissions:assign", "确认修改角色权限", async (token) => { await adminApi.assignPermissions(target.id, permission_codes, token); message.success("角色权限已更新，关联管理员会话已撤销"); await invalidate(); }); }}>
          <Form.Item name="permission_codes">
            <Checkbox.Group className="permission-grid" options={permissions.data?.map((permission) => ({ label: <span><strong>{permission.name}</strong><small>{permission.code}</small></span>, value: permission.code, disabled: !permission.is_active }))} />
          </Form.Item>
        </Form>
      </Modal>

      {confirmation && <ConfirmActionModal action={confirmation.action} open title={confirmation.title} onCancel={() => setConfirmation(null)} onConfirmed={confirmation.execute} />}
    </PageFrame>
  );
}
