export enum FeedbackType {
  PRAISE = "praise", // KHEN
  NEUTRAL = "neutral", // TÀM TẠM
  COMPLAINT = "complaint", // CHÊ
  ANGRY = "angry", // BỨC XÚC
}

export interface CustomerFeedback {
  id: string;
  orderId: string;
  orderCode: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  feedbackType: FeedbackType;
  rating?: number; // 1-5 stars (optional)
  notes?: string;
  collectedBy?: string; // Staff ID who collected feedback
  collectedByName?: string;
  collectedAt: number;
  createdAt: number;
  updatedAt: number;
  // Auto-loop flag: if CHÊ or BỨC XÚC, should loop back to BƯỚC 4
  requiresReService?: boolean;
  reServiceOrderId?: string; // Link to new order if re-service needed
}

export interface FirebaseFeedback {
  [feedbackId: string]: CustomerFeedback;
}

export const FeedbackTypeLabels: Record<FeedbackType, string> = {
  [FeedbackType.PRAISE]: "Khen",
  [FeedbackType.NEUTRAL]: "Tàm tạm",
  [FeedbackType.COMPLAINT]: "Chê",
  [FeedbackType.ANGRY]: "Bức xúc",
};

export const FeedbackTypeOptions = [
  { label: "Khen", value: FeedbackType.PRAISE },
  { label: "Tàm tạm", value: FeedbackType.NEUTRAL },
  { label: "Chê", value: FeedbackType.COMPLAINT },
  { label: "Bức xúc", value: FeedbackType.ANGRY },
];


