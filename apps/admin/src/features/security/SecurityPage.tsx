import type { AuditEventRead, LoginEventRead, RequestLogRead } from "@pinjie/api-client";
import { useQuery } from "@tanstack/react-query";
import { Alert, Table, Tabs, Tag, Typography } from "antd";

import { PageFrame, QueryState, formatTime } from "@/components/PageFrame";
import { adminApi } from "@/lib/api/admin";
import { ApiError, errorMessage } from "@/lib/api/http";

function LoginEvents() {
  const query = useQuery({ queryKey: ["login-events"], queryFn: () => adminApi.loginEvents() });
  return <><QueryState loading={query.isLoading} error={query.isError ? errorMessage(query.error) : undefined} empty={query.data?.items.length === 0} onRetry={() => void query.refetch()} />{query.data && <Table<LoginEventRead> rowKey="id" dataSource={query.data.items} pagination={false} scroll={{ x: 900 }} columns={[
    { title: "时间", dataIndex: "occurred_at", width: 170, render: formatTime },
    { title: "主体", dataIndex: "principal_type", width: 90 },
    { title: "事件", dataIndex: "event_type", width: 120 },
    { title: "结果", dataIndex: "succeeded", width: 90, render: (value) => <Tag color={value ? "success" : "error"}>{value ? "成功" : "拒绝"}</Tag> },
    { title: "原因", dataIndex: "reason_code", width: 180 },
    { title: "来源", dataIndex: "ip_address", width: 140, render: (value) => value || "-" },
    { title: "Request ID", dataIndex: "request_id", render: (value) => <Typography.Text code copyable>{value}</Typography.Text> },
  ]} />}</>;
}
function AuditEvents() {
  const query = useQuery({ queryKey: ["audit-events"], queryFn: () => adminApi.auditEvents() });
  return <><QueryState loading={query.isLoading} error={query.isError ? errorMessage(query.error) : undefined} empty={query.data?.items.length === 0} onRetry={() => void query.refetch()} />{query.data && <Table<AuditEventRead> rowKey="id" dataSource={query.data.items} pagination={false} scroll={{ x: 980 }} columns={[
    { title: "时间", dataIndex: "occurred_at", width: 170, render: formatTime },
    { title: "动作", dataIndex: "action", width: 220 },
    { title: "目标", key: "target", width: 220, render: (_, row) => `${row.target_type}:${row.target_id || "-"}` },
    { title: "结果", dataIndex: "result", width: 100, render: (value) => <Tag color={value === "succeeded" ? "success" : value === "started" ? "processing" : "error"}>{value}</Tag> },
    { title: "Request ID", dataIndex: "request_id", render: (value) => <Typography.Text code copyable>{value}</Typography.Text> },
  ]} />}</>;
}

function RequestLogs() {
  const query = useQuery({ queryKey: ["request-logs"], queryFn: () => adminApi.requestLogs(), retry: false });
  if (query.error instanceof ApiError && query.error.status === 409) return <Alert showIcon type="info" title="请求元数据日志当前未启用" description="生产需要时将 REQUEST_LOG_MODE 设置为 metadata，并运行独立消费者。" />;
  return <><QueryState loading={query.isLoading} error={query.isError ? errorMessage(query.error) : undefined} empty={query.data?.items.length === 0} onRetry={() => void query.refetch()} />{query.data && <Table<RequestLogRead> rowKey="id" dataSource={query.data.items} pagination={false} scroll={{ x: 980 }} columns={[
    { title: "时间", dataIndex: "occurred_at", width: 170, render: formatTime },
    { title: "方法", dataIndex: "method", width: 80 },
    { title: "路由模板", dataIndex: "route_template", width: 280 },
    { title: "状态", dataIndex: "status_code", width: 90, render: (value) => <Tag color={value < 400 ? "success" : "error"}>{value}</Tag> },
    { title: "耗时", dataIndex: "duration_ms", width: 100, render: (value) => `${value} ms` },
    { title: "Request ID", dataIndex: "request_id", render: (value) => <Typography.Text code copyable>{value}</Typography.Text> },
  ]} />}</>;
}

export function SecurityPage() {
  return <PageFrame title="安全日志" description="登录事件与审计事件是安全事实，请求元数据仅用于可选观测。"><Tabs items={[
    { key: "login", label: "登录事件", children: <LoginEvents /> },
    { key: "audit", label: "审计事件", children: <AuditEvents /> },
    { key: "request", label: "请求元数据", children: <RequestLogs /> },
  ]} /></PageFrame>;
}
