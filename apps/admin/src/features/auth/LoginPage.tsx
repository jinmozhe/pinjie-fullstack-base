import {
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Form, Input, Modal } from "antd";
import { useEffect, useState } from "react";

import { adminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/http";
import { navigate } from "@/lib/navigation";

type LoginValues = { username: string; password: string };

export function LoginPage({ authenticated = false }: { authenticated?: boolean }) {
  const queryClient = useQueryClient();
  const [recoveryOpen, setRecoveryOpen] = useState(false);

  useEffect(() => {
    if (authenticated) navigate("/welcome");
  }, [authenticated]);

  const login = useMutation({
    mutationFn: (values: LoginValues) => adminApi.login(values),
    onSuccess: (session) => {
      queryClient.setQueryData(["admin-me"], session.principal);
      navigate("/welcome");
      if (process.env.NODE_ENV !== "test") window.location.reload();
    },
  });

  if (authenticated) {
    return null;
  }

  return (
    <main className="login-screen">
      <section className="login-content" aria-labelledby="login-title">
        <div className="login-shell">
          <header className="login-top">
            <div className="login-header">
              <span className="login-header__logo" aria-hidden="true">
                <span>PJ</span>
              </span>
              <h1 className="login-header__title" id="login-title">
                品捷管理系统
              </h1>
            </div>
            <p className="login-desc">品捷全栈企业级统一管理控制台</p>
          </header>

          <div className="login-main">
            {login.isError && (
              <Alert
                className="login-alert"
                message={errorMessage(login.error)}
                showIcon
                type="error"
              />
            )}
            <Form<LoginValues>
              layout="vertical"
              onFinish={(values) => login.mutate(values)}
              requiredMark={false}
            >
              <Form.Item
                aria-label="用户名"
                name="username"
                rules={[{ required: true, message: "请输入用户名" }]}
              >
                <Input
                  allowClear
                  aria-label="用户名"
                  autoComplete="username"
                  placeholder="管理员用户名"
                  prefix={<UserOutlined className="login-prefix-icon" />}
                  size="large"
                />
              </Form.Item>
              <Form.Item
                aria-label="密码"
                name="password"
                rules={[
                  { required: true, message: "请输入密码" },
                  { max: 64, message: "密码最多 64 个字符" },
                ]}
              >
                <Input.Password
                  aria-label="密码"
                  autoComplete="current-password"
                  maxLength={64}
                  placeholder="登录密码"
                  prefix={<LockOutlined className="login-prefix-icon" />}
                  size="large"
                />
              </Form.Item>
              <div className="login-other-actions">
                <span className="login-session-note">
                  <SafetyCertificateOutlined />
                  安全会话自动保持
                </span>
                <Button className="login-forgot-link" type="link" onClick={() => setRecoveryOpen(true)}>
                  忘记密码？
                </Button>
              </div>
              <Button
                block
                className="login-submit-btn"
                htmlType="submit"
                loading={login.isPending}
                size="large"
                type="primary"
              >
                登录
              </Button>
            </Form>
          </div>
        </div>
      </section>
      <footer className="login-footer">
        <div className="login-footer__copyright">品捷管理系统 © 2026</div>
      </footer>
      <Modal
        centered
        footer={
          <Button type="primary" onClick={() => setRecoveryOpen(false)}>
            我知道了
          </Button>
        }
        open={recoveryOpen}
        title="忘记密码"
        onCancel={() => setRecoveryOpen(false)}
      >
        <p className="login-recovery-copy">
          请联系系统管理员为你重置密码。为保护管理端安全，登录页不会收集邮箱、手机号码或新密码。
        </p>
      </Modal>
    </main>
  );
}

export default LoginPage;
