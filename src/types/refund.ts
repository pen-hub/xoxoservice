export enum RefundType {
  FULL = "full", // Hoàn tiền toàn bộ
  PARTIAL = "partial", // Hoàn tiền một phần
  COMPENSATION = "compensation", // Bồi thường
}

export enum RefundStatus {
  PENDING = "pending", // Chờ duyệt
  APPROVED = "approved", // Đã duyệt
  REJECTED = "rejected", // Từ chối
  PROCESSED = "processed", // Đã xử lý
  CANCELLED = "cancelled", // Đã hủy
}

export interface RefundRequest {
  id: string;
  orderId: string;
  orderCode: string;
  reason: string;
  amount: number;
  type: RefundType;
  status: RefundStatus;
  requestedBy: string; // Staff ID who created the request
  requestedByName: string;
  requestedAt: number;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: number;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: number;
  rejectionReason?: string;
  processedBy?: string;
  processedByName?: string;
  processedDate?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FirebaseRefundRequests {
  [refundId: string]: RefundRequest;
}

export const RefundTypeLabels: Record<RefundType, string> = {
  [RefundType.FULL]: "Hoàn tiền toàn bộ",
  [RefundType.PARTIAL]: "Hoàn tiền một phần",
  [RefundType.COMPENSATION]: "Bồi thường",
};

export const RefundStatusLabels: Record<RefundStatus, string> = {
  [RefundStatus.PENDING]: "Chờ duyệt",
  [RefundStatus.APPROVED]: "Đã duyệt",
  [RefundStatus.REJECTED]: "Từ chối",
  [RefundStatus.PROCESSED]: "Đã xử lý",
  [RefundStatus.CANCELLED]: "Đã hủy",
};

export const RefundTypeOptions = [
  { label: "Hoàn tiền toàn bộ", value: RefundType.FULL },
  { label: "Hoàn tiền một phần", value: RefundType.PARTIAL },
  { label: "Bồi thường", value: RefundType.COMPENSATION },
];

export const RefundStatusOptions = [
  { label: "Chờ duyệt", value: RefundStatus.PENDING },
  { label: "Đã duyệt", value: RefundStatus.APPROVED },
  { label: "Từ chối", value: RefundStatus.REJECTED },
  { label: "Đã xử lý", value: RefundStatus.PROCESSED },
  { label: "Đã hủy", value: RefundStatus.CANCELLED },
];


