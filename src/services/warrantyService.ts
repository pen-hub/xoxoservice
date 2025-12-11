import {
  WarrantyRecord
} from "@/types/warranty";
import { genCode } from "@/utils/genCode";
import dayjs from "dayjs";
import {
  get,
  getDatabase,
  onValue,
  ref,
  remove,
  set,
  update,
} from "firebase/database";

const db = getDatabase();
const WARRANTY_PATH = "xoxo/warranty";

// Helper function to remove undefined values
function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}

export class WarrantyService {
  static async getAll(): Promise<WarrantyRecord[]> {
    const snapshot = await get(ref(db, WARRANTY_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data).map(([id, warranty]) => ({
      id,
      ...(warranty as Omit<WarrantyRecord, "id">),
    }));
  }

  static async getById(id: string): Promise<WarrantyRecord | null> {
    const snapshot = await get(ref(db, `${WARRANTY_PATH}/${id}`));
    const data = snapshot.val();
    return data ? { id, ...data } : null;
  }

  static async getByOrderCode(orderCode: string): Promise<WarrantyRecord[]> {
    const snapshot = await get(ref(db, WARRANTY_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data)
      .filter(
        ([_, warranty]) =>
          (warranty as WarrantyRecord).orderCode === orderCode
      )
      .map(([id, warranty]) => ({
        id,
        ...(warranty as Omit<WarrantyRecord, "id">),
      }));
  }

  static async getByCustomerId(
    customerId: string
  ): Promise<WarrantyRecord[]> {
    const snapshot = await get(ref(db, WARRANTY_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data)
      .filter(
        ([_, warranty]) =>
          (warranty as WarrantyRecord).customerId === customerId
      )
      .map(([id, warranty]) => ({
        id,
        ...(warranty as Omit<WarrantyRecord, "id">),
      }));
  }

  // Get warranties expiring soon (within next 30 days)
  static async getExpiringSoon(days: number = 30): Promise<WarrantyRecord[]> {
    const all = await this.getAll();
    const now = Date.now();
    const expiryThreshold = now + days * 24 * 60 * 60 * 1000;
    return all.filter(
      (w) => w.endDate > now && w.endDate <= expiryThreshold
    );
  }

  // Check if warranty is valid
  static isWarrantyValid(warranty: WarrantyRecord): boolean {
    const now = Date.now();
    return now >= warranty.startDate && now <= warranty.endDate;
  }

  // Auto-create warranty when order is completed
  static async createWarranty(
    orderId: string,
    orderCode: string,
    productId: string | undefined,
    productName: string,
    customerId: string | undefined,
    customerName: string,
    customerPhone: string,
    warrantyPeriodMonths: number = 12, // Default 12 months
    terms: string = "Bảo hành theo tiêu chuẩn XOXO",
    createdBy?: string,
    createdByName?: string
  ): Promise<WarrantyRecord> {
    const now = Date.now();
    const warrantyCode = genCode("WAR_");

    const startDate = now;
    const endDate = dayjs(now).add(warrantyPeriodMonths, "month").valueOf();

    const warrantyData: WarrantyRecord = {
      id: warrantyCode,
      orderId,
      orderCode,
      productId,
      productName,
      customerId,
      customerName,
      customerPhone,
      warrantyPeriod: warrantyPeriodMonths,
      startDate,
      endDate,
      terms,
      createdAt: now,
      updatedAt: now,
      createdBy,
      createdByName,
    };

    await set(ref(db, `${WARRANTY_PATH}/${warrantyCode}`), removeUndefined(warrantyData));
    return warrantyData;
  }

  static async create(
    warranty: Omit<WarrantyRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<WarrantyRecord> {
    const now = new Date().getTime();
    const warrantyCode = genCode("WAR_");

    const warrantyData: WarrantyRecord = {
      ...warranty,
      id: warrantyCode,
      createdAt: now,
      updatedAt: now,
    };

    await set(ref(db, `${WARRANTY_PATH}/${warrantyCode}`), removeUndefined(warrantyData));
    return warrantyData;
  }

  static async update(
    id: string,
    warranty: Partial<Omit<WarrantyRecord, "id" | "createdAt">>
  ): Promise<void> {
    const warrantyData = removeUndefined({
      ...warranty,
      updatedAt: new Date().getTime(),
    });
    await update(ref(db, `${WARRANTY_PATH}/${id}`), warrantyData);
  }

  static async delete(id: string): Promise<void> {
    await remove(ref(db, `${WARRANTY_PATH}/${id}`));
  }

  static onSnapshot(
    callback: (warranties: WarrantyRecord[]) => void
  ): () => void {
    const warrantiesRef = ref(db, WARRANTY_PATH);
    const unsubscribe = onValue(warrantiesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const warranties = Object.entries(data).map(([id, warranty]) => ({
        id,
        ...(warranty as Omit<WarrantyRecord, "id">),
      }));
      callback(warranties);
    });
    return unsubscribe;
  }
}


