"use client";

import { useUser } from "@/firebase/provider";
import { PerformanceService } from "@/services/performanceService";
import {
  ErrorSeverityOptions,
  ErrorTypeOptions,
  type TechnicalError,
} from "@/types/performance";
import { App, Button, Form, Input, Select, Space, Typography } from "antd";
import { useState } from "react";

const { TextArea } = Input;
const { Text } = Typography;

interface ErrorTrackingProps {
  orderCode: string;
  productId?: string;
  stepId?: string;
  stepName?: string;
  technicianId: string;
  technicianName?: string;
  onSuccess?: () => void;
}

export default function ErrorTracking({
  orderCode,
  productId,
  stepId,
  stepName,
  technicianId,
  technicianName,
  onSuccess,
}: ErrorTrackingProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const { user } = useUser();

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const errorData: Omit<TechnicalError, "id" | "createdAt" | "updatedAt"> =
        {
          orderId: orderCode,
          orderCode,
          productId,
          stepId,
          stepName,
          technicianId,
          technicianName,
          errorType: values.errorType,
          severity: values.severity,
          description: values.description,
          resolved: false,
          createdBy: user?.uid,
          createdByName:
            user?.displayName || user?.email || "Người dùng hiện tại",
        };

      await PerformanceService.create(errorData);
      message.success("Đã ghi nhận lỗi kỹ thuật!");
      form.resetFields();
      onSuccess?.();
    } catch (error) {
      console.error("Error creating technical error:", error);
      message.error("Có lỗi xảy ra khi ghi nhận lỗi!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <div className="mb-4">
        <Text strong>Nhân viên: </Text>
        <Text>{technicianName || technicianId}</Text>
      </div>
      {stepName && (
        <div className="mb-4">
          <Text strong>Bước: </Text>
          <Text>{stepName}</Text>
        </div>
      )}

      <Form.Item
        label="Loại lỗi"
        name="errorType"
        rules={[{ required: true, message: "Vui lòng chọn loại lỗi!" }]}
      >
        <Select options={ErrorTypeOptions} />
      </Form.Item>

      <Form.Item
        label="Mức độ nghiêm trọng"
        name="severity"
        rules={[
          { required: true, message: "Vui lòng chọn mức độ nghiêm trọng!" },
        ]}
      >
        <Select options={ErrorSeverityOptions} />
      </Form.Item>

      <Form.Item
        label="Mô tả lỗi"
        name="description"
        rules={[{ required: true, message: "Vui lòng nhập mô tả lỗi!" }]}
      >
        <TextArea
          rows={4}
          placeholder="Mô tả chi tiết lỗi kỹ thuật..."
          showCount
          maxLength={1000}
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            Ghi nhận
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}


