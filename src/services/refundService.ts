import {
  RefundRequest,
  RefundStatus
} from "@/types/refund";
import { genCode } from "@/utils/genCode";
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
const REFUNDS_PATH = "xoxo/refunds";

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

export class RefundService {
  static async getAll(): Promise<RefundRequest[]> {
    const snapshot = await get(ref(db, REFUNDS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data).map(([id, refund]) => ({
      id,
      ...(refund as Omit<RefundRequest, "id">),
    }));
  }

  static async getById(id: string): Promise<RefundRequest | null> {
    const snapshot = await get(ref(db, `${REFUNDS_PATH}/${id}`));
    const data = snapshot.val();
    return data ? { id, ...data } : null;
  }

  static async getByOrderCode(orderCode: string): Promise<RefundRequest[]> {
    const snapshot = await get(ref(db, REFUNDS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data)
      .filter(
        ([_, refund]) => (refund as RefundRequest).orderCode === orderCode
      )
      .map(([id, refund]) => ({
        id,
        ...(refund as Omit<RefundRequest, "id">),
      }));
  }

  static async getPending(): Promise<RefundRequest[]> {
    const all = await this.getAll();
    return all.filter((r) => r.status === RefundStatus.PENDING);
  }

  static async create(
    refund: Omit<RefundRequest, "id" | "createdAt" | "updatedAt">
  ): Promise<RefundRequest> {
    const now = new Date().getTime();
    const refundCode = genCode("REF_");

    const refundData: RefundRequest = {
      ...refund,
      id: refundCode,
      createdAt: now,
      updatedAt: now,
    };

    await set(ref(db, `${REFUNDS_PATH}/${refundCode}`), removeUndefined(refundData));
    return refundData;
  }

  static async update(
    id: string,
    refund: Partial<Omit<RefundRequest, "id" | "createdAt">>
  ): Promise<void> {
    const refundData = removeUndefined({
      ...refund,
      updatedAt: new Date().getTime(),
    });
    await update(ref(db, `${REFUNDS_PATH}/${id}`), refundData);
  }

  static async approve(
    id: string,
    approvedBy: string,
    approvedByName: string
  ): Promise<void> {
    await this.update(id, {
      status: RefundStatus.APPROVED,
      approvedBy,
      approvedByName,
      approvedAt: new Date().getTime(),
    });
  }

  static async reject(
    id: string,
    rejectedBy: string,
    rejectedByName: string,
    rejectionReason: string
  ): Promise<void> {
    await this.update(id, {
      status: RefundStatus.REJECTED,
      rejectedBy,
      rejectedByName,
      rejectedAt: new Date().getTime(),
      rejectionReason,
    });
  }

  static async process(
    id: string,
    processedBy: string,
    processedByName: string
  ): Promise<void> {
    // Get refund data before updating
    const refund = await this.getById(id);
    if (!refund) {
      throw new Error("Refund not found");
    }

    await this.update(id, {
      status: RefundStatus.PROCESSED,
      processedBy,
      processedByName,
      processedDate: new Date().getTime(),
    });

    // Tạo phiếu chi khi refund được processed
    try {
      // Dynamic import to avoid bundler issues
      const { FinanceService } = await import("./financeService");
      const updatedRefund = {
        ...refund,
        status: RefundStatus.PROCESSED,
        processedBy,
        processedByName,
        processedDate: new Date().getTime(),
        updatedAt: new Date().getTime(),
      };
      await FinanceService.createRefundTransaction(
        updatedRefund,
        id,
        processedBy,
        processedByName
      );
    } catch (financeError) {
      console.error("Failed to create refund finance transaction:", financeError);
      // Don't throw error, just log it
    }
  }

  static async delete(id: string): Promise<void> {
    await remove(ref(db, `${REFUNDS_PATH}/${id}`));
  }

  static onSnapshot(
    callback: (refunds: RefundRequest[]) => void
  ): () => void {
    const refundsRef = ref(db, REFUNDS_PATH);
    const unsubscribe = onValue(refundsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const refunds = Object.entries(data).map(([id, refund]) => ({
        id,
        ...(refund as Omit<RefundRequest, "id">),
      }));
      callback(refunds);
    });
    return unsubscribe;
  }
}


