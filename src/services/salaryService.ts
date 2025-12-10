import {
  FirebaseSalaryConfigs,
  SalaryConfig,
  SalaryTemplate
} from "@/types/salary";
import {
  get,
  getDatabase,
  onValue,
  ref,
  remove,
  set,
  update,
} from "firebase/database";

const db = getDatabase();
const SALARIES_PATH = "xoxo/salaries";
const SALARY_TEMPLATES_PATH = "xoxo/salaryTemplates";

// Helper function to remove undefined values from object
function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}

export class SalaryService {
  // ========== SALARY CONFIGURATIONS ==========

  static async getSalaryByMemberId(
    memberId: string
  ): Promise<SalaryConfig | null> {
    const snapshot = await get(ref(db, `${SALARIES_PATH}/${memberId}`));
    const data = snapshot.val();
    return data || null;
  }

  static async setSalary(
    memberId: string,
    salary: SalaryConfig
  ): Promise<void> {
    const now = new Date().getTime();
    const salaryData = removeUndefined({
      ...salary,
      updatedAt: now,
      createdAt: salary.createdAt || now,
    });
    await set(ref(db, `${SALARIES_PATH}/${memberId}`), salaryData);
  }

  static async updateSalary(
    memberId: string,
    salary: Partial<SalaryConfig>
  ): Promise<void> {
    const salaryData = removeUndefined({
      ...salary,
      updatedAt: new Date().getTime(),
    });
    await update(ref(db, `${SALARIES_PATH}/${memberId}`), salaryData);
  }

  static async deleteSalary(memberId: string): Promise<void> {
    await remove(ref(db, `${SALARIES_PATH}/${memberId}`));
  }

  static onSalarySnapshot(
    callback: (salaries: FirebaseSalaryConfigs) => void
  ): () => void {
    const salariesRef = ref(db, SALARIES_PATH);
    const unsubscribe = onValue(salariesRef, (snapshot) => {
      const data = snapshot.val() || {};
      callback(data);
    });
    return unsubscribe;
  }

  // ========== SALARY TEMPLATES ==========

  static async getAllTemplates(): Promise<SalaryTemplate[]> {
    const snapshot = await get(ref(db, SALARY_TEMPLATES_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data).map(([id, template]) => ({
      id,
      ...(template as Omit<SalaryTemplate, "id">),
    }));
  }

  static async getTemplateById(id: string): Promise<SalaryTemplate | null> {
    const snapshot = await get(ref(db, `${SALARY_TEMPLATES_PATH}/${id}`));
    const data = snapshot.val();
    return data ? { id, ...data } : null;
  }

  static async createTemplate(
    template: Omit<SalaryTemplate, "id" | "createdAt" | "updatedAt">
  ): Promise<SalaryTemplate> {
    const now = new Date().getTime();
    const templateId = `TEMPLATE_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const templateData = removeUndefined({
      ...template,
      id: templateId,
      createdAt: now,
      updatedAt: now,
    });
    await set(
      ref(db, `${SALARY_TEMPLATES_PATH}/${templateId}`),
      templateData
    );
    return templateData as SalaryTemplate;
  }

  static async updateTemplate(
    id: string,
    template: Partial<Omit<SalaryTemplate, "id" | "createdAt">>
  ): Promise<void> {
    const templateData = removeUndefined({
      ...template,
      updatedAt: new Date().getTime(),
    });
    await update(ref(db, `${SALARY_TEMPLATES_PATH}/${id}`), templateData);
  }

  static async deleteTemplate(id: string): Promise<void> {
    await remove(ref(db, `${SALARY_TEMPLATES_PATH}/${id}`));
  }

  static onTemplatesSnapshot(
    callback: (templates: SalaryTemplate[]) => void
  ): () => void {
    const templatesRef = ref(db, SALARY_TEMPLATES_PATH);
    const unsubscribe = onValue(templatesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const templates = Object.entries(data).map(([id, template]) => ({
        id,
        ...(template as Omit<SalaryTemplate, "id">),
      }));
      callback(templates);
    });
    return unsubscribe;
  }
}
