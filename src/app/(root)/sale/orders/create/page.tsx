"use client";

import OrderForm from "@/components/OrderForm";
import WrapperContent from "@/components/WrapperContent";
import { ReloadOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import React from "react";

interface ChildHandle {
  onResetForm: () => void;
}
const CreateOrderModal: React.FC = () => {
  const router = useRouter();

  const ref = React.useRef<ChildHandle>(null);

  const handleSuccess = (orderCode: string) => {
    // Alternative 1: Use replace to avoid adding to history
    router.replace(`/sale/orders/${orderCode}`);
    // Optional: Show success message or redirect
  };

  const handleCancel = () => {
    // Alternative 1: Use replace to avoid adding to history
    router.replace(`/sale/orders`);
  };

  return (
    <WrapperContent
      title="Tạo đơn hàng mới"
      header={{
        buttonBackTo: `/sale/orders`,
        buttonEnds: [
          {
            can: true,
            type: "dashed",
            name: "Đặt lại",
            icon: <ReloadOutlined />,
            onClick: () => {
              ref.current?.onResetForm();
            },
          },
        ],
      }}
    >
      <OrderForm
        ref={ref}
        mode="create"
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </WrapperContent>
  );
};

export default CreateOrderModal;
