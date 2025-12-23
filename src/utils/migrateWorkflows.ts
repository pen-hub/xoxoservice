/**
 * Migration Utility for Workflows
 *
 * This utility helps migrate existing workflow data to the new process template structure.
 * It converts legacy FirebaseWorkflowData to ProductProcessInstance structure.
 */

import type { FirebaseWorkflowData } from "@/types/order";
import type {
  ProductProcessInstance,
  StageInstance,
  TaskInstance,
} from "@/types/processInstance";
import type { ProcessTemplate } from "@/types/processTemplate";
import { ProcessTemplateService } from "@/services/processTemplateService";

/**
 * Convert legacy workflow data to a process template
 * This creates a basic process template from existing workflow data
 */
export async function convertWorkflowToProcessTemplate(
  workflowCode: string,
  workflowData: FirebaseWorkflowData,
): Promise<ProcessTemplate | null> {
  try {
    // Check if template already exists
    const existing = await ProcessTemplateService.getById(workflowCode);
    if (existing) {
      return existing;
    }

    // Create a basic process template from workflow data
    const template: Omit<ProcessTemplate, "id" | "createdAt" | "updatedAt"> = {
      code: workflowCode,
      name: workflowData.workflowName.join(", ") || `Quy trình ${workflowCode}`,
      description: `Quy trình được chuyển đổi từ workflow cũ: ${workflowCode}`,
      stages: [
        {
          id: `stage_${workflowCode}_1`,
          stageOrder: 1,
          name: workflowData.workflowName[0] || "Giai đoạn 1",
          description: "Giai đoạn được chuyển đổi từ workflow cũ",
          departmentCode: workflowData.departmentCode || "",
          departmentName: workflowData.departmentCode || "Chưa xác định",
          tasks: (workflowData.checklist || []).map((task, index) => ({
            id: task.id || `task_${workflowCode}_${index + 1}`,
            taskOrder: task.task_order || index + 1,
            name: task.task_name,
            description: task.notes,
            required: true,
          })),
        },
      ],
    };

    const created = await ProcessTemplateService.create(template);
    return created;
  } catch (error) {
    console.error("Error converting workflow to process template:", error);
    return null;
  }
}

/**
 * Convert legacy workflow data to process instance
 */
export function convertWorkflowToProcessInstance(
  workflowId: string,
  workflowData: FirebaseWorkflowData,
  processTemplateId: string,
  processOrder: number,
): ProductProcessInstance {
  const now = Date.now();

  // Convert checklist to tasks
  const tasks: TaskInstance[] = (workflowData.checklist || []).map((task) => ({
    taskId: task.id,
    taskOrder: task.task_order,
    name: task.task_name,
    checked: task.checked,
    checkedBy: task.checked_by,
    checkedByName: task.checkedByName,
    checkedAt: task.checked_at,
    notes: task.notes,
  }));

  // Create stage instance
  const stage: StageInstance = {
    stageId: `stage_${workflowId}_1`,
    stageOrder: 1,
    name: workflowData.workflowName[0] || "Giai đoạn 1",
    status: workflowData.isDone ? "completed" : tasks.some((t) => t.checked) ? "in_progress" : "pending",
    tasks,
    assignedMembers: workflowData.members || [],
    consultantId: workflowData.consultantId,
    updatedAt: workflowData.updatedAt || now,
    startedAt: tasks.some((t) => t.checked) ? now : undefined,
    completedAt: workflowData.isDone ? now : undefined,
  };

  // Create process instance
  const processInstance: ProductProcessInstance = {
    processTemplateId,
    processTemplateName: workflowData.workflowName.join(", ") || `Quy trình ${workflowId}`,
    processOrder,
    currentStageId: stage.stageId,
    currentStageOrder: 1,
    stages: [stage],
    status: workflowData.isDone ? "completed" : stage.status === "in_progress" ? "in_progress" : "pending",
    updatedAt: workflowData.updatedAt || now,
    startedAt: stage.startedAt,
    completedAt: workflowData.isDone ? now : undefined,
  };

  return processInstance;
}

/**
 * Migrate a product's workflows to process instances
 * This function should be called when migrating a product from old to new structure
 */
export async function migrateProductWorkflows(
  productWorkflows: Record<string, FirebaseWorkflowData>,
): Promise<{
  processInstances: Record<string, ProductProcessInstance>;
  processTemplateSequence: string[];
}> {
  const processInstances: Record<string, ProductProcessInstance> = {};
  const processTemplateSequence: string[] = [];

  // Convert each workflow to a process template and instance
  for (const [workflowId, workflowData] of Object.entries(productWorkflows)) {
    // Try to create or get process template
    const template = await convertWorkflowToProcessTemplate(
      workflowId,
      workflowData,
    );

    if (template) {
      const instanceId = `proc_${template.id}_${processTemplateSequence.length + 1}`;
      const processInstance = convertWorkflowToProcessInstance(
        workflowId,
        workflowData,
        template.id,
        processTemplateSequence.length + 1,
      );

      processInstances[instanceId] = processInstance;
      processTemplateSequence.push(template.id);
    }
  }

  return {
    processInstances,
    processTemplateSequence,
  };
}

/**
 * Check if a product needs migration
 */
export function needsMigration(product: {
  workflows?: Record<string, FirebaseWorkflowData>;
  processInstances?: Record<string, ProductProcessInstance>;
}): boolean {
  // If product has workflows but no processInstances, it needs migration
  return (
    product.workflows !== undefined &&
    Object.keys(product.workflows).length > 0 &&
    (product.processInstances === undefined ||
      Object.keys(product.processInstances).length === 0)
  );
}

