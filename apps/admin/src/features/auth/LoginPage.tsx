import { LockOutlined, SafetyCertificateOutlined, UserOutlined } from "@ant-design/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Form, Input, Typography } from "antd";
import { Navigate, useNavigate } from "react-router";

import { adminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/http";

type LoginValues = { username: string; password: string };

export function LoginPage({ authenticated }: { authenticated: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const login = useMutation({
    mutationFn: (values: LoginValues) => adminApi.login(values),
    onSuccess: async (session) => {
      queryClient.setQueryData(["admin-me"], session.principal);
      await navigate("/users", { replace: true });
    },
  });

  if (authenticated) return <Navigate to="/users" replace />;

  return (
    <main className="login-screen">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-panel__mark"><SafetyCertificateOutlined /></div>
        <Typography.Title id="login-title" level={2}>管理控制台</Typography.Title>
        <Typography.Paragraph type="secondary">使用管理员账号进入安全工作区</Typography.Paragraph>
        {login.isError && <Alert showIcon type="error" message={errorMessage(login.error)} />}
        <Form<LoginValues> layout="vertical" requiredMark={false} onFinish={(values) => login.mutate(values)}>
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: "请输入用户名" }]}>
            <Input autoComplete="username" prefix={<UserOutlined />} size="large" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }]}>
            <Input.Password autoComplete="current-password" prefix={<LockOutlined />} size="large" />
          </Form.Item>
          <Button block htmlType="submit" loading={login.isPending} size="large" type="primary">登录</Button>
        </Form>
      </section>
    </main>
  );
}
