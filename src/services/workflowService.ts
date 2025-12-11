'use client';

import type {
  CreateOrderPayload,
  Order,
  OrderProduct,
  ProductWorkflow,
  Staff,
  UpdateWorkflowProgressPayload,
  UpdateWorkflowStaffPayload,
  Workflow,
} from '@/types/workflow';
import { genCode } from '@/utils/genCode';
import type { FirebaseApp } from 'firebase/app';
import { getDatabase, ref, remove, set, update } from 'firebase/database';

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate a unique order code (e.g., ORD001, ORD002)
 */
function generateOrderCode(): string {
  const timestamp = new Date().getTime().toString().slice(-6);
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
 * Create a new workflow template
 */
export async function createWorkflow(
  firebaseApp: FirebaseApp,
  workflow: Omit<Workflow, 'id' | 'createdAt'>
): Promise<string> {
  const db = getDB(firebaseApp);
  const workflowCode = genCode("WF_");

  await set(ref(db, `xoxo/workflows/${workflowCode}`), {
    ...workflow,
    createdAt: Date.now(),
  });

  return workflowCode;
}

/**
 * Update a workflow template
 */
export async function updateWorkflow(
  firebaseApp: FirebaseApp,
  workflowCode: string,
  updates: Partial<Omit<Workflow, 'id' | 'createdAt'>>
): Promise<void> {
  const db = getDB(firebaseApp);
  const workflowRef = ref(db, `xoxo/workflows/${workflowCode}`);
  await update(workflowRef, updates);
}

/**
 * Delete a workflow template
 */
export async function deleteWorkflow(
  firebaseApp: FirebaseApp,
  workflowCode: string
): Promise<void> {
  const db = getDB(firebaseApp);
  const workflowRef = ref(db, `xoxo/workflows/${workflowCode}`);
  await remove(workflowRef);
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
  const staffCode = genCode("STAFF_");

  await set(ref(db, `xoxo/staff/${staffCode}`), {
    ...staff,
    createdAt: Date.now(),
  });

  return staffCode;
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
 * Create a new order with products and workflows
 */
export async function createOrder(
  firebaseApp: FirebaseApp,
  payload: CreateOrderPayload,
  workflows: Workflow[]
): Promise<string> {
  const db = getDB(firebaseApp);
  const now = Date.now();
  const orderCode = genCode("ORD_");
  const orderId = genCode("ORD_");

  // Build products with workflows
  const products: { [key: string]: OrderProduct } = {};

  for (const productPayload of payload.products) {
    const productKey = genCode("PROD_"); // Generate unique key

    // Clone workflows from templates
    const productWorkflows: { [key: string]: ProductWorkflow } = {};

    workflows.forEach((workflow, index) => {
      const workflowKey = `workflow${index + 1}`;

      // Convert defaultStaff array to object map
      const staffMap: { [key: string]: boolean } = {};
      if (workflow.defaultStaff) {
        workflow.defaultStaff.forEach((staffId) => {
          staffMap[staffId] = true;
        });
      }

      productWorkflows[workflowKey] = {
        workflowCode: workflow.id,
        name: workflow.name,
        staff: staffMap,
        status: 'pending',
        completedQuantity: 0,
        updatedAt: now,
        order: workflow.order || index,
      };
    });

    products[productKey] = {
      name: productPayload.name,
      quantity: productPayload.quantity,
      price: productPayload.price,
      workflows: productWorkflows,
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

  await set(ref(db, `xoxo/orders/${orderId}`), orderData);

  return orderId;
}

/**
 * Update workflow progress (completedQuantity, status, staff)
 */
export async function updateWorkflowProgress(
  firebaseApp: FirebaseApp,
  payload: UpdateWorkflowProgressPayload
): Promise<void> {
  const db = getDB(firebaseApp);
  const workflowPath = `xoxo/orders/${payload.orderCode}/products/${payload.productId}/workflows/${payload.workflowKey}`;
  const workflowRef = ref(db, workflowPath);

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

  await update(workflowRef, updates);
}

/**
 * Assign or remove a staff member from a workflow
 */
export async function updateWorkflowStaff(
  firebaseApp: FirebaseApp,
  payload: UpdateWorkflowStaffPayload
): Promise<void> {
  const db = getDB(firebaseApp);
  const staffPath = `xoxo/orders/${payload.orderCode}/products/${payload.productId}/workflows/${payload.workflowKey}/staff/${payload.staffId}`;
  const staffRef = ref(db, staffPath);

  if (payload.action === 'add') {
    await set(staffRef, true);
  } else {
    await remove(staffRef);
  }

  // Update timestamp
  const workflowPath = `xoxo/orders/${payload.orderCode}/products/${payload.productId}/workflows/${payload.workflowKey}`;
  const workflowRef = ref(db, workflowPath);
  await update(workflowRef, { updatedAt: Date.now() });
}

/**
 * Delete an order
 */
export async function deleteOrder(
  firebaseApp: FirebaseApp,
  orderCode: string
): Promise<void> {
  const db = getDB(firebaseApp);
  const orderRef = ref(db, `xoxo/orders/${orderCode}`);
  await remove(orderRef);
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  firebaseApp: FirebaseApp,
  orderCode: string,
  status: 'draft' | 'active' | 'completed' | 'cancelled'
): Promise<void> {
  const db = getDB(firebaseApp);
  const orderRef = ref(db, `xoxo/orders/${orderCode}`);
  await update(orderRef, {
    status,
    updatedAt: Date.now(),
  });
}
