export interface Category {
  code: string;
  name: string;
  description?: string;
  color?: string; // Màu hiển thị cho tag
  parentCode?: string; // Mã danh mục cha
  children?: Category[]; // Danh sách danh mục con (không lưu vào DB, chỉ để hiển thị)
  createdAt?: number;
  updatedAt?: number;
}

