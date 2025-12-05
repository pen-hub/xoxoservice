import { DiscountType } from "@/types/enum";
import type { UploadFile } from "antd/es/upload/interface";
import type { Dayjs } from "dayjs";

export enum OrderStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}
// Basic interfaces for Firebase data structure
export interface Staff {
  name: string;
  role: string;
}

export interface Workflow {
  name: string;
}

export interface FirebaseStaff {
  [key: string]: Staff;
}

export interface FirebaseWorkflows {
  [key: string]: Workflow;
}

// Stage and Product data structures
export interface StageData {
  id: string;
  stageId: string;
  stageName: string;
  employees: string[];
  status: string;
}

export interface ProductData {
  id: string;
  name: string;
  quantity: number;
  price: number;
  images: (UploadFile & { firebaseUrl?: string })[];
  stages: StageData[];
}
export enum StageStatus {
  Pending = "pending",
  InProgress = "in_progress",
  Completed = "completed",
}

// Firebase storage data structures
export interface FirebaseStageData {
  workflowId: string;
  workflowName: string;
  name: string;
  employees: string[];
  status: StageStatus;
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
  stages: Record<string, FirebaseStageData>;
}

export interface Order {
  id: string;              // Firebase document ID
  orderId: string;
  customerName: string;
  address: string;
  phone: string;
  email: string;
  orderDate: number;       // timestamp
  deliveryDate: number;    // timestamp
  createdAt: number;       // timestamp
  createdBy: string;
  createdByName: string;
  discount: number;
  discountType: DiscountType;
  notes: string;
  products: Record<string, FirebaseProductData>;
  code: string;
  status: OrderStatus;     // Order status
  shippingFee?: number;
  updatedAt?: number;      // timestamp
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
  stages: StageData[];
}

export interface FirebaseOrderData {
  orderId: string;
  code: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  orderDate: number;
  deliveryDate: number;
  createdBy: string;
  createdByName: string;
  createdAt?: number;
  updatedAt?: number;
  notes?: string;
  discount?: number;
  discountType?: "amount" | "percentage";
  shippingFee?: number;
  products: Record<string, FirebaseProductData>;
    status?: OrderStatus;
}

// Form related interfaces
export interface FormValues {
  code: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  orderDate: Dayjs;
  deliveryDate: Dayjs;
  createdBy?: string;
  createdByName?: string;
  notes?: string;
  discount?: number;
  discountType?: DiscountType;
  shippingFee?: number;
    status?: OrderStatus;
}

export interface OrderFormProps {
  mode: "create" | "update";
  orderId?: string;
  onSuccess?: (orderId: string) => void;
  onCancel?: () => void;
}

// Component props interfaces
export interface ProductCardProps {
  product: ProductData;
  onUpdate: (product: ProductData) => void;
  onRemove: () => void;
  staffOptions: Array<{ value: string; label: string }>;
  stageOptions: Array<{ value: string; label: string }>;
  workflows: FirebaseWorkflows;
}
