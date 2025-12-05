"use client";

import OrderForm from "@/components/OrderForm";
import WrapperContent from "@/components/WrapperContent";
import { useRouter } from "next/navigation";
import React from "react";

interface UpdateOrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

const UpdateOrderPage: React.FC<UpdateOrderPageProps> = ({ params }) => {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const orderId = resolvedParams.id;

  const handleSuccess = (updatedOrderId: string) => {
    router.push("/orders");
  };

  const handleCancel = () => {
    router.push("/orders");
  };

  if (!orderId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500">ID đơn hàng không hợp lệ! {orderId}</p>
        </div>
      </div>
    );
  }

  return (
    <WrapperContent
      title="Cập nhật đơn hàng"
      header={{
        buttonBackTo: "/orders",
      }}
    >
      <OrderForm
        mode="update"
        orderId={orderId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </WrapperContent>
  );
};

export default UpdateOrderPage;
