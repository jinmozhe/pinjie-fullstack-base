import { LockOutlined, SafetyCertificateOutlined, UserOutlined } from "@ant-design/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Form, Input, Typography } from "antd";
import { useEffect } from "react";

import { adminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/http";
import { navigate } from "@/lib/navigation";

type LoginValues = { username: string; password: string };

export function LoginPage({ authenticated = false }: { authenticated?: boolean }) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (authenticated) navigate("/users");
  }, [authenticated]);
  const login = useMutation({
    mutationFn: (values: LoginValues) => adminApi.login(values),
    onSuccess: (session) => {
      queryClient.setQueryData(["admin-me"], session.principal);
      navigate("/users");
      if (process.env.NODE_ENV !== "test") window.location.reload();
    },
  });

  if (authenticated) {
    return null;
  }

  return (
    <main className="login-screen">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-panel__mark"><SafetyCertificateOutlined /></div>
        <Typography.Title id="login-title" level={1}>管理控制台</Typography.Title>
        <Typography.Paragraph type="secondary">使用管理员账号进入安全工作区</Typography.Paragraph>
        {login.isError && <Alert showIcon type="error" title={errorMessage(login.error)} />}
        <Form<LoginValues> layout="vertical" requiredMark={false} onFinish={(values) => login.mutate(values)}>
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: "请输入用户名" }]}>
            <Input autoComplete="username" prefix={<UserOutlined />} size="large" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }, { max: 64, message: "密码最多 64 个字符" }]}>
            <Input.Password autoComplete="current-password" maxLength={64} prefix={<LockOutlined />} size="large" />
          </Form.Item>
          <Button block htmlType="submit" loading={login.isPending} size="large" type="primary">登录</Button>
        </Form>
      </section>
    </main>
  );
}

export default LoginPage;
