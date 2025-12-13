// Service Category Types
export interface ServiceCategory {
    code: string;
    name: string;
    description?: string;
    displayColor?: string;
    parentCode?: string; // For hierarchical structure
    grandparentCode?: string; // Nhóm ông
    childCode?: string; // Nhóm con
    grandchildCode?: string; // Nhóm cháu
    attributes?: string[]; // ML, KG, GRAM, CÁI, CHIẾC...
    createdAt: number;
    updatedAt: number;
}

export interface FirebaseServiceCategories {
    [key: string]: ServiceCategory;
}

// Service (Thẻ tài khoản) Types
export interface Service {
    code: string;
    name: string;
    categoryCode?: string; // Nhóm hàng
    brandCode?: string; // Thương hiệu
    sellingPrice?: number; // Giá bán
    faceValue?: number; // Mệnh giá sử dụng
    paymentScope?: string; // Phạm vi thanh toán
    images?: string[]; // URLs of images
    description?: string; // Rich text description
    notes?: string; // Ghi chú
    createdAt: number;
    updatedAt: number;
}

export interface FirebaseServices {
    [key: string]: Service;
}

// Service Package Item (Dịch vụ trong gói)
export interface ServicePackageItem {
    serviceCode: string;
    serviceName: string;
    numberOfSessions: number; // Số buổi
    costPrice: number; // Giá vốn
    totalCostPrice: number; // Tổng giá vốn
    retailPrice: number; // Giá bán lẻ
    amount: number; // Thành tiền
}

// Service Package (Gói dịch vụ, liệu trình) Types
export interface ServicePackage {
    code: string;
    name: string;
    categoryCode?: string;
    brandCode?: string;
    services: ServicePackageItem[]; // Dịch vụ trong gói
    expirationType?: "UNLIMITED" | "DATE_RANGE" | "FIXED_PERIOD"; // Hạn sử dụng
    expirationDetails?: {
        startDate?: number;
        endDate?: number;
        durationInDays?: number;
    };
    usageTimeType?: "UNLIMITED" | "SPECIFIC_HOURS"; // Thời gian sử dụng
    usageTimeDetails?: {
        dailyStartTime?: string;
        dailyEndTime?: string;
    };
    scheduleType?: "FREE" | "FIXED_SCHEDULE"; // Lịch sử sử dụng
    scheduleDetails?: {
        dates?: number[];
        recurrence?: string;
    };
    sessionInterval?: string; // Mỗi buổi cách nhau
    commissionTables?: number; // Số bảng hoa hồng
    images?: string[];
    description?: string;
    notes?: string;
    createdAt: number;
    updatedAt: number;
}

export interface FirebaseServicePackages {
    [key: string]: ServicePackage;
}

// Brand Types
export interface Brand {
    code: string;
    name: string;
    createdAt: number;
    updatedAt: number;
}

export interface FirebaseBrands {
    [key: string]: Brand;
}

