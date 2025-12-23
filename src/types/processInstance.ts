/**
 * PROCESS INSTANCE TYPES
 *
 * These types represent running instances of process templates on actual products.
 * Each product can have multiple process instances (sequential or parallel).
 */

/**
 * Task Instance - A running instance of a task from a process template
 */
export interface TaskInstance {
  taskId: string;
  taskOrder: number;
  name: string;
  checked: boolean;
  checkedBy?: string;
  checkedByName?: string;
  checkedAt?: number;
  notes?: string;
}

/**
 * Stage Instance - A running instance of a stage from a process template
 */
export interface StageInstance {
  stageId: string;
  stageOrder: number;
  name: string;
  status: "pending" | "in_progress" | "completed";
  tasks: TaskInstance[];
  assignedMembers: string[];
  consultantId?: string;
  consultantName?: string;
  startedAt?: number;
  completedAt?: number;
  updatedAt: number;
}

/**
 * Product Process Instance - A running instance of a process template on a product
 */
export interface ProductProcessInstance {
  processTemplateId: string;
  processTemplateName: string;
  processOrder: number; // Order of this process in the sequence (1, 2, 3...)
  currentStageId?: string;
  currentStageOrder?: number;
  stages: StageInstance[];
  status: "pending" | "in_progress" | "completed";
  startedAt?: number;
  completedAt?: number;
  updatedAt: number;
}

/**
 * Firebase storage structure for process instances in products
 */
export interface FirebaseProductProcessInstances {
  [instanceId: string]: ProductProcessInstance;
}

/**
 * Legacy workflow data structure (for backward compatibility)
 * This will be gradually replaced by ProductProcessInstance
 */
export interface LegacyWorkflowData {
  departmentCode?: string;
  workflowCode: string[];
  workflowName: string[];
  members: string[];
  consultantId?: string;
  isDone: boolean;
  updatedAt: number;
  checklist?: ChecklistTask[];
}

/**
 * Checklist task (legacy format, used in current system)
 */
export interface ChecklistTask {
  id: string;
  task_name: string;
  task_order: number;
  checked: boolean;
  checked_by?: string;
  checkedByName?: string;
  checked_at?: number;
  notes?: string;
}

