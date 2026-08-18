import { ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Descriptions, Space, Spin, Tag, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";

import { fetchSystemStatus } from "./api";

export function SystemStatusPage() {
  const query = useQuery({ queryKey: ["system-status"], queryFn: fetchSystemStatus });
  const available = query.data?.status === "available";

  return (
    <main>
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        <div>
          <Typography.Title level={2}>System status</Typography.Title>
          <Typography.Paragraph type="secondary">
            Current availability of the shared application foundation.
          </Typography.Paragraph>
        </div>
        <Card
          title="Backend availability"
          extra={<Button aria-label="Retry status" icon={<ReloadOutlined />} onClick={() => query.refetch()} />}
        >
          {query.isPending ? <div role="status" aria-label="Loading system status"><Spin /></div> : null}
          {query.isError ? (
            <Alert type="error" showIcon message="后端服务不可用" description="请在服务恢复后重试。" />
          ) : null}
          {query.isSuccess ? (
            <Descriptions column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Status">
                <Tag color={available ? "success" : "error"}>{available ? "Available" : "Unavailable"}</Tag>
              </Descriptions.Item>
            </Descriptions>
          ) : null}
        </Card>
      </Space>
    </main>
  );
}
