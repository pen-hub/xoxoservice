"use client";

import { useUser } from "@/firebase/provider";
import { RefundService } from "@/services/refundService";
import { OrderStatus } from "@/types/order";
import {
  RefundStatus,
  RefundStatusLabels,
  RefundType,
  RefundTypeLabels,
  RefundTypeOptions,
  type RefundRequest,
} from "@/types/refund";
import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Radio,
  Space,
  Tag,
  Typography,
} from "antd";
import { ref as dbRef, getDatabase, update } from "firebase/database";
import { useEffect, useState } from "react";

const { TextArea } = Input;
const { Text } = Typography;

interface RefundManagerProps {
  orderCode: string;
  orderTotalAmount: number;
  onSuccess?: () => void;
  refund?: RefundRequest;
  refundId?: string;
  mode?: "create" | "approve" | "process" | "view";
}

export default function RefundManager({
  orderCode,
  orderTotalAmount,
  onSuccess,
  refund: refundProp,
  refundId,
  mode = refundProp || refundId ? "view" : "create",
}: RefundManagerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [refund, setRefund] = useState<RefundRequest | undefined>(refundProp);
  const { message } = App.useApp();
  const { user } = useUser();

  // Load refund if refundId is provided
  useEffect(() => {
    if (refundId && !refundProp) {
      RefundService.getById(refundId).then((data) => {
        if (data) {
          setRefund(data);
        }
      });
    } else if (refundProp) {
      setRefund(refundProp);
    }
  }, [refundId, refundProp]);

  useEffect(() => {
    if (refund) {
      form.setFieldsValue({
        type: refund.type,
        amount: refund.amount,
        reason: refund.reason,
        notes: refund.notes,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        type: RefundType.FULL,
        amount: orderTotalAmount,
      });
    }
  }, [refund, orderTotalAmount, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (mode === "create") {
        const refundData: Omit<
          RefundRequest,
          "id" | "createdAt" | "updatedAt"
        > = {
          orderId: orderCode,
          orderCode,
          reason: values.reason,
          amount: values.amount,
          type: values.type,
          status: RefundStatus.PENDING,
          requestedBy: user?.uid || "",
          requestedByName:
            user?.displayName || user?.email || "Người dùng hiện tại",
          requestedAt: new Date().getTime(),
          notes: values.notes,
        };

        await RefundService.create(refundData);
        message.success("Đã tạo yêu cầu hoàn tiền!");
      } else if (mode === "approve" && refund) {
        if (values.action === "approve") {
          await RefundService.approve(
            refund.id,
            user?.uid || "",
            user?.displayName || user?.email || "Người dùng hiện tại"
          );
          // Update order status to refund when approved
          const orderRef = dbRef(getDatabase(), `xoxo/orders/${orderCode}`);
          await update(orderRef, {
            status: OrderStatus.REFUND,
            updatedAt: new Date().getTime(),
          });
          message.success("Đã duyệt yêu cầu hoàn tiền!");
        } else if (values.action === "reject") {
          await RefundService.reject(
            refund.id,
            user?.uid || "",
            user?.displayName || user?.email || "Người dùng hiện tại",
            values.rejectionReason || "Không có lý do"
          );
          message.success("Đã từ chối yêu cầu hoàn tiền!");
        }
      } else if (mode === "process" && refund) {
        await RefundService.process(
          refund.id,
          user?.uid || "",
          user?.displayName || user?.email || "Người dùng hiện tại"
        );
        message.success("Đã xử lý yêu cầu hoàn tiền!");
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error processing refund:", error);
      message.error("Có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  const refundTypeOptions = RefundTypeOptions;

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      {mode === "view" && refund ? (
        <div className="space-y-3">
          <div>
            <Text strong>Loại: </Text>
            <Tag>{RefundTypeLabels[refund.type]}</Tag>
          </div>
          <div className="block w-full">
            <Text strong>Số tiền: </Text>
            <Text>{refund.amount.toLocaleString("vi-VN")} VNĐ</Text>
          </div>
          <div>
            <Text strong>Lý do: </Text>
            <Text>{refund.reason}</Text>
          </div>
          <div>
            <Text strong>Trạng thái: </Text>
            <Tag
              color={
                refund.status === RefundStatus.APPROVED
                  ? "green"
                  : refund.status === RefundStatus.REJECTED
                  ? "red"
                  : refund.status === RefundStatus.PROCESSED
                  ? "blue"
                  : "orange"
              }
            >
              {RefundStatusLabels[refund.status]}
            </Tag>
          </div>
          {refund.notes && (
            <div>
              <Text strong>Ghi chú: </Text>
              <Text>{refund.notes}</Text>
            </div>
          )}
        </div>
      ) : mode === "create" ? (
        <>
          <Form.Item
            label="Loại hoàn tiền"
            name="type"
            rules={[
              { required: true, message: "Vui lòng chọn loại hoàn tiền!" },
            ]}
          >
            <Radio.Group options={refundTypeOptions} />
          </Form.Item>

          <Form.Item
            label="Số tiền"
            name="amount"
            rules={[
              { required: true, message: "Vui lòng nhập số tiền!" },
              {
                type: "number",
                min: 0,
                max: orderTotalAmount,
                message: `Số tiền phải từ 0 đến ${orderTotalAmount.toLocaleString(
                  "vi-VN"
                )} VNĐ`,
              },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => Number(value?.replace(/,/g, "") || 0) as any}
              suffix="VNĐ"
              max={orderTotalAmount}
            />
          </Form.Item>

          <Form.Item
            label="Lý do"
            name="reason"
            rules={[{ required: true, message: "Vui lòng nhập lý do!" }]}
          >
            <TextArea
              rows={4}
              placeholder="Nhập lý do hoàn tiền/bồi thường..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item label="Ghi chú" name="notes">
            <TextArea rows={3} placeholder="Ghi chú (tùy chọn)" />
          </Form.Item>
        </>
      ) : mode === "approve" && refund ? (
        <>
          <div className="mb-4 p-3 bg-gray-50 rounded border">
            <div className="space-y-2">
              <div>
                <Text strong>Loại: </Text>
                <Tag>{RefundTypeLabels[refund.type]}</Tag>
              </div>
              <div>
                <Text strong>Số tiền: </Text>
                <Text className="text-lg text-red-600">
                  {refund.amount.toLocaleString("vi-VN")} VNĐ
                </Text>
              </div>
              <div>
                <Text strong>Lý do: </Text>
                <Text>{refund.reason}</Text>
              </div>
            </div>
          </div>

          <Form.Item
            label="Hành động"
            name="action"
            rules={[{ required: true, message: "Vui lòng chọn hành động!" }]}
          >
            <Radio.Group>
              <Radio value="approve">Duyệt</Radio>
              <Radio value="reject">Từ chối</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.action !== currentValues.action
            }
          >
            {({ getFieldValue }) => {
              const action = getFieldValue("action");
              return (
                action === "reject" && (
                  <Form.Item
                    label="Lý do từ chối"
                    name="rejectionReason"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập lý do từ chối!",
                      },
                    ]}
                  >
                    <TextArea rows={3} placeholder="Nhập lý do từ chối..." />
                  </Form.Item>
                )
              );
            }}
          </Form.Item>
        </>
      ) : mode === "process" && refund ? (
        <>
          <div className="mb-4 p-3 bg-green-50 rounded border border-green-200">
            <div className="space-y-2">
              <div>
                <Text strong>Loại: </Text>
                <Tag>{RefundTypeLabels[refund.type]}</Tag>
              </div>
              <div>
                <Text strong>Số tiền: </Text>
                <Text className="text-lg text-red-600">
                  {refund.amount.toLocaleString("vi-VN")} VNĐ
                </Text>
              </div>
              <div>
                <Text strong>Lý do: </Text>
                <Text>{refund.reason}</Text>
              </div>
              <div>
                <Text strong>Trạng thái: </Text>
                <Tag color="green">Đã duyệt</Tag>
              </div>
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <Text className="text-blue-700">
              Xác nhận đã xử lý hoàn tiền/bồi thường cho khách hàng?
            </Text>
          </div>
        </>
      ) : null}

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {mode === "create"
              ? "Tạo yêu cầu"
              : mode === "approve"
              ? "Xác nhận"
              : mode === "process"
              ? "Xác nhận đã xử lý"
              : "Đóng"}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}

