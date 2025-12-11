"use client";

import { useUser } from "@/firebase/provider";
import { FeedbackService } from "@/services/feedbackService";
import {
  FeedbackType,
  FeedbackTypeOptions,
  type CustomerFeedback,
} from "@/types/feedback";
import { App, Button, Form, Input, Radio, Rate, Space, Typography } from "antd";
import { useEffect, useState } from "react";

const { TextArea } = Input;
const { Text } = Typography;

interface FeedbackFormProps {
  orderId: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialFeedback?: CustomerFeedback;
}

export default function FeedbackForm({
  orderId,
  orderCode,
  customerName,
  customerPhone,
  customerId,
  onSuccess,
  onCancel,
  initialFeedback,
}: FeedbackFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const { user } = useUser();

  useEffect(() => {
    if (initialFeedback) {
      form.setFieldsValue({
        feedbackType: initialFeedback.feedbackType,
        rating: initialFeedback.rating,
        notes: initialFeedback.notes,
      });
    }
  }, [initialFeedback, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const feedbackData: Omit<
        CustomerFeedback,
        "id" | "createdAt" | "updatedAt"
      > = {
        orderId,
        orderCode,
        customerId,
        customerName,
        customerPhone,
        feedbackType: values.feedbackType,
        rating: values.rating,
        notes: values.notes,
        collectedBy: user?.uid,
        collectedByName:
          user?.displayName || user?.email || "Người dùng hiện tại",
        collectedAt: new Date().getTime(),
        requiresReService:
          values.feedbackType === FeedbackType.COMPLAINT ||
          values.feedbackType === FeedbackType.ANGRY,
      };

      if (initialFeedback) {
        await FeedbackService.update(initialFeedback.id, feedbackData);
        message.success("Cập nhật feedback thành công!");
      } else {
        await FeedbackService.create(feedbackData);
        message.success("Lưu feedback thành công!");
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error saving feedback:", error);
      message.error("Có lỗi xảy ra khi lưu feedback!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <div className="mb-4">
        <Text strong>Khách hàng: </Text>
        <Text>{customerName}</Text>
        <Text className="ml-2 text-gray-500">({customerPhone})</Text>
      </div>

      <Form.Item
        label="Loại feedback"
        name="feedbackType"
        rules={[{ required: true, message: "Vui lòng chọn loại feedback!" }]}
      >
        <Radio.Group options={FeedbackTypeOptions} />
      </Form.Item>

      <Form.Item label="Đánh giá (tùy chọn)" name="rating">
        <Rate allowHalf />
      </Form.Item>

      <Form.Item
        label="Ghi chú"
        name="notes"
        rules={[{ max: 1000, message: "Ghi chú không được quá 1000 ký tự!" }]}
      >
        <TextArea
          rows={4}
          placeholder="Nhập ghi chú về feedback của khách hàng..."
          showCount
          maxLength={1000}
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initialFeedback ? "Cập nhật" : "Lưu"}
          </Button>
          {onCancel && <Button onClick={onCancel}>Hủy</Button>}
        </Space>
      </Form.Item>
    </Form>
  );
}


