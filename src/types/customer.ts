import { CustomerSource } from "./enum";

export interface Customer {
    code: string;
    name: string;
    phone: string;
    email?: string;
    address: string;
    customerSource: CustomerSource;
    dateOfBirth?: number;
    province?: string;
    district?: string;
    ward?: string;
    customerType?: "individual" | "enterprise";
    gender?: "male" | "female";
    customerGroup?: string;
    taxCode?: string;
    facebook?: string;
    notes?: string;
    createdAt: number;
    updatedAt: number;
}

export interface FirebaseCustomers {
    [key: string]: Customer;
}

export interface CustomerGroup {
    code: string;
    name: string;
    createdAt: number;
    updatedAt: number;
}

export interface FirebaseCustomerGroups {
    [key: string]: CustomerGroup;
}

export interface Province {
    code: string;
    name: string;
    districts?: District[];
}

export interface District {
    code: string;
    name: string;
    wards?: Ward[];
}

export interface Ward {
    code: string;
    name: string;
}

