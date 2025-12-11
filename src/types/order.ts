import { CustomerSource, DiscountType } from "@/types/enum";
import { IMembers } from "@/types/members";
import type { UploadFile } from "antd/es/upload/interface";
import type { Dayjs } from "dayjs";
export { DiscountType } from "@/types/enum";

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  ON_HOLD = "on_hold",
  COMPLETED = "completed",
  REFUND = "refund",
  CANCELLED = "cancelled",
}
// Basic interfaces for Firebase data structure

export interface Workflow {
  name: string;
  department?: string;
}

export interface FirebaseStaff {
  [key: string]: IMembers;
}

export interface FirebaseWorkflows {
  [key: string]: Workflow;
}

export interface FirebaseDepartments {
  [key: string]: {
    code: string;
    name: string;
    createdAt?: number;
    updatedAt?: number;
  };
}

// Workflow and Product data structures
export interface WorkflowData {
  id: string;
  departmentCode?: string;
  workflowCode: string[];
  workflowName: string[];
  members: string[];
  isDone: boolean;
}

export interface ProductData {
  id: string;
  name: string;
  quantity: number;
  price: number;
  images: (UploadFile & { firebaseUrl?: string })[];
  imagesDone?: (UploadFile & { firebaseUrl?: string })[];
  workflows: WorkflowData[];
}
export enum WorkflowStatus {
  Pending = "pending",
  InProgress = "in_progress",
  Completed = "completed",
}

// Firebase storage data structures
export interface FirebaseWorkflowData {
  departmentCode?: string;
  workflowCode: string[];
  workflowName: string[];
  members: string[];
  isDone: boolean;
  updatedAt: number;
}

export interface FirebaseProductData {
  name: string;
  quantity: number;
  price: number;
  images: Array<{
    uid: string;
    name: string;
    url: string;
  }>;
  imagesDone?: Array<{
    uid: string;
    name: string;
    url: string;
  }>;
  workflows: Record<string, FirebaseWorkflowData>;
}



export interface ProcessedProductData {
  id: string;
  name: string;
  quantity: number;
  images: Array<{
    uid: string;
    name: string;
    url: string;
    firebaseUrl?: string;
    error?: boolean;
  }>;
  workflows: WorkflowData[];
}

export enum DeliveryMethod {
  SHIP = "ship", // Gửi ship
  PICKUP = "pickup", // Khách qua lấy
  STORE = "store", // Lưu kho
}

export interface DeliveryInfo {
  method: DeliveryMethod;
  shippingAddress?: string;
  trackingNumber?: string;
  estimatedDate?: number; // Timestamp
  actualDate?: number; // Timestamp
  status: "pending" | "in_transit" | "delivered" | "picked_up" | "stored";
  storageLocation?: string; // For STORE method
  storageInstructionsSent?: boolean; // Whether storage instructions were sent
}

export interface FirebaseOrderData {
  code: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  customerSource: CustomerSource;
  orderDate: number;
  deliveryDate: number;
  createdBy: string;
  createdByName: string;
  consultantId?: string;
  consultantName?: string;
  commissionPercentage?: number; // Commission percentage for consultant (at order level)
  createdAt?: number;
  updatedAt?: number;
  notes?: string;
  discount?: number;
  discountType?: "amount" | "percentage";
  shippingFee?: number;
  products: Record<string, FirebaseProductData>;
  status?: OrderStatus;
  totalAmount?: number;
  discountAmount?: number;
  subtotal?: number;
  deposit?: number;
  depositType?: "amount" | "percentage";
  depositAmount?: number;
  isDepositPaid?: boolean;
  customerCode?: string;
  issues?: string[];
  appointmentId?: string;
  deliveryInfo?: DeliveryInfo;
  warrantyId?: string;
  refundRequestId?: string;
  caredBy?: string; // User ID who marked as cared
  caredByName?: string; // User name who marked as cared
  caredAt?: number; // Timestamp when marked as cared
  careCount?: number; // Number of times this order has been cared for
}

// Form related interfaces
export interface FormValues {
  code: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  customerSource: CustomerSource;
  orderDate: Dayjs;
  deliveryDate: Dayjs;
  createdBy: string;
  createdByName: string;
  consultantId?: string;
  commissionPercentage?: number; // Commission percentage for consultant (at order level)
  notes?: string;
  discount?: number;
  discountType?: DiscountType;
  shippingFee?: number;
  status?: OrderStatus;
  totalAmount?: number;
  deposit?: number;
  depositType?: DiscountType;
  isDepositPaid?: boolean;
  customerCode?: string;
  issues?: string[];
}

export interface OrderFormProps {
  mode: "create" | "update";
  orderCode?: string;
  onSuccess?: (orderCode: string) => void;
  onCancel?: () => void;
}

// Component props interfaces
export interface ProductCardProps {
  product: ProductData;
  onUpdate: (product: ProductData) => void;
  onRemove: () => void;
  staffOptions: Array<{ value: string; label: string }>;
  workflowOptions: Array<{ value: string; label: string }>;
  workflows: FirebaseWorkflows;
  staff: FirebaseStaff;
  departments: FirebaseDepartments;
}
