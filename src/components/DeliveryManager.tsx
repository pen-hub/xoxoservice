"use client";

import { useUser } from "@/firebase/provider";
import { AppointmentService } from "@/services/appointmentService";
import { MessageService } from "@/services/messageService";
import { AppointmentStatus } from "@/types/appointment";
import {
  DeliveryInfo,
  DeliveryMethod,
  type FirebaseOrderData,
} from "@/types/order";
import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  Radio,
  Space,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { ref as dbRef, getDatabase, update } from "firebase/database";
import { useEffect, useState } from "react";

const { TextArea } = Input;
const { Text } = Typography;

// Helper function to remove undefined values
function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}

interface DeliveryManagerProps {
  orderCode: string;
  order: FirebaseOrderData;
  onSuccess?: () => void;
}

export default function DeliveryManager({
  orderCode,
  order,
  onSuccess,
}: DeliveryManagerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const { user } = useUser();

  useEffect(() => {
    if (order.deliveryInfo) {
      form.setFieldsValue({
        method: order.deliveryInfo.method,
        shippingAddress: order.deliveryInfo.shippingAddress,
        trackingNumber: order.deliveryInfo.trackingNumber,
        estimatedDate: order.deliveryInfo.estimatedDate
          ? dayjs(order.deliveryInfo.estimatedDate)
          : null,
        storageLocation: order.deliveryInfo.storageLocation,
      });
    }
  }, [order.deliveryInfo, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const deliveryInfo: DeliveryInfo = {
        method: values.method,
        shippingAddress: values.shippingAddress,
        trackingNumber: values.trackingNumber,
        estimatedDate: values.estimatedDate?.valueOf(),
        status:
          values.method === DeliveryMethod.STORE
            ? "stored"
            : values.method === DeliveryMethod.PICKUP
            ? "pending"
            : "pending",
        storageLocation: values.storageLocation,
        storageInstructionsSent: false,
      };

      const orderRef = dbRef(getDatabase(), `xoxo/orders/${orderCode}`);

      // If method is PICKUP and estimatedDate is set, create appointment
      let appointmentId: string | undefined;
      if (
        deliveryInfo.method === DeliveryMethod.PICKUP &&
        deliveryInfo.estimatedDate
      ) {
        try {
          const appointment = await AppointmentService.create({
            customerName: order.customerName,
            customerPhone: order.phone,
            customerId: order.customerCode,
            orderId: orderCode,
            orderCode: orderCode,
            scheduledDate: deliveryInfo.estimatedDate,
            duration: 30, // Default 30 minutes for pickup
            purpose: "Khách hàng đến lấy hàng",
            status: AppointmentStatus.SCHEDULED,
            createdBy: user?.uid,
            createdByName:
              user?.displayName || user?.email || "Người dùng hiện tại",
          });
          appointmentId = appointment.id;
          message.success("Đã tự động tạo lịch hẹn cho khách hàng!");
        } catch (appointmentError) {
          console.error("Failed to create appointment:", appointmentError);
          // Don't block delivery info update if appointment creation fails
        }
      }

      await update(
        orderRef,
        removeUndefined({
          deliveryInfo: removeUndefined(deliveryInfo),
          appointmentId: appointmentId,
          updatedAt: new Date().getTime(),
        })
      );

      // Send storage instructions if method is STORE
      if (
        deliveryInfo.method === DeliveryMethod.STORE &&
        deliveryInfo.storageLocation
      ) {
        try {
          // Schedule message to be sent after 60 minutes
          setTimeout(async () => {
            await MessageService.sendStorageInstructions(
              order.phone,
              order.customerName,
              deliveryInfo.storageLocation!,
              orderCode
            );
          }, 60 * 60 * 1000); // 60 minutes
        } catch (msgError) {
          console.error("Failed to schedule storage instructions:", msgError);
        }
      }

      message.success("Cập nhật thông tin giao hàng thành công!");
      onSuccess?.();
    } catch (error) {
      console.error("Error updating delivery info:", error);
      message.error("Có lỗi xảy ra khi cập nhật thông tin giao hàng!");
    } finally {
      setLoading(false);
    }
  };

  const deliveryMethodOptions = [
    { label: "Gửi ship", value: DeliveryMethod.SHIP },
    { label: "Khách qua lấy", value: DeliveryMethod.PICKUP },
    { label: "Lưu kho", value: DeliveryMethod.STORE },
  ];

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item
        label="Phương thức giao hàng"
        name="method"
        rules={[
          { required: true, message: "Vui lòng chọn phương thức giao hàng!" },
        ]}
      >
        <Radio.Group options={deliveryMethodOptions} />
      </Form.Item>

      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) =>
          prevValues.method !== currentValues.method
        }
      >
        {({ getFieldValue }) => {
          const method = getFieldValue("method");
          return (
            <>
              {method === DeliveryMethod.SHIP && (
                <>
                  <Form.Item
                    label="Địa chỉ giao hàng"
                    name="shippingAddress"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập địa chỉ giao hàng!",
                      },
                    ]}
                  >
                    <TextArea
                      rows={3}
                      placeholder="Nhập địa chỉ giao hàng"
                      defaultValue={order.address}
                    />
                  </Form.Item>
                  <Form.Item label="Mã vận đơn" name="trackingNumber">
                    <Input placeholder="Nhập mã vận đơn (tùy chọn)" />
                  </Form.Item>
                  <Form.Item label="Ngày giao dự kiến" name="estimatedDate">
                    <DatePicker
                      className="w-full"
                      format="DD/MM/YYYY"
                      placeholder="Chọn ngày giao dự kiến"
                    />
                  </Form.Item>
                </>
              )}

              {method === DeliveryMethod.PICKUP && (
                <Form.Item
                  label="Ngày khách đến lấy dự kiến"
                  name="estimatedDate"
                >
                  <DatePicker
                    className="w-full"
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày khách đến lấy"
                  />
                </Form.Item>
              )}

              {method === DeliveryMethod.STORE && (
                <>
                  <Form.Item
                    label="Vị trí lưu kho"
                    name="storageLocation"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập vị trí lưu kho!",
                      },
                    ]}
                  >
                    <Input placeholder="VD: Tủ A, Kệ 3, Hộp 5" />
                  </Form.Item>
                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <Text className="text-sm text-blue-700">
                      Hệ thống sẽ tự động gửi tin nhắn hướng dẫn bảo quản cho
                      khách hàng sau 60 phút
                    </Text>
                  </div>
                </>
              )}
            </>
          );
        }}
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            Lưu
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}


