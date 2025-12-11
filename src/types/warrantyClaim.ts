import type { UploadFile } from "antd/es/upload/interface";

export enum WarrantyClaimStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  ON_HOLD = "on_hold",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export interface WarrantyClaimProductData {
  id: string;
  name: string;
  quantity: number;
  price: number;
  images: (UploadFile & { firebaseUrl?: string })[];
  workflows: Array<{
    id: string;
    departmentCode?: string;
    workflowCode: string[];
    workflowName: string[];
    members: string[];
    isDone: boolean;
  }>;
}

export interface WarrantyClaim {
  id: string;
  code: string; // Mã phiếu nhập bảo hành
  originalOrderId: string; // ID đơn hàng gốc
  originalOrderCode: string; // Mã đơn hàng gốc
  customerName: string;
  phone: string;
  email: string;
  address: string;
  customerSource: string;
  customerCode?: string;
  orderDate: number; // Timestamp
  deliveryDate: number; // Timestamp
  createdBy: string;
  createdByName: string;
  consultantId?: string;
  consultantName?: string;
  products: Record<string, {
    name: string;
    quantity: number;
    price: number;
    images: Array<{
      uid: string;
      name: string;
      url: string;
    }>;
    workflows: Record<string, {
      departmentCode?: string;
      workflowCode: string[];
      workflowName: string[];
      members: string[];
      isDone: boolean;
      updatedAt: number;
    }>;
  }>;
  status: WarrantyClaimStatus;
  totalAmount?: number;
  discountAmount?: number;
  subtotal?: number;
  discount?: number;
  discountType?: "amount" | "percentage";
  shippingFee?: number;
  notes?: string;
  issues?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface FirebaseWarrantyClaims {
  [claimId: string]: WarrantyClaim;
}

export const WarrantyClaimStatusLabels: Record<WarrantyClaimStatus, string> = {
  [WarrantyClaimStatus.PENDING]: "Chờ xử lý",
  [WarrantyClaimStatus.CONFIRMED]: "Đã xác nhận",
  [WarrantyClaimStatus.IN_PROGRESS]: "Đang thực hiện",
  [WarrantyClaimStatus.ON_HOLD]: "Tạm giữ",
  [WarrantyClaimStatus.COMPLETED]: "Hoàn thành",
  [WarrantyClaimStatus.CANCELLED]: "Đã hủy",
};

export const WarrantyClaimStatusOptions = [
  { label: "Chờ xử lý", value: WarrantyClaimStatus.PENDING },
  { label: "Đã xác nhận", value: WarrantyClaimStatus.CONFIRMED },
  { label: "Đang thực hiện", value: WarrantyClaimStatus.IN_PROGRESS },
  { label: "Tạm giữ", value: WarrantyClaimStatus.ON_HOLD },
  { label: "Hoàn thành", value: WarrantyClaimStatus.COMPLETED },
  { label: "Đã hủy", value: WarrantyClaimStatus.CANCELLED },
];


