"use client";

import {
  DiscountType,
  OrderStatus,
  type FirebaseOrderData,
  type FirebaseProductData,
  type FirebaseStaff,
  type ProductData,
} from "@/types/order";
import { App, Button, Modal, Space, Switch, Tag, Typography } from "antd";
import React, { useEffect, useState } from "react";
import { calculateOrderTotals } from "@/utils/calcultateOrderTotals"; // Assuming this utility exists
import { ProductCard } from "./OrderForm"; // Re-using ProductCard from OrderForm

const { Text } = Typography;

interface StatusUpdateModalProps {
  visible: boolean;
  order: (FirebaseOrderData & { id: string }) | null;
  currentStatus: OrderStatus;
  proposedNextStatus: OrderStatus | null;
  products: ProductData[];
  members: FirebaseStaff;
  workflows: any; // Assuming workflows are passed for ProductCard
  departments: any; // Assuming departments are passed for ProductCard
  onConfirm: (orderCode: string, newStatus: OrderStatus, isDepositPaid?: boolean, deposit?: number, depositType?: DiscountType) => void;
  onCancel: () => void;
}

const statusSequence = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.IN_PROGRESS,
  OrderStatus.ON_HOLD,
  OrderStatus.COMPLETED,
];

const statusOptions = [
  { value: "pending", label: "Chờ xử lý", color: "default" },
  { value: "confirmed", label: "Đã xác nhận", color: "warning" },
  { value: "in_progress", label: "Đang thực hiện", color: "processing" },
  { value: "on_hold", label: "Tạm dừng", color: "warning" },
  { value: "completed", label: "Hoàn thành", color: "success" },
  { value: "cancelled", label: "Đã hủy", color: "error" },
];

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  visible,
  order,
  currentStatus,
  proposedNextStatus,
  products,
  members,
  workflows,
  departments,
  onConfirm,
  onCancel,
}) => {
  const { message } = App.useApp();
  const [isDepositPaid, setIsDepositPaid] = useState(order?.isDepositPaid || false);
  const [deposit, setDeposit] = useState(order?.deposit || 0); // Raw deposit value
  const [depositType, setDepositType] = useState(order?.depositType || DiscountType.Percentage);

  useEffect(() => {
    if (order) {
      setIsDepositPaid(order.isDepositPaid || false);
      setDeposit(order.deposit || 0);
      setDepositType(order.depositType || DiscountType.Percentage);
    }
  }, [order]);

  const handleConfirmStatusChange = () => {
    if (!order || !proposedNextStatus) return;

    // --- VALIDATION LOGIC (mirroring OrderForm.tsx) ---

    // Validation before moving to CONFIRMED
    if (proposedNextStatus === OrderStatus.CONFIRMED) {
      if (products.some((p: ProductData) => p.images.length === 0)) {
        message.error(
          "Vui lòng tải lên ít nhất một ảnh cho mỗi sản phẩm trước khi xác nhận."
        );
        return;
      }
      if (!isDepositPaid) {
        message.error("Vui lòng xác nhận khách hàng đã đặt cọc.");
        return;
      }
    }

    // Validation before moving to COMPLETED (from ON_HOLD)
    if (
      proposedNextStatus === OrderStatus.COMPLETED &&
      currentStatus === OrderStatus.ON_HOLD
    ) {
      if (
        products.some(
          (p: ProductData) => !p.imagesDone || p.imagesDone.length === 0
        )
      ) {
        message.error(
          "Vui lòng tải lên ảnh sau khi hoàn thiện cho tất cả sản phẩm."
        );
        return;
      }
    }

    // All validations passed, proceed with confirmation
    onConfirm(order.id, proposedNextStatus, isDepositPaid, deposit, depositType);
  };

  const currentStatusInfo =
    statusOptions.find((opt) => opt.value === currentStatus) ||
    statusOptions[0];
  const proposedStatusInfo =
    statusOptions.find((opt) => opt.value === proposedNextStatus) ||
    statusOptions[0];

  const subtotal = products.reduce(
    (sum, product) => sum + product.quantity * product.price,
    0
  );
  const discountAmount =
    order && order.discountType === DiscountType.Percentage
      ? (subtotal * (order.discount || 0)) / 100
      : (order?.discount || 0);
  const totalAmount = subtotal - discountAmount + (order?.shippingFee || 0);

  const calculatedDepositAmount =
    depositType === DiscountType.Percentage
      ? (totalAmount * deposit) / 100
      : deposit;


  return (
    <Modal
      title="Xác nhận thay đổi trạng thái"
      open={visible}
      onCancel={onCancel}
      onOk={handleConfirmStatusChange}
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={false} // Adjust if there's async logic here
      width={600}
    >
      {order && proposedNextStatus && (
        <div className="space-y-4">
          <Text>
            Chuyển trạng thái đơn hàng{" "}
            <Text strong className="text-primary">
              #{order.code}
            </Text>{" "}
            từ{" "}
            <Tag color={currentStatusInfo.color}>
              {currentStatusInfo.label}
            </Tag>{" "}
            sang{" "}
            <Tag color={proposedStatusInfo.color}>
              {proposedStatusInfo.label}
            </Tag>
            .
          </Text>

          {/* Conditional UI for Deposit Paid */}
          {proposedNextStatus === OrderStatus.CONFIRMED && (
            <div className="p-4 border border-dashed border-blue-300 rounded-lg bg-blue-50">
              <Space direction="vertical" className="w-full">
                <Text strong>Xác nhận thông tin đặt cọc:</Text>
                <div className="flex items-center gap-2">
                  <Text>Khách hàng đã thanh toán tiền cọc:</Text>
                  <Switch
                    checked={isDepositPaid}
                    onChange={setIsDepositPaid}
                    checkedChildren="Đã cọc"
                    unCheckedChildren="Chưa cọc"
                  />
                </div>
                <Text type="secondary" className="text-sm">
                  Số tiền cọc hiển thị: {calculatedDepositAmount.toLocaleString("vi-VN")} VNĐ
                </Text>
              </Space>
            </div>
          )}

          {/* Conditional UI for Images Done */}
          {(proposedNextStatus === OrderStatus.COMPLETED && currentStatus === OrderStatus.ON_HOLD) && (
            <div className="p-4 border border-dashed border-green-300 rounded-lg bg-green-50">
                <Text strong>Kiểm tra ảnh sản phẩm sau hoàn thiện:</Text>
                {products.length > 0 ? (
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        {products.map(p => (
                            <li key={p.id}>
                                <Text>{p.name}: {p.imagesDone && p.imagesDone.length > 0 ? "✅ Đã tải ảnh" : "❌ Chưa tải ảnh"}</Text>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <Text type="secondary">Không có sản phẩm nào trong đơn hàng.</Text>
                )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
