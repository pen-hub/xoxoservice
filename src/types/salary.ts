export enum SalaryType {
  FIXED = "fixed", // Cố định
  BY_SHIFT = "by_shift", // Theo ca làm việc
  BY_HOUR = "by_hour", // Theo giờ làm việc
  BY_DAY = "by_day", // Theo ngày công chuẩn
}

export interface SalaryConfig {
  salaryType: SalaryType;
  salaryAmount: number; // Mức lương (số tiền hoặc số ca/giờ/ngày)
  salaryTemplateId?: string; // ID của mẫu lương nếu áp dụng
  enableRevenueBonus: boolean; // Bật thưởng theo doanh thu
  bonusPercentage?: number; // % thưởng theo doanh thu (nếu enableRevenueBonus = true)
  createdAt?: number;
  updatedAt?: number;
}

export interface SalaryTemplate {
  id: string;
  name: string;
  salaryType: SalaryType;
  salaryAmount: number;
  enableRevenueBonus: boolean;
  bonusPercentage?: number;
  description?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface FirebaseSalaryConfigs {
  [memberId: string]: SalaryConfig;
}

export interface FirebaseSalaryTemplates {
  [templateId: string]: SalaryTemplate;
}
