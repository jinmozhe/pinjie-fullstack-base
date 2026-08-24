import { ReloadOutlined } from "@ant-design/icons";
import { ProDescriptions } from "@ant-design/pro-components";
import { Alert, Button, Spin, Tag } from "antd";
import { useQuery } from "@tanstack/react-query";

import { PageFrame } from "@/components/PageFrame";

import { fetchSystemStatus } from "./api";

export function SystemStatusPage() {
  const query = useQuery({ queryKey: ["system-status"], queryFn: fetchSystemStatus });
  const available = query.data?.status === "available";

  return (
    <PageFrame
      title="系统状态"
      description="查看通用应用基础设施的当前可用性。"
      action={<Button aria-label="重新检查状态" icon={<ReloadOutlined />} onClick={() => query.refetch()}>重新检查</Button>}
    >
      {query.isPending ? <div className="center-state" role="status" aria-label="正在加载系统状态"><Spin /></div> : null}
      {query.isError ? (
        <Alert type="error" showIcon title="后端服务不可用" description="请在服务恢复后重试。" />
      ) : null}
      {query.isSuccess ? (
        <ProDescriptions
          title="后端可用性"
          column={{ xs: 1, sm: 2 }}
          bordered
          dataSource={{ status: query.data.status }}
          columns={[{
            title: "状态",
            dataIndex: "status",
            render: () => <Tag color={available ? "success" : "error"}>{available ? "可用" : "不可用"}</Tag>,
          }]}
        />
      ) : null}
    </PageFrame>
  );
}

export default SystemStatusPage;
