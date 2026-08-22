import { ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Descriptions, Space, Spin, Tag, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";

import { fetchSystemStatus } from "./api";

export function SystemStatusPage() {
  const query = useQuery({ queryKey: ["system-status"], queryFn: fetchSystemStatus });
  const available = query.data?.status === "available";

  return (
    <main>
      <Space orientation="vertical" size={24} style={{ width: "100%" }}>
        <div>
          <Typography.Title level={2}>系统状态</Typography.Title>
          <Typography.Paragraph type="secondary">查看通用应用基础设施的当前可用性。</Typography.Paragraph>
        </div>
        <Card
          title="后端可用性"
          extra={<Button aria-label="重新检查状态" icon={<ReloadOutlined />} onClick={() => query.refetch()} />}
        >
          {query.isPending ? <div role="status" aria-label="正在加载系统状态"><Spin /></div> : null}
          {query.isError ? (
            <Alert type="error" showIcon title="后端服务不可用" description="请在服务恢复后重试。" />
          ) : null}
          {query.isSuccess ? (
            <Descriptions column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="状态">
                <Tag color={available ? "success" : "error"}>{available ? "可用" : "不可用"}</Tag>
              </Descriptions.Item>
            </Descriptions>
          ) : null}
        </Card>
      </Space>
    </main>
  );
}

export default SystemStatusPage;
