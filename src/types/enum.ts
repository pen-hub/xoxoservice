export enum DiscountType {
  Amount = "amount",
  Percentage = "percentage",
}

export enum CustomerSource {
  Facebook = "facebook",
  Zalo = "zalo",
  Instagram = "instagram",
  Tiktok = "tiktok",
  Website = "website",
  Referral = "referral",
  WalkIn = "walk_in",
  Phone = "phone",
  Other = "other",
}

export const CustomerSourceOptions = [
  { label: "Facebook", value: CustomerSource.Facebook },
  { label: "Zalo", value: CustomerSource.Zalo },
  { label: "Instagram", value: CustomerSource.Instagram },
  { label: "TikTok", value: CustomerSource.Tiktok },
  { label: "Website", value: CustomerSource.Website },
  { label: "Giới thiệu", value: CustomerSource.Referral },
  { label: "Đến trực tiếp", value: CustomerSource.WalkIn },
  { label: "Điện thoại", value: CustomerSource.Phone },
  { label: "Khác", value: CustomerSource.Other },
];

export enum ROLES {
  sales = "sales",
  // Marketing = "marketing",
  development = "development",
  // HR = "hr",
  admin = "admin",
  // Accountant = "accountant",
  worker = "worker",
}

export const RolesOptions = [
  { label: "Bán hàng", value: ROLES.sales },
  // { label: "Tiếp thị", value: ROLES.Marketing },
  { label: "Dev", value: ROLES.development },
  // { label: "Nhân sự", value: ROLES.HR },
  { label: "Quản trị", value: ROLES.admin },
  // { label: "Kế toán", value: ROLES.Accountant },
  { label: "Công nhân", value: ROLES.worker },
]

export const RoleLabels: Record<ROLES, string> = {
  admin: "Quản trị",
  // accountant: "Kế toán",
  sales: "NV bán hàng",
  worker: "Công nhân",
  // marketing: "Tiếp thị",
  development: "Dev",
  // hr: "Nhân sự",
};

export enum LeadStatus {
  Considering = "considering", // Cân nhắc
  WaitingForPhotos = "waiting_for_photos", // Hẹn gửi ảnh
  WaitingForVisit = "waiting_for_visit", // Hẹn qua
  WaitingForItems = "waiting_for_items", // Hẹn gửi đồ
  NotInterested = "not_interested", // Không quan tâm
  Cancel = "cancel", // Cancel
}

export const LeadStatusOptions = [
  { label: "Cân nhắc", value: LeadStatus.Considering },
  { label: "Hẹn gửi ảnh", value: LeadStatus.WaitingForPhotos },
  { label: "Hẹn qua", value: LeadStatus.WaitingForVisit },
  { label: "Hẹn gửi đồ", value: LeadStatus.WaitingForItems },
  { label: "Không quan tâm", value: LeadStatus.NotInterested },
  { label: "Cancel", value: LeadStatus.Cancel },
];

export const LeadStatusLabels: Record<LeadStatus, string> = {
  [LeadStatus.Considering]: "Cân nhắc",
  [LeadStatus.WaitingForPhotos]: "Hẹn gửi ảnh",
  [LeadStatus.WaitingForVisit]: "Hẹn qua",
  [LeadStatus.WaitingForItems]: "Hẹn gửi đồ",
  [LeadStatus.NotInterested]: "Không quan tâm",
  [LeadStatus.Cancel]: "Cancel",
};

export type IOption ={
    label: string;
    value: string;
}

export enum Unit {
  Cai = "cai",
  Hop = "hop",
  Thung = "thung",
  Cuon = "cuon",
  Bo = "bo",

  Kg = "kg",
  G = "g",
  Mg = "mg",
  Tan = "tan",

  Lit = "lit",
  Ml = "ml",
  M3 = "m3",

  M = "m",
  Cm = "cm",
  Mm = "mm",

  M2 = "m2",
  Cm2 = "cm2",

  Tam = "tam",
  Bao = "bao",
  Palette = "palette",
}



export const unitOptions = [
  // Số lượng
  { label: "Cái", value: Unit.Cai, description: "Đơn vị đếm chung cho sản phẩm rời." },
  { label: "Hộp", value: Unit.Hop, description: "Bao bì chứa nhiều cái, phù hợp sản phẩm đóng gói." },
  { label: "Thùng", value: Unit.Thung, description: "Đơn vị lớn chứa số lượng nhiều, thường dùng trong nhập kho." },
  { label: "Cuộn", value: Unit.Cuon, description: "Áp dụng cho dây, vải, bao bì dạng cuộn." },
  { label: "Bộ", value: Unit.Bo, description: "Một nhóm phụ kiện hay sản phẩm đi kèm." },

  // Khối lượng
  { label: "Kilogram (kg)", value: Unit.Kg, description: "Đơn vị khối lượng chính, phổ biến nhất trong kho." },
  { label: "Gram (g)", value: Unit.G, description: "Đơn vị khối lượng nhỏ, dùng cho vật liệu nhẹ." },
  { label: "Milligram (mg)", value: Unit.Mg, description: "Dùng cho nguyên liệu cực nhỏ, phòng thí nghiệm." },
  { label: "Tấn (t)", value: Unit.Tan, description: "Dùng cho hàng nặng số lượng lớn như vật liệu xây dựng." },

  // Thể tích
  { label: "Lít (L)", value: Unit.Lit, description: "Dùng cho chất lỏng: hóa chất, sơn, nước, dầu." },
  { label: "Milliliter (ml)", value: Unit.Ml, description: "Đơn vị thể tích nhỏ, sản phẩm dung dịch nhỏ." },
  { label: "Mét khối (m³)", value: Unit.M3, description: "Dùng cho vật liệu khối lớn: cát, đá, gas." },

  // Chiều dài
  { label: "Mét (m)", value: Unit.M, description: "Đơn vị chiều dài chuẩn, dùng cho dây, ống, vải." },
  { label: "Centimet (cm)", value: Unit.Cm, description: "Đo chiều dài nhỏ hơn, dùng trong nội thất." },
  { label: "Milimet (mm)", value: Unit.Mm, description: "Độ chính xác cao cho vật liệu kỹ thuật." },

  // Diện tích
  { label: "Mét vuông (m²)", value: Unit.M2, description: "Dùng cho gạch, kính, tôn, sàn gỗ." },
  { label: "Centimet vuông (cm²)", value: Unit.Cm2, description: "Dùng cho bề mặt nhỏ, tấm mẫu." },

  // Đặc thù ngành
  { label: "Tấm", value: Unit.Tam, description: "Dùng cho tôn, mica, gỗ ép, ván." },
  { label: "Bao", value: Unit.Bao, description: "Bao chứa vật liệu nặng như xi măng, gạo." },
  { label: "Palette", value: Unit.Palette, description: "Đơn vị chuẩn cho hàng lưu kho dạng khối lớn." },
];
