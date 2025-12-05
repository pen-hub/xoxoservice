'use client';

import type {
  CreateOrderPayload,
  Order,
  OrderProduct,
  ProductStage,
  Staff,
  Stage,
  UpdateStageProgressPayload,
  UpdateStageStaffPayload,
} from '@/types/workflow';
import type { FirebaseApp } from 'firebase/app';
import { getDatabase, push, ref, remove, set, update } from 'firebase/database';

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate a unique order code (e.g., ORD001, ORD002)
 */
function generateOrderCode(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `ORD${timestamp}${random}`;
}

/**
 * Get Firebase Realtime Database instance
 */
function getDB(firebaseApp: FirebaseApp) {
  return getDatabase(firebaseApp);
}

// ==================== STAGES (WORKFLOW TEMPLATES) ====================

/**
 * Create a new stage template
 */
export async function createStage(
  firebaseApp: FirebaseApp,
  stage: Omit<Stage, 'id' | 'createdAt'>
): Promise<string> {
  const db = getDB(firebaseApp);
  const stagesRef = ref(db, 'xoxo/stages');
  const newStageRef = push(stagesRef);

  await set(newStageRef, {
    ...stage,
    createdAt: Date.now(),
  });

  return newStageRef.key!;
}

/**
 * Update a stage template
 */
export async function updateStage(
  firebaseApp: FirebaseApp,
  stageId: string,
  updates: Partial<Omit<Stage, 'id' | 'createdAt'>>
): Promise<void> {
  const db = getDB(firebaseApp);
  const stageRef = ref(db, `xoxo/stages/${stageId}`);
  await update(stageRef, updates);
}

/**
 * Delete a stage template
 */
export async function deleteStage(
  firebaseApp: FirebaseApp,
  stageId: string
): Promise<void> {
  const db = getDB(firebaseApp);
  const stageRef = ref(db, `xoxo/stages/${stageId}`);
  await remove(stageRef);
}

// ==================== STAFF (EMPLOYEES) ====================

/**
 * Create a new staff member
 */
export async function createStaff(
  firebaseApp: FirebaseApp,
  staff: Omit<Staff, 'id'>
): Promise<string> {
  const db = getDB(firebaseApp);
  const staffRef = ref(db, 'xoxo/staff');
  const newStaffRef = push(staffRef);

  await set(newStaffRef, {
    ...staff,
    createdAt: Date.now(),
  });

  return newStaffRef.key!;
}

/**
 * Update a staff member
 */
export async function updateStaff(
  firebaseApp: FirebaseApp,
  staffId: string,
  updates: Partial<Omit<Staff, 'id'>>
): Promise<void> {
  const db = getDB(firebaseApp);
  const staffRef = ref(db, `xoxo/staff/${staffId}`);
  await update(staffRef, updates);
}

/**
 * Delete a staff member
 */
export async function deleteStaff(
  firebaseApp: FirebaseApp,
  staffId: string
): Promise<void> {
  const db = getDB(firebaseApp);
  const staffRef = ref(db, `xoxo/staff/${staffId}`);
  await remove(staffRef);
}

// ==================== ORDERS ====================

/**
 * Create a new order with products and stages
 */
export async function createOrder(
  firebaseApp: FirebaseApp,
  payload: CreateOrderPayload,
  stages: Stage[]
): Promise<string> {
  const db = getDB(firebaseApp);
  const ordersRef = ref(db, 'xoxo/orders');
  const newOrderRef = push(ordersRef);

  const now = Date.now();
  const orderCode = generateOrderCode();

  // Build products with stages
  const products: { [key: string]: OrderProduct } = {};

  for (const productPayload of payload.products) {
    const productKey = push(ref(db, 'temp')).key!; // Generate unique key

    // Clone stages from templates
    const productStages: { [key: string]: ProductStage } = {};

    stages.forEach((stage, index) => {
      const stageKey = `stage${index + 1}`;

      // Convert defaultStaff array to object map
      const staffMap: { [key: string]: boolean } = {};
      if (stage.defaultStaff) {
        stage.defaultStaff.forEach((staffId) => {
          staffMap[staffId] = true;
        });
      }

      productStages[stageKey] = {
        stageId: stage.id,
        name: stage.name,
        staff: staffMap,
        status: 'pending',
        completedQuantity: 0,
        updatedAt: now,
        order: stage.order || index,
      };
    });

    products[productKey] = {
      name: productPayload.name,
      quantity: productPayload.quantity,
      price: productPayload.price,
      stages: productStages,
      createdAt: now,
    };
  }

  const orderData: Omit<Order, 'id'> = {
    code: orderCode,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    customerAddress: payload.customerAddress,
    createdBy: payload.createdBy,
    createdAt: now,
    updatedAt: now,
    status: 'active',
    notes: payload.notes,
    products,
  };

  await set(newOrderRef, orderData);

  return newOrderRef.key!;
}

/**
 * Update stage progress (completedQuantity, status, staff)
 */
export async function updateStageProgress(
  firebaseApp: FirebaseApp,
  payload: UpdateStageProgressPayload
): Promise<void> {
  const db = getDB(firebaseApp);
  const stagePath = `xoxo/orders/${payload.orderId}/products/${payload.productId}/stages/${payload.stageKey}`;
  const stageRef = ref(db, stagePath);

  const updates: any = {
    updatedAt: Date.now(),
  };

  if (payload.completedQuantity !== undefined) {
    updates.completedQuantity = payload.completedQuantity;
  }

  if (payload.status) {
    updates.status = payload.status;
  }

  if (payload.staff) {
    updates.staff = payload.staff;
  }

  await update(stageRef, updates);
}

/**
 * Assign or remove a staff member from a stage
 */
export async function updateStageStaff(
  firebaseApp: FirebaseApp,
  payload: UpdateStageStaffPayload
): Promise<void> {
  const db = getDB(firebaseApp);
  const staffPath = `xoxo/orders/${payload.orderId}/products/${payload.productId}/stages/${payload.stageKey}/staff/${payload.staffId}`;
  const staffRef = ref(db, staffPath);

  if (payload.action === 'add') {
    await set(staffRef, true);
  } else {
    await remove(staffRef);
  }

  // Update timestamp
  const stagePath = `xoxo/orders/${payload.orderId}/products/${payload.productId}/stages/${payload.stageKey}`;
  const stageRef = ref(db, stagePath);
  await update(stageRef, { updatedAt: Date.now() });
}

/**
 * Delete an order
 */
export async function deleteOrder(
  firebaseApp: FirebaseApp,
  orderId: string
): Promise<void> {
  const db = getDB(firebaseApp);
  const orderRef = ref(db, `xoxo/orders/${orderId}`);
  await remove(orderRef);
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  firebaseApp: FirebaseApp,
  orderId: string,
  status: 'draft' | 'active' | 'completed' | 'cancelled'
): Promise<void> {
  const db = getDB(firebaseApp);
  const orderRef = ref(db, `xoxo/orders/${orderId}`);
  await update(orderRef, {
    status,
    updatedAt: Date.now(),
  });
}
