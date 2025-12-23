/**
 * PROCESS TEMPLATE TYPES
 *
 * Defines the 4-level hierarchy for workflow management:
 * 1. Process Template (Quy trình) - e.g., "Quy trình xi mạ vàng 18k"
 * 2. Stage (Giai đoạn) - e.g., "Loại bỏ lớp mạ cũ", "Đánh bóng cơ & bù kim loại"
 * 3. Task (Công việc) - e.g., "Ngâm sản phẩm trong nước bóc Au chuyên dụng..."
 * 4. Product (Sản phẩm) - Products from orders that run through these processes
 */

/**
 * Process Task - A single task within a stage
 */
export interface ProcessTask {
  id: string;
  taskOrder: number;
  name: string;
  description?: string;
  required?: boolean;
  imageUrl?: string;
  videoUrl?: string;
}

/**
 * Process Stage - A stage within a process template
 */
export interface ProcessStage {
  id: string;
  stageOrder: number;
  name: string;
  description?: string;
  departmentCode: string;
  departmentName: string;
  tasks: ProcessTask[];
  expectedDurationHours?: number;
}

/**
 * Process Template - Main template structure
 * This is the top-level template that defines a complete process
 */
export interface ProcessTemplate {
  id: string;
  code: string;
  name: string;
  description?: string;
  stages: ProcessStage[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Firebase storage structure for process templates
 */
export interface FirebaseProcessTemplates {
  [templateId: string]: Omit<ProcessTemplate, 'id'>;
}

/**
 * Process Template for form/UI operations
 */
export interface ProcessTemplateFormData {
  code: string;
  name: string;
  description?: string;
  stages: ProcessStage[];
}

