import {
    SalaryTemplate,
    SalaryType
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
const MEMBERS_PATH = "xoxo/members";
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
  // ========== SALARY CONFIGURATIONS (stored in xoxo/members) ==========

  static async getSalaryByMemberId(
    memberId: string
  ): Promise<{ salaryType?: SalaryType; salaryAmount?: number; bonusPercentage?: number; salaryTemplateId?: string } | null> {
    const snapshot = await get(ref(db, `${MEMBERS_PATH}/${memberId}`));
    const member = snapshot.val();
    if (!member) return null;

    return {
      salaryType: member.salaryType,
      salaryAmount: member.salaryAmount,
      bonusPercentage: member.bonusPercentage ?? 0,
      salaryTemplateId: member.salaryTemplateId,
    };
  }

  static async setSalary(
    memberId: string,
    salary: { salaryType: SalaryType; salaryAmount: number; bonusPercentage?: number; salaryTemplateId?: string }
  ): Promise<void> {
    const salaryData = removeUndefined({
      salaryType: salary.salaryType,
      salaryAmount: salary.salaryAmount,
      bonusPercentage: salary.bonusPercentage ?? 0,
      salaryTemplateId: salary.salaryTemplateId,
      updatedAt: new Date().getTime(),
    });
    await update(ref(db, `${MEMBERS_PATH}/${memberId}`), salaryData);
  }

  // Get all members that use a specific template
  static async getMembersByTemplateId(templateId: string): Promise<string[]> {
    const snapshot = await get(ref(db, MEMBERS_PATH));
    const members = snapshot.val() || {};
    const memberIds: string[] = [];

    Object.entries(members).forEach(([id, member]: [string, any]) => {
      if (member.salaryTemplateId === templateId) {
        memberIds.push(id);
      }
    });

    return memberIds;
  }

  static async updateSalary(
    memberId: string,
    salary: Partial<{ salaryType: SalaryType; salaryAmount: number; bonusPercentage?: number }>
  ): Promise<void> {
    const salaryData = removeUndefined({
      ...salary,
      bonusPercentage: salary.bonusPercentage ?? 0,
      updatedAt: new Date().getTime(),
    });
    await update(ref(db, `${MEMBERS_PATH}/${memberId}`), salaryData);
  }

  static async deleteSalary(memberId: string): Promise<void> {
    await update(ref(db, `${MEMBERS_PATH}/${memberId}`), {
      salaryType: null,
      salaryAmount: null,
      bonusPercentage: null,
      updatedAt: new Date().getTime(),
    });
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
    const templateData = {
      name: template.name,
      salaryType: template.salaryType,
      salaryAmount: template.salaryAmount,
      bonusPercentage: template.bonusPercentage ?? 0,
      id: templateId,
      createdAt: now,
      updatedAt: now,
    };
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
      bonusPercentage: template.bonusPercentage ?? 0,
      updatedAt: new Date().getTime(),
    });
    await update(ref(db, `${SALARY_TEMPLATES_PATH}/${id}`), templateData);

    // Update all members that use this template
    const memberIds = await this.getMembersByTemplateId(id);
    const updatePromises = memberIds.map((memberId) =>
      update(ref(db, `${MEMBERS_PATH}/${memberId}`), {
        salaryType: template.salaryType ?? undefined,
        salaryAmount: template.salaryAmount ?? undefined,
        bonusPercentage: template.bonusPercentage ?? 0,
        updatedAt: new Date().getTime(),
      })
    );
    await Promise.all(updatePromises);
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

