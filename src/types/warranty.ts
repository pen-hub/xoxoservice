export interface WarrantyRecord {
  id: string;
  orderId: string;
  orderCode: string;
  productId?: string;
  productName: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  warrantyPeriod: number; // Warranty period in months
  startDate: number; // Timestamp when warranty starts
  endDate: number; // Timestamp when warranty ends
  terms: string; // Warranty terms and conditions
  notes?: string;
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  createdByName?: string;
}

export interface FirebaseWarrantyRecords {
  [warrantyId: string]: WarrantyRecord;
}


