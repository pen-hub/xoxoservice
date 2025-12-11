"use client";

import OrderForm from "@/components/OrderForm";
import WrapperContent from "@/components/WrapperContent";
import { useRouter } from "next/navigation";
import React from "react";

interface UpdateOrderPageProps {
  params: Promise<{
    code: string;
  }>;
}

const UpdateOrderPage: React.FC<UpdateOrderPageProps> = ({ params }) => {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const orderCode = resolvedParams.code;

  const handleSuccess = (updatedorderCode: string) => {
    router.push(`/sale/orders/${updatedorderCode}`);
  };

  const handleCancel = () => {
    router.push("/sale/orders");
  };



  return (
    <WrapperContent
    isEmpty={!orderCode}
      title="Cập nhật đơn hàng"
      header={{
        buttonBackTo: `/sale/orders/${orderCode}`,
      }}
    >
      <OrderForm
        mode="update"
        orderCode={orderCode}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </WrapperContent>
  );
};

export default UpdateOrderPage;
