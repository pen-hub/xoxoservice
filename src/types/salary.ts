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
  name: string; // Tên mẫu lương
  salaryType: SalaryType; // Loại lương
  salaryAmount: number; // Mức lương
  bonusPercentage: number; // Phần trăm triết khấu (mặc định 0)
  createdAt?: number;
  updatedAt?: number;
}

// Export enum for use in other files

export interface FirebaseSalaryConfigs {
  [memberId: string]: SalaryConfig;
}

export interface FirebaseSalaryTemplates {
  [templateId: string]: SalaryTemplate;
}

// Commission Rule for salary setup
export interface CommissionRule {
  id: string;
  type: "service_execution" | "sales_consultation"; // Loại hình: Thực hiện dịch vụ, Tư vấn bán hàng
  revenueFrom: number; // Doanh thu từ
  commissionType: "general_table" | "custom"; // Hoa hồng thụ hưởng: Bảng hoa hồng chung hoặc tùy chỉnh
  commissionValue?: number; // Giá trị hoa hồng nếu custom
  createdAt?: number;
  updatedAt?: number;
}

// Allowance item
export interface AllowanceItem {
  id: string;
  name: string; // Tên phụ cấp (ăn trưa, đi lại, điện thoại, ...)
  amount: number; // Số tiền
  type: "fixed" | "daily" | "monthly"; // Loại: cố định, theo ngày, theo tháng
  createdAt?: number;
  updatedAt?: number;
}

// Deduction item
export interface DeductionItem {
  id: string;
  name: string; // Tên giảm trừ (đi muộn, về sớm, vi phạm nội quy, ...)
  amount: number; // Số tiền
  type: "fixed" | "per_occurrence"; // Loại: cố định, theo lần vi phạm
  createdAt?: number;
  updatedAt?: number;
}

// Extended Salary Config with commission, allowances, deductions
export interface ExtendedSalaryConfig extends SalaryConfig {
  enableCommission?: boolean; // Bật hoa hồng
  commissionRules?: CommissionRule[]; // Danh sách quy tắc hoa hồng
  enableAllowance?: boolean; // Bật phụ cấp
  allowances?: AllowanceItem[]; // Danh sách phụ cấp
  enableDeduction?: boolean; // Bật giảm trừ
  deductions?: DeductionItem[]; // Danh sách giảm trừ
}

