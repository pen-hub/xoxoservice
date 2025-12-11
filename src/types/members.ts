import { ROLES } from "@/types/enum";
import { SalaryType } from "@/types/salary";

export interface IMembers {
  code: string;
  id: string;
  name: string;
  phone: string;
  email: string;
  role: ROLES;
  departments?: string[]; // Array of department codes (only for worker role)
  date_of_birth: string;
  isActive?: boolean;
  // Salary fields
  salaryType?: SalaryType; // Loại lương
  salaryAmount?: number; // Mức lương
  bonusPercentage?: number; // Phần trăm triết khấu (mặc định 0)
  salaryTemplateId?: string; // ID của mẫu lương nếu áp dụng
  createdAt?: number;
  updatedAt?: number;
}

