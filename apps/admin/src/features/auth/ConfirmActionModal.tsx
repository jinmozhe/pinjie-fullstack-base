import type { ConfirmationAction } from "@pinjie/api-client";
import { useMutation } from "@tanstack/react-query";
import { Alert, Form, Input, Modal } from "antd";

import { adminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/http";

type Props = {
  action: ConfirmationAction;
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirmed: (token: string) => Promise<void>;
};

export function ConfirmActionModal({ action, open, title, onCancel, onConfirmed }: Props) {
  const [form] = Form.useForm<{ password: string }>();
  const confirmation = useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      const result = await adminApi.confirm(action, password);
      await onConfirmed(result.confirmation_token);
    },
    onSuccess: () => {
      form.resetFields();
      onCancel();
    },
  });

  return (
    <Modal
      destroyOnHidden
      okButtonProps={{ danger: true, loading: confirmation.isPending }}
      okText="确认执行"
      open={open}
      title={title}
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      <p className="modal-copy">这是高风险操作。请输入当前管理员密码完成一次性确认。</p>
      {confirmation.isError && <Alert showIcon type="error" message={errorMessage(confirmation.error)} />}
      <Form form={form} layout="vertical" onFinish={(values) => confirmation.mutate(values)}>
        <Form.Item label="当前密码" name="password" rules={[{ required: true, message: "请输入当前密码" }]}>
          <Input.Password autoComplete="current-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
