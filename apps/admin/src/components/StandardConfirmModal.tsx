import { Alert, Flex, Modal } from "antd";

type Props = {
  description: string;
  loading: boolean;
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

export function StandardConfirmModal({ description, loading, open, title, onCancel, onConfirm }: Props) {
  return (
    <Modal
      cancelButtonProps={{ disabled: loading }}
      cancelText="取消"
      closable={!loading}
      confirmLoading={loading}
      destroyOnHidden
      maskClosable={!loading}
      okButtonProps={{ danger: true }}
      okText="确定"
      open={open}
      title={title}
      onCancel={onCancel}
      onOk={() => void onConfirm()}
    >
      <Flex vertical gap={12}>
        <Alert showIcon type="warning" title="请确认操作范围" description={description} />
        <p className="modal-copy">确认后将立即执行当前操作。</p>
      </Flex>
    </Modal>
  );
}
