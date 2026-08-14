import { DashboardOutlined } from "@ant-design/icons";
import { Layout, Menu, Typography } from "antd";
import { Link, Navigate, Route, Routes } from "react-router";

import { SystemStatusPage } from "./features/system/SystemStatusPage";

const { Header, Sider, Content } = Layout;

export default function App() {
  return (
    <Layout className="admin-shell">
      <Sider breakpoint="lg" collapsedWidth="0" theme="light">
        <div className="brand-mark">Pinjie Base</div>
        <Menu
          mode="inline"
          selectedKeys={["system"]}
          items={[{ key: "system", icon: <DashboardOutlined />, label: <Link to="/system">System status</Link> }]}
        />
      </Sider>
      <Layout>
        <Header className="admin-header">
          <Typography.Text strong>Operations console</Typography.Text>
        </Header>
        <Content className="admin-content">
          <Routes>
            <Route path="/system" element={<SystemStatusPage />} />
            <Route path="*" element={<Navigate to="/system" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}
