import type { RoleCreateIn, RoleRead } from "@pinjie/api-client";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SafetyOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { ProTable } from "@ant-design/pro-components";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Checkbox, Form, Input, Modal, Space, Tag, Typography, message } from "antd";
import { useState } from "react";

import { PageFrame, QueryState, formatTime } from "@/components/PageFrame";
import { StandardConfirmModal } from "@/components/StandardConfirmModal";
import { canAccess, useCurrentAdmin } from "@/features/auth";
import { adminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/http";

type RoleForm = RoleCreateIn;
type Confirmation = { description: string; title: string; execute: () => Promise<unknown> };

export function RolesPage() {
  const current = useCurrentAdmin();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<RoleRead | "new" | null>(null);
  const [permissionTarget, setPermissionTarget] = useState<RoleRead | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [roleForm] = Form.useForm<RoleForm>();
  const [permissionForm] = Form.useForm<{ permission_codes: string[] }>();
  const roles = useQuery({ queryKey: ["roles"], queryFn: () => adminApi.roles() });
  const canReadPermissions = canAccess(current, "permissions:read");
  const canUpdate = canAccess(current, "roles:update");
  const canDelete = canAccess(current, "roles:delete");
  const canAssignPermissions = canAccess(current, "roles:permissions:assign") && canReadPermissions;
  const permissions = useQuery({ queryKey: ["permissions"], queryFn: adminApi.permissions, enabled: canReadPermissions });
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
  const batchStatusMutation = useMutation({
    mutationFn: ({ roleIds, isActive }: { roleIds: string[]; isActive: boolean }) =>
      adminApi.setRoleStatusBulk({ role_ids: roleIds, is_active: isActive }),
    onSuccess: async (result, { isActive }) => {
      message.success(`已批量${isActive ? "启用" : "停用"} ${result.completed_count} 个角色`);
      setSelectedRowKeys([]);
      await invalidate();
    },
  });
  const batchDeleteMutation = useMutation({
    mutationFn: (roleIds: string[]) => adminApi.deleteRolesBulk({ role_ids: roleIds }),
    onSuccess: async (result) => {
      message.success(`已批量删除 ${result.completed_count} 个角色`);
      setSelectedRowKeys([]);
      await invalidate();
    },
  });
  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => adminApi.deleteRole(roleId),
    onSuccess: async () => {
      message.success("角色已删除");
      await invalidate();
    },
  });
  const assignPermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissionCodes }: { roleId: string; permissionCodes: string[] }) =>
      adminApi.assignPermissions(roleId, permissionCodes),
    onSuccess: async () => {
      message.success("角色权限已更新，关联管理员会话已撤销");
      setPermissionTarget(null);
      await invalidate();
    },
  });
  const begin = (title: string, description: string, execute: () => Promise<unknown>) =>
    setConfirmation({ title, description, execute });
  const beginBulkStatusChange = (isActive: boolean) => {
    const roleIds = [...selectedRowKeys];
    void batchStatusMutation
      .mutateAsync({ roleIds, isActive })
      .catch((error: unknown) => message.error(errorMessage(error)));
  };
  const beginBulkDelete = () => {
    const roleIds = [...selectedRowKeys];
    begin(
      `确认批量删除 ${roleIds.length} 个角色`,
      "只有未分配给管理员的角色可以删除。确认后角色及其权限关联将被永久删除。",
      () => batchDeleteMutation.mutateAsync(roleIds),
    );
  };
  const confirmAction = async () => {
    if (!confirmation) return;
    try {
      await confirmation.execute();
      setConfirmation(null);
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  return (
    <PageFrame title="角色与权限" description="角色可维护，权限目录由源码定义并以只读方式呈现。">
      <QueryState loading={roles.isLoading} error={roles.isError ? errorMessage(roles.error) : undefined} onRetry={() => void roles.refetch()} />
      {roles.data && (
        <ProTable<RoleRead>
          rowKey="id"
          dataSource={roles.data.items}
          search={false}
          options={{
            density: true,
            fullScreen: true,
            reload: () => void roles.refetch(),
            setting: true,
          }}
          cardProps={false}
          headerTitle="角色列表"
          toolBarRender={() => [
            canAccess(current, "roles:create") ? (
              <Button
                key="create"
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditing("new");
                  roleForm.resetFields();
                  roleForm.setFieldsValue({ is_active: true });
                }}
              >
                新建角色
              </Button>
            ) : null,
          ]}
          rowSelection={
            canUpdate || canDelete
              ? {
                  selectedRowKeys,
                  onChange: (keys) => setSelectedRowKeys(keys.map(String)),
                }
              : false
          }
          tableAlertRender={({ selectedRowKeys: keys }) => <span>已选择 {keys.length} 项</span>}
          tableAlertOptionRender={({ onCleanSelected }) => (
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
              <Button type="link" size="small" onClick={onCleanSelected}>
                取消选择
              </Button>
            </Space>
          )}
          pagination={false}
          columns={[
            { title: "角色", dataIndex: "name", render: (_, row) => <div className="table-primary-cell"><Typography.Text strong>{row.name}</Typography.Text><Typography.Text code>{row.code}</Typography.Text></div> },
            { title: "说明", dataIndex: "description", ellipsis: true, responsive: ["lg"], render: (value) => value || "-" },
            { title: "权限数", dataIndex: "permissions", width: 100, render: (_, row) => row.permissions.length },
            { title: "状态", dataIndex: "is_active", width: 90, render: (value) => <Tag color={value ? "success" : "default"}>{value ? "启用" : "停用"}</Tag> },
            { title: "更新时间", dataIndex: "updated_at", width: 170, responsive: ["xl"], render: (_, row) => formatTime(row.updated_at) },
            { title: "操作", width: 220, render: (_, row) => (
              <Space className="table-actions" size={[2, 0]} wrap>
                {canUpdate && <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditing(row); roleForm.setFieldsValue({ code: row.code, name: row.name, description: row.description, is_active: row.is_active }); }}>编辑</Button>}
                {canAssignPermissions && <Button type="link" size="small" icon={<SafetyOutlined />} onClick={() => { setPermissionTarget(row); permissionForm.setFieldsValue({ permission_codes: row.permissions }); }}>权限</Button>}
                {canDelete && <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => begin("删除未使用角色", "确认后该角色及其权限关联将被永久删除，删除后无法恢复。", () => deleteRoleMutation.mutateAsync(row.id))}>删除</Button>}
              </Space>
            ) },
          ]}
        />
      )}

      <Modal open={Boolean(editing)} title={editing === "new" ? "新建角色" : "编辑角色"} okText="保存" confirmLoading={saveRole.isPending} onCancel={() => setEditing(null)} onOk={() => roleForm.submit()}>
        {saveRole.isError && <Alert showIcon type="error" title={errorMessage(saveRole.error)} />}
        <Form<RoleForm> form={roleForm} layout="vertical" onFinish={(values) => saveRole.mutate(values)}>
          <Form.Item label="角色代码" name="code" rules={[{ required: true }, { pattern: /^[a-z][a-z0-9_-]{2,99}$/, message: "使用小写字母、数字、下划线或连字符" }]}><Input disabled={editing !== "new"} /></Form.Item>
          <Form.Item label="名称" name="name" rules={[{ required: true }]}><Input maxLength={100} /></Form.Item>
          <Form.Item label="说明" name="description"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="is_active" valuePropName="checked"><Checkbox>启用角色</Checkbox></Form.Item>
        </Form>
      </Modal>

      <Modal width={720} open={Boolean(permissionTarget)} title={permissionTarget ? `配置 ${permissionTarget.name} 的权限` : "配置权限"} okText="保存" confirmLoading={assignPermissionsMutation.isPending} onCancel={() => setPermissionTarget(null)} onOk={() => permissionForm.submit()}>
        <QueryState loading={permissions.isLoading} error={permissions.isError ? errorMessage(permissions.error) : undefined} empty={permissions.data?.length === 0} onRetry={() => void permissions.refetch()} />
        {assignPermissionsMutation.isError && <Alert showIcon type="error" title={errorMessage(assignPermissionsMutation.error)} />}
        <Form form={permissionForm} onFinish={({ permission_codes }) => { const target = permissionTarget; if (!target) return; assignPermissionsMutation.mutate({ roleId: target.id, permissionCodes: permission_codes }); }}>
          <Form.Item name="permission_codes">
            <Checkbox.Group className="permission-grid" options={permissions.data?.map((permission) => ({ label: <span><strong>{permission.name}</strong><small>{permission.code}</small></span>, value: permission.code, disabled: !permission.is_active }))} />
          </Form.Item>
        </Form>
      </Modal>

      <StandardConfirmModal
        description={confirmation?.description ?? ""}
        loading={batchDeleteMutation.isPending || deleteRoleMutation.isPending}
        open={Boolean(confirmation)}
        title={confirmation?.title ?? "确认操作"}
        onCancel={() => setConfirmation(null)}
        onConfirm={confirmAction}
      />
    </PageFrame>
  );
}

export default RolesPage;
