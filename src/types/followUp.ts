export enum FollowUpType {
  TWO_DAYS = "2_days", // Sau 2 ngày
  SIX_MONTHS = "6_months", // Sau 6 tháng
  TWELVE_MONTHS = "12_months", // Sau 12 tháng
}

export interface FollowUpSchedule {
  id: string;
  orderId: string;
  orderCode: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  followUpType: FollowUpType;
  scheduledDate: number; // Timestamp
  completedDate?: number; // Timestamp when follow-up was done
  status: "pending" | "completed" | "cancelled" | "overdue";
  notes?: string;
  completedBy?: string; // Staff ID
  completedByName?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FirebaseFollowUpSchedules {
  [followUpId: string]: FollowUpSchedule;
}

export const FollowUpTypeLabels: Record<FollowUpType, string> = {
  [FollowUpType.TWO_DAYS]: "Sau 2 ngày",
  [FollowUpType.SIX_MONTHS]: "Sau 6 tháng",
  [FollowUpType.TWELVE_MONTHS]: "Sau 12 tháng",
};

export const FollowUpTypeOptions = [
  { label: "Sau 2 ngày", value: FollowUpType.TWO_DAYS },
  { label: "Sau 6 tháng", value: FollowUpType.SIX_MONTHS },
  { label: "Sau 12 tháng", value: FollowUpType.TWELVE_MONTHS },
];


