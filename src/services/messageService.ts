import {
  MessageEventType,
  MessageLog,
  MessageTemplate
} from "@/types/message";
import { genCode } from "@/utils/genCode";
import {
  get,
  getDatabase,
  onValue,
  ref,
  remove,
  set,
  update,
} from "firebase/database";

const db = getDatabase();
const MESSAGE_TEMPLATES_PATH = "xoxo/message_templates";
const MESSAGE_LOGS_PATH = "xoxo/message_logs";

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

// Replace template variables with actual values
function renderTemplate(
  template: string,
  variables: Record<string, string | number>
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    rendered = rendered.replace(regex, String(value));
  }
  return rendered;
}

export class MessageService {
  // ========== TEMPLATES ==========

  static async getAllTemplates(): Promise<MessageTemplate[]> {
    const snapshot = await get(ref(db, MESSAGE_TEMPLATES_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data).map(([id, template]) => ({
      id,
      ...(template as Omit<MessageTemplate, "id">),
    }));
  }

  static async getTemplateById(id: string): Promise<MessageTemplate | null> {
    const snapshot = await get(ref(db, `${MESSAGE_TEMPLATES_PATH}/${id}`));
    const data = snapshot.val();
    return data ? { id, ...data } : null;
  }

  static async getTemplateByEventType(
    eventType: MessageEventType
  ): Promise<MessageTemplate | null> {
    const templates = await this.getAllTemplates();
    return (
      templates.find((t) => t.eventType === eventType && t.enabled) || null
    );
  }

  static async createTemplate(
    template: Omit<MessageTemplate, "id" | "createdAt" | "updatedAt">
  ): Promise<MessageTemplate> {
    const now = new Date().getTime();
    const templateCode = genCode("TMP_");

    const templateData: MessageTemplate = {
      ...template,
      id: templateCode,
      createdAt: now,
      updatedAt: now,
    };

    await set(ref(db, `${MESSAGE_TEMPLATES_PATH}/${templateCode}`), removeUndefined(templateData));
    return templateData;
  }

  static async updateTemplate(
    id: string,
    template: Partial<Omit<MessageTemplate, "id" | "createdAt">>
  ): Promise<void> {
    const templateData = removeUndefined({
      ...template,
      updatedAt: new Date().getTime(),
    });
    await update(ref(db, `${MESSAGE_TEMPLATES_PATH}/${id}`), templateData);
  }

  static async deleteTemplate(id: string): Promise<void> {
    await remove(ref(db, `${MESSAGE_TEMPLATES_PATH}/${id}`));
  }

  static onTemplatesSnapshot(
    callback: (templates: MessageTemplate[]) => void
  ): () => void {
    const templatesRef = ref(db, MESSAGE_TEMPLATES_PATH);
    const unsubscribe = onValue(templatesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const templates = Object.entries(data).map(([id, template]) => ({
        id,
        ...(template as Omit<MessageTemplate, "id">),
      }));
      callback(templates);
    });
    return unsubscribe;
  }

  // ========== MESSAGE LOGS ==========

  static async getAllLogs(): Promise<MessageLog[]> {
    const snapshot = await get(ref(db, MESSAGE_LOGS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data).map(([id, log]) => ({
      id,
      ...(log as Omit<MessageLog, "id">),
    }));
  }

  static async getLogsByOrderCode(
    orderCode: string
  ): Promise<MessageLog[]> {
    const allLogs = await this.getAllLogs();
    return allLogs.filter((log) => log.orderCode === orderCode);
  }

  static onLogsSnapshot(
    callback: (logs: MessageLog[]) => void
  ): () => void {
    const logsRef = ref(db, MESSAGE_LOGS_PATH);
    const unsubscribe = onValue(logsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const logs = Object.entries(data).map(([id, log]) => ({
        id,
        ...(log as Omit<MessageLog, "id">),
      }));
      callback(logs);
    });
    return unsubscribe;
  }

  // ========== SEND MESSAGES ==========

  /**
   * Send a message using Zalo API (placeholder - requires Zalo API integration)
   * For now, this just logs the message
   */
  static async sendMessage(
    phone: string,
    content: string,
    eventType: MessageEventType,
    templateId?: string,
    orderId?: string,
    orderCode?: string
  ): Promise<MessageLog> {
    // TODO: Integrate with Zalo API
    // For now, we'll just create a log entry
    // In production, this would call Zalo API:
    // const response = await fetch('https://openapi.zalo.me/v2.0/oa/message', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'access_token': ZALO_ACCESS_TOKEN
    //   },
    //   body: JSON.stringify({
    //     recipient: { user_id: phone },
    //     message: { text: content }
    //   })
    // });

    const now = new Date().getTime();
    const logCode = genCode("LOG_");

    // Simulate sending (in production, check Zalo API response)
    const logData: MessageLog = {
      id: logCode,
      templateId: templateId || "",
      eventType,
      recipientPhone: phone,
      recipientName: "", // Could be fetched from customer data
      content,
      sentAt: now,
      status: "sent", // In production, set based on API response
      orderId,
      orderCode,
    };

    await set(ref(db, `${MESSAGE_LOGS_PATH}/${logCode}`), removeUndefined(logData));
    return logData;
  }

  /**
   * Send message using template
   */
  static async sendTemplateMessage(
    eventType: MessageEventType,
    phone: string,
    recipientName: string,
    variables: Record<string, string | number>,
    orderId?: string,
    orderCode?: string
  ): Promise<MessageLog | null> {
    const template = await this.getTemplateByEventType(eventType);
    if (!template) {
      console.warn(`No template found for event type: ${eventType}`);
      return null;
    }

    const content = renderTemplate(template.content, variables);
    return await this.sendMessage(
      phone,
      content,
      eventType,
      template.id,
      orderId,
      orderCode
    );
  }

  // Convenience methods for specific events
  static async sendOrderConfirmed(
    phone: string,
    customerName: string,
    orderCode: string
  ): Promise<MessageLog | null> {
    return this.sendTemplateMessage(
      MessageEventType.ORDER_CONFIRMED,
      phone,
      customerName,
      { customerName, orderCode }
    );
  }

  static async sendAppointmentReminder(
    phone: string,
    customerName: string,
    appointmentDate: string,
    purpose: string
  ): Promise<MessageLog | null> {
    return this.sendTemplateMessage(
      MessageEventType.APPOINTMENT_REMINDER,
      phone,
      customerName,
      { customerName, appointmentDate, purpose }
    );
  }

  static async sendProductReady(
    phone: string,
    customerName: string,
    orderCode: string
  ): Promise<MessageLog | null> {
    return this.sendTemplateMessage(
      MessageEventType.PRODUCT_READY,
      phone,
      customerName,
      { customerName, orderCode },
      undefined,
      orderCode
    );
  }

  static async sendStorageInstructions(
    phone: string,
    customerName: string,
    storageLocation: string,
    orderCode: string
  ): Promise<MessageLog | null> {
    return this.sendTemplateMessage(
      MessageEventType.STORAGE_INSTRUCTIONS,
      phone,
      customerName,
      { customerName, storageLocation, orderCode },
      undefined,
      orderCode
    );
  }

  static async sendFeedbackRequest(
    phone: string,
    customerName: string,
    orderCode: string
  ): Promise<MessageLog | null> {
    return this.sendTemplateMessage(
      MessageEventType.FEEDBACK_REQUEST,
      phone,
      customerName,
      { customerName, orderCode },
      undefined,
      orderCode
    );
  }
}


