"use client";

import OrderForm from "@/components/OrderForm";
import WrapperContent from "@/components/WrapperContent";
import { useRouter } from "next/navigation";
import React from "react";

const CreateOrderPage: React.FC = () => {
  const router = useRouter();

  const handleSuccess = (orderId: string) => {
    router.push("/orders");
  };

  const handleCancel = () => {
    router.push("/orders");
  };

  return (
    <WrapperContent
      title="Tạo đơn hàng mới"
      header={{
        buttonBackTo: "/orders",
      }}
    >
      <OrderForm
        mode="create"
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </WrapperContent>
  );
};

export default CreateOrderPage;
