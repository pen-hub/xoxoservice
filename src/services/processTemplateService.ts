import { getDatabase, ref, get, set, update, remove, onValue } from "firebase/database";
import type { ProcessTemplate, FirebaseProcessTemplates } from "@/types/processTemplate";
import { genCode } from "@/utils/genCode";

const PROCESS_TEMPLATES_PATH = "xoxo/process_templates";

/**
 * Process Template Service
 * Handles CRUD operations for process templates
 */
export class ProcessTemplateService {
  /**
   * Get all process templates
   */
  static async getAll(): Promise<ProcessTemplate[]> {
    const db = getDatabase();
    const snapshot = await get(ref(db, PROCESS_TEMPLATES_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data).map(([id, template]) => ({
      id,
      ...(template as Omit<ProcessTemplate, "id">),
    }));
  }

  /**
   * Get a process template by ID
   */
  static async getById(id: string): Promise<ProcessTemplate | null> {
    const db = getDatabase();
    const snapshot = await get(ref(db, `${PROCESS_TEMPLATES_PATH}/${id}`));
    const data = snapshot.val();
    if (!data) return null;
    return { id, ...data };
  }

  /**
   * Create a new process template
   */
  static async create(
    template: Omit<ProcessTemplate, "id" | "code" | "createdAt" | "updatedAt">,
  ): Promise<ProcessTemplate> {
    const db = getDatabase();
    const now = Date.now();
    const code = genCode("PROC_");
    const id = code;

    const templateData: Omit<ProcessTemplate, "id"> = {
      code,
      ...template,
      createdAt: now,
      updatedAt: now,
    };

    await set(ref(db, `${PROCESS_TEMPLATES_PATH}/${id}`), templateData);

    return { id, ...templateData };
  }

  /**
   * Update an existing process template
   */
  static async update(
    id: string,
    updates: Partial<Omit<ProcessTemplate, "id" | "code" | "createdAt">>,
  ): Promise<void> {
    const db = getDatabase();
    const updateData = {
      ...updates,
      updatedAt: Date.now(),
    };
    await update(ref(db, `${PROCESS_TEMPLATES_PATH}/${id}`), updateData);
  }

  /**
   * Delete a process template
   */
  static async delete(id: string): Promise<void> {
    const db = getDatabase();
    await remove(ref(db, `${PROCESS_TEMPLATES_PATH}/${id}`));
  }

  /**
   * Subscribe to process templates changes
   * Returns an unsubscribe function
   */
  static onSnapshot(
    callback: (templates: ProcessTemplate[]) => void,
  ): () => void {
    const db = getDatabase();
    const templatesRef = ref(db, PROCESS_TEMPLATES_PATH);
    const unsubscribe = onValue(templatesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const templates = Object.entries(data).map(([id, template]) => ({
        id,
        ...(template as Omit<ProcessTemplate, "id">),
      }));
      callback(templates);
    });

    return unsubscribe;
  }

  /**
   * Get process templates by department code
   */
  static async getByDepartment(
    departmentCode: string,
  ): Promise<ProcessTemplate[]> {
    const allTemplates = await this.getAll();
    return allTemplates.filter((template) =>
      template.stages.some((stage) => stage.departmentCode === departmentCode),
    );
  }
}

