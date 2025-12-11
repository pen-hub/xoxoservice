export enum MessageEventType {
  ORDER_CONFIRMED = "order_confirmed",
  APPOINTMENT_REMINDER = "appointment_reminder",
  PRODUCT_READY = "product_ready",
  STORAGE_INSTRUCTIONS = "storage_instructions",
  FEEDBACK_REQUEST = "feedback_request",
}

export interface MessageTemplate {
  id: string;
  eventType: MessageEventType;
  name: string;
  content: string; // Template content with variables like {{customerName}}, {{orderCode}}
  variables: string[]; // List of available variables
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface MessageLog {
  id: string;
  templateId: string;
  eventType: MessageEventType;
  recipientPhone: string;
  recipientName: string;
  content: string; // Final rendered content
  sentAt: number;
  status: "sent" | "failed" | "pending";
  error?: string;
  orderId?: string;
  orderCode?: string;
}

export interface FirebaseMessageTemplates {
  [templateId: string]: MessageTemplate;
}

export interface FirebaseMessageLogs {
  [logId: string]: MessageLog;
}

export const MessageEventTypeLabels: Record<MessageEventType, string> = {
  [MessageEventType.ORDER_CONFIRMED]: "Xác nhận đơn hàng",
  [MessageEventType.APPOINTMENT_REMINDER]: "Nhắc lịch hẹn",
  [MessageEventType.PRODUCT_READY]: "Sản phẩm sẵn sàng",
  [MessageEventType.STORAGE_INSTRUCTIONS]: "Hướng dẫn bảo quản",
  [MessageEventType.FEEDBACK_REQUEST]: "Yêu cầu feedback",
};

export const MessageEventTypeOptions = [
  {
    label: "Xác nhận đơn hàng",
    value: MessageEventType.ORDER_CONFIRMED,
  },
  {
    label: "Nhắc lịch hẹn",
    value: MessageEventType.APPOINTMENT_REMINDER,
  },
  {
    label: "Sản phẩm sẵn sàng",
    value: MessageEventType.PRODUCT_READY,
  },
  {
    label: "Hướng dẫn bảo quản",
    value: MessageEventType.STORAGE_INSTRUCTIONS,
  },
  {
    label: "Yêu cầu feedback",
    value: MessageEventType.FEEDBACK_REQUEST,
  },
];


