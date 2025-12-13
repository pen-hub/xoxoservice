import { CustomerSource, CustomerSourceOptions } from "@/types/enum";

export const getSourceColor = (source: CustomerSource): string => {
    const colors: Record<CustomerSource, string> = {
        [CustomerSource.Facebook]: "blue",
        [CustomerSource.Zalo]: "cyan",
        [CustomerSource.Instagram]: "magenta",
        [CustomerSource.Tiktok]: "purple",
        [CustomerSource.Website]: "green",
        [CustomerSource.Referral]: "gold",
        [CustomerSource.WalkIn]: "orange",
        [CustomerSource.Phone]: "volcano",
        [CustomerSource.Other]: "default",
    };
    return colors[source] || "default";
};

export const getSourceLabel = (source: CustomerSource): string => {
    const option = CustomerSourceOptions.find((opt) => opt.value === source);
    return option?.label || source;
};

export const getCustomerTypeLabel = (
    type?: "individual" | "enterprise",
): string => {
    if (!type) return "-";
    return type === "individual" ? "Cá nhân" : "Doanh nghiệp";
};

export const getGenderLabel = (gender?: "male" | "female"): string => {
    if (!gender) return "-";
    return gender === "male" ? "Nam" : "Nữ";
};

