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
  // New fields from UI requirements
  avatar?: string; // URL to employee photo
  idCard?: string; // Số CMND/CCCD
  gender?: "male" | "female"; // Giới tính
  province?: string; // Tỉnh/Thành phố
  ward?: string; // Xã/Phường/Đặc khu
  address?: string; // Địa chỉ chi tiết
  facebook?: string; // Facebook link
  timesheetCode?: string; // Mã chấm công
  debt?: number; // Nợ và tạm ứng
  notes?: string; // Ghi chú
  payrollBranch?: string; // Chi nhánh trả lương
  workingBranches?: string[]; // Chi nhánh làm việc (có thể nhiều)
  position?: string; // Chức danh
  startDate?: string; // Ngày bắt đầu làm việc (YYYY-MM-DD)
  loginAccount?: string; // Tài khoản đăng nhập (user ID)
  // Thông số tính lương
  lateHours?: number; // Số giờ đi muộn
  approvedLeaveDays?: number; // Ngày nghỉ có phép
  unapprovedLeaveDays?: number; // Nghỉ không phép
  totalFines?: number; // Tổng tiền phạt
  totalRevenue?: number; // Tổng doanh số
  totalCommission?: number; // Tổng thưởng hoa hồng
  createdAt?: number;
  updatedAt?: number;
}

