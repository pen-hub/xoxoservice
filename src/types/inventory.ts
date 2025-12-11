export interface Material {
  id: string;
  name: string;
  category: string;
  stockQuantity: number;
  unit: string;
  minThreshold: number;
  maxCapacity: number;
  expiryDate?: string; // Optional, chỉ cho hàng có hạn sử dụng
  warehouse?: string;
  supplier?: string;
  lastUpdated?: string;
  // Giá nhập nguyên liệu
  importPrice?: number; // Giá nhập mỗi đơn vị
  // Cài đặt thông báo
  longStockAlertDays?: number; // Số ngày tồn quá lâu để cảnh báo (tùy chỉnh)
  createdAt?: number;
  updatedAt?: number;
}

export interface InventoryTransaction {
  code: string;
  materialId: string;
  materialName: string;
  type: "import" | "export"; // Nhập hoặc xuất
  quantity: number;
  unit: string;
  price?: number; // Giá nhập/xuất (nếu có)
  totalAmount?: number; // Tổng tiền = quantity * price
  date: string; // Ngày thực hiện
  warehouse?: string;
  supplier?: string; // Chỉ cho import
  reason?: string; // Lý do xuất (chỉ cho export)
  note?: string;
  createdBy?: string; // Người thực hiện
  createdAt: number;
}

export interface InventorySettings {
  // Cài đặt thông báo mặc định
  defaultLongStockDays: number; // Số ngày tồn quá lâu để cảnh báo (mặc định 90)
  updatedAt?: number;
}

