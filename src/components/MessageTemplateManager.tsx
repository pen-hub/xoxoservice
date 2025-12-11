"use client";

import { MessageService } from "@/services/messageService";
import {
  MessageEventType,
  MessageEventTypeOptions,
  type MessageTemplate,
} from "@/types/message";
import { App, Form, Input, Modal, Select, Switch, Typography } from "antd";
import { useEffect, useState } from "react";

const { TextArea } = Input;
const { Text } = Typography;

interface MessageTemplateManagerProps {
  visible: boolean;
  onCancel: () => void;
  template?: MessageTemplate;
}

export default function MessageTemplateManager({
  visible,
  onCancel,
  template,
}: MessageTemplateManagerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    if (template && visible) {
      form.setFieldsValue(template);
    } else {
      form.resetFields();
      form.setFieldsValue({
        enabled: true,
      });
    }
  }, [template, visible, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (template?.id) {
        await MessageService.updateTemplate(template.id, values);
        message.success("Cập nhật template thành công!");
      } else {
        await MessageService.createTemplate(values);
        message.success("Tạo template thành công!");
      }

      onCancel();
    } catch (error) {
      console.error("Error saving template:", error);
      message.error("Có lỗi xảy ra khi lưu template!");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableVariables = (eventType: MessageEventType) => {
    const common = ["customerName", "orderCode"];
    switch (eventType) {
      case MessageEventType.APPOINTMENT_REMINDER:
        return [...common, "appointmentDate", "purpose"];
      case MessageEventType.STORAGE_INSTRUCTIONS:
        return [...common, "storageLocation"];
      default:
        return common;
    }
  };

  return (
    <Modal
      title={template ? "Chỉnh sửa template" : "Tạo template mới"}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={700}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Tên template"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên template!" }]}
        >
          <Input placeholder="VD: Xác nhận đơn hàng" />
        </Form.Item>

        <Form.Item
          label="Loại sự kiện"
          name="eventType"
          rules={[{ required: true, message: "Vui lòng chọn loại sự kiện!" }]}
        >
          <Select options={MessageEventTypeOptions} />
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.eventType !== currentValues.eventType
          }
        >
          {({ getFieldValue }) => {
            const eventType = getFieldValue("eventType");
            const variables = eventType ? getAvailableVariables(eventType) : [];

            return (
              <>
                <Form.Item
                  label="Nội dung"
                  name="content"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập nội dung template!",
                    },
                  ]}
                  extra={
                    variables.length > 0 && (
                      <div className="mt-2">
                        <Text type="secondary" className="text-sm">
                          Biến có sẵn:{" "}
                          {variables.map((v) => `{{${v}}}`).join(", ")}
                        </Text>
                      </div>
                    )
                  }
                >
                  <TextArea
                    rows={6}
                    placeholder="VD: Xin chào {{customerName}}, đơn hàng {{orderCode}} của bạn đã được xác nhận..."
                  />
                </Form.Item>
              </>
            );
          }}
        </Form.Item>

        <Form.Item label="Kích hoạt" name="enabled" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}


