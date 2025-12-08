import { CustomerSource, DiscountType } from "@/types/enum";
import { IMembers } from "@/types/members";
import type { UploadFile } from "antd/es/upload/interface";
import type { Dayjs } from "dayjs";

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  ON_HOLD = "on_hold",
  COMPLETED = "completed",
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
  commissionPercentage?: number; // Optional commission percentage for staff
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
  commissionPercentage?: number; // Optional commission percentage for staff
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
