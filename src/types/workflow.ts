// ==================== WORKFLOW SYSTEM TYPES ====================

/** Status of a workflow step/stage */
export type WorkflowStepStatus = 'pending' | 'in_progress' | 'completed';

/** Staff role */
export type StaffRole = 'worker' | 'sale' | 'manager' | 'admin';

// ==================== STAFF (formerly EMPLOYEES) ====================

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  createdAt?: number;
}

export interface StaffMap {
  [staffId: string]: Staff;
}

// ==================== STAGES (formerly WORKFLOW TEMPLATES) ====================

export interface Stage {
  id: string;
  name: string;
  defaultStaff?: string[]; // Array of staff IDs
  createdAt: number;
  order?: number; // For sorting stages
}

export interface StageMap {
  [stageId: string]: Omit<Stage, 'id'>;
}

// ==================== ORDER - PRODUCT - STAGES ====================

/** Stage inside a product (cloned from template) */
export interface ProductStage {
  stageId: string;
  name: string;
  staff: { [staffId: string]: boolean }; // Object map for Firebase
  status: WorkflowStepStatus;
  completedQuantity: number;
  updatedAt: number;
  order?: number; // For sorting
}

export interface ProductStageMap {
  [stageKey: string]: ProductStage;
}

/** Product inside an order */
export interface OrderProduct {
  name: string;
  quantity: number;
  price?: number;
  stages: ProductStageMap;
  createdAt?: number;
}

export interface OrderProductMap {
  [productId: string]: OrderProduct;
}

/** Order main structure */
export interface Order {
  id: string;
  code: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  createdBy: string; // Employee ID
  createdAt: number;
  updatedAt?: number;
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
  totalAmount?: number;
  notes?: string;
  products: OrderProductMap;
}

export interface OrderMap {
  [orderId: string]: Omit<Order, 'id'>;
}

// ==================== FIREBASE REALTIME DATABASE ROOT STRUCTURE ====================

export interface RealtimeDatabaseSchema {
  xoxo: {
    stages: StageMap;
    staff: StaffMap;
    orders: OrderMap;
  };
}

// ==================== API/ACTION PAYLOAD TYPES ====================

/** Payload for creating a new order */
export interface CreateOrderPayload {
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  createdBy: string;
  notes?: string;
  products: Array<{
    name: string;
    quantity: number;
    price?: number;
  }>;
}

/** Payload for updating stage progress */
export interface UpdateStageProgressPayload {
  orderId: string;
  productId: string;
  stageKey: string;
  completedQuantity?: number;
  status?: WorkflowStepStatus;
  staff?: { [staffId: string]: boolean };
}

/** Payload for assigning/removing staff */
export interface UpdateStageStaffPayload {
  orderId: string;
  productId: string;
  stageKey: string;
  staffId: string;
  action: 'add' | 'remove';
}

// ==================== UI HELPER TYPES ====================

/** Expanded stage data with staff details (for UI display) */
export interface StageWithDetails extends ProductStage {
  stageKey: string;
  productId: string;
  productName: string;
  productQuantity: number;
  staffDetails: Staff[];
}

/** Order with expanded data (for UI display) */
export interface OrderWithDetails extends Order {
  createdByStaff?: Staff;
  totalProducts: number;
  totalStages: number;
  completedStages: number;
}
