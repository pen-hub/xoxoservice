import { getDatabase, ref, update } from "firebase/database";
import type { ProductProcessInstance, StageInstance, TaskInstance } from "@/types/processInstance";
import type { ProcessTemplate } from "@/types/processTemplate";
import { ProcessTemplateService } from "./processTemplateService";

/**
 * Process Flow Service
 * Handles sequential process flow logic and process instance management
 */
export class ProcessFlowService {
  /**
   * Initialize process instances for a product from process templates
   */
  static async initializeProcessInstances(
    orderCode: string,
    productCode: string,
    processTemplateIds: string[],
    type: "order" | "warranty_claim" = "order",
  ): Promise<void> {
    const db = getDatabase();
    const basePath =
      type === "warranty_claim"
        ? `xoxo/warranty_claims/${orderCode}/products/${productCode}`
        : `xoxo/orders/${orderCode}/products/${productCode}`;

    const productRef = ref(db, basePath);
    const now = Date.now();

    // Load all process templates
    const templates = await ProcessTemplateService.getAll();
    const templateMap = new Map(templates.map((t) => [t.id, t]));

    // Create process instances
    const processInstances: Record<string, ProductProcessInstance> = {};

    processTemplateIds.forEach((templateId, index) => {
      const template = templateMap.get(templateId);
      if (!template) {
        console.warn(`Process template ${templateId} not found`);
        return;
      }

      // Initialize stages from template
      const stages: StageInstance[] = template.stages.map((stage) => {
        const tasks: TaskInstance[] = stage.tasks.map((task) => ({
          taskId: task.id,
          taskOrder: task.taskOrder,
          name: task.name,
          checked: false,
        }));

        return {
          stageId: stage.id,
          stageOrder: stage.stageOrder,
          name: stage.name,
          status: index === 0 && stage.stageOrder === 1 ? "pending" : "pending",
          tasks,
          assignedMembers: [],
          updatedAt: now,
        };
      });

      const instanceId = `proc_${templateId}_${index + 1}`;
      processInstances[instanceId] = {
        processTemplateId: templateId,
        processTemplateName: template.name,
        processOrder: index + 1,
        currentStageId: index === 0 ? template.stages[0]?.id : undefined,
        currentStageOrder: index === 0 ? 1 : undefined,
        stages,
        status: index === 0 ? "pending" : "pending",
        updatedAt: now,
      };
    });

    // Update product with process instances
    await update(productRef, {
      processInstances,
      currentProcessId: processTemplateIds[0] || undefined,
      completedProcessIds: [],
      processTemplateSequence: processTemplateIds,
      updatedAt: now,
    });
  }

  /**
   * Start the next process when current process completes
   */
  static async startNextProcess(
    orderCode: string,
    productCode: string,
    type: "order" | "warranty_claim" = "order",
  ): Promise<void> {
    const db = getDatabase();
    const basePath =
      type === "warranty_claim"
        ? `xoxo/warranty_claims/${orderCode}/products/${productCode}`
        : `xoxo/orders/${orderCode}/products/${productCode}`;

    const productRef = ref(db, basePath);

    // Get current product data (we'll need to read it first)
    // For now, we'll update the status in the calling code
    // This is a placeholder for the logic
    await update(productRef, {
      updatedAt: Date.now(),
    });
  }

  /**
   * Complete a stage and move to next stage or process
   */
  static async completeStage(
    orderCode: string,
    productCode: string,
    processInstanceId: string,
    stageId: string,
    type: "order" | "warranty_claim" = "order",
  ): Promise<{ nextStageId?: string; nextProcessId?: string }> {
    const db = getDatabase();
    const basePath =
      type === "warranty_claim"
        ? `xoxo/warranty_claims/${orderCode}/products/${productCode}`
        : `xoxo/orders/${orderCode}/products/${productCode}`;

    const stageRef = ref(
      db,
      `${basePath}/processInstances/${processInstanceId}/stages/${stageId}`,
    );
    const processInstanceRef = ref(
      db,
      `${basePath}/processInstances/${processInstanceId}`,
    );
    const now = Date.now();

    // Update stage status to completed
    await update(stageRef, {
      status: "completed",
      completedAt: now,
      updatedAt: now,
    });

    // Update process instance updatedAt
    await update(processInstanceRef, {
      updatedAt: now,
    });

    // Logic to determine next stage or process will be handled by the caller
    // This is a simplified version
    return {};
  }

  /**
   * Check a task in a stage
   */
  static async checkTask(
    orderCode: string,
    productCode: string,
    processInstanceId: string,
    stageId: string,
    taskId: string,
    checked: boolean,
    checkedBy?: string,
    checkedByName?: string,
    type: "order" | "warranty_claim" = "order",
  ): Promise<void> {
    const db = getDatabase();
    const basePath =
      type === "warranty_claim"
        ? `xoxo/warranty_claims/${orderCode}/products/${productCode}`
        : `xoxo/orders/${orderCode}/products/${productCode}`;

    const taskRef = ref(
      db,
      `${basePath}/processInstances/${processInstanceId}/stages/${stageId}/tasks/${taskId}`,
    );
    const now = Date.now();

    const updates: any = {
      checked,
      updatedAt: now,
    };

    if (checked) {
      updates.checkedAt = now;
      if (checkedBy) updates.checkedBy = checkedBy;
      if (checkedByName) updates.checkedByName = checkedByName;
    } else {
      updates.checkedAt = null;
      updates.checkedBy = null;
      updates.checkedByName = null;
    }

    await update(taskRef, updates);

    // Also update the stage's updatedAt
    const stageRef = ref(
      db,
      `${basePath}/processInstances/${processInstanceId}/stages/${stageId}`,
    );
    await update(stageRef, { updatedAt: now });

    // Update process instance updatedAt
    const processInstanceRef = ref(
      db,
      `${basePath}/processInstances/${processInstanceId}`,
    );
    await update(processInstanceRef, { updatedAt: now });
  }

  /**
   * Assign members to a stage
   */
  static async assignMembersToStage(
    orderCode: string,
    productCode: string,
    processInstanceId: string,
    stageId: string,
    memberIds: string[],
    type: "order" | "warranty_claim" = "order",
  ): Promise<void> {
    const db = getDatabase();
    const basePath =
      type === "warranty_claim"
        ? `xoxo/warranty_claims/${orderCode}/products/${productCode}`
        : `xoxo/orders/${orderCode}/products/${productCode}`;

    const stageRef = ref(
      db,
      `${basePath}/processInstances/${processInstanceId}/stages/${stageId}`,
    );

    await update(stageRef, {
      assignedMembers: memberIds,
      updatedAt: Date.now(),
    });
  }

  /**
   * Get the next process template ID in sequence
   */
  static getNextProcessTemplateId(
    currentProcessId: string,
    processTemplateSequence: string[],
  ): string | null {
    const currentIndex = processTemplateSequence.indexOf(currentProcessId);
    if (currentIndex === -1 || currentIndex === processTemplateSequence.length - 1) {
      return null;
    }
    return processTemplateSequence[currentIndex + 1];
  }

  /**
   * Check if all tasks in a stage are completed
   */
  static areAllTasksCompleted(tasks: TaskInstance[]): boolean {
    if (tasks.length === 0) return false;
    return tasks.every((task) => task.checked);
  }

  /**
   * Check if all stages in a process are completed
   */
  static areAllStagesCompleted(stages: StageInstance[]): boolean {
    if (stages.length === 0) return false;
    return stages.every((stage) => stage.status === "completed");
  }
}

