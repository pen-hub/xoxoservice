import {
    WarrantyClaim,
    WarrantyClaimStatus,
} from "@/types/warrantyClaim";
import {
    get,
    getDatabase,
    onValue,
    push,
    ref,
    remove,
    set,
    update,
} from "firebase/database";

const db = getDatabase();
const WARRANTY_CLAIMS_PATH = "xoxo/warranty_claims";

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

export class WarrantyClaimService {
  static async getAll(): Promise<WarrantyClaim[]> {
    const snapshot = await get(ref(db, WARRANTY_CLAIMS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data).map(([id, claim]) => ({
      id,
      ...(claim as Omit<WarrantyClaim, "id">),
    }));
  }

  static async getById(id: string): Promise<WarrantyClaim | null> {
    const snapshot = await get(ref(db, `${WARRANTY_CLAIMS_PATH}/${id}`));
    const data = snapshot.val();
    return data ? { id, ...data } : null;
  }

  static async getByOrderCode(orderCode: string): Promise<WarrantyClaim[]> {
    const snapshot = await get(ref(db, WARRANTY_CLAIMS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data)
      .filter(
        ([_, claim]) =>
          (claim as WarrantyClaim).originalOrderCode === orderCode
      )
      .map(([id, claim]) => ({
        id,
        ...(claim as Omit<WarrantyClaim, "id">),
      }));
  }

  static async getByStatus(
    status: WarrantyClaimStatus
  ): Promise<WarrantyClaim[]> {
    const all = await this.getAll();
    return all.filter((c) => c.status === status);
  }

  static async create(
    claim: Omit<WarrantyClaim, "id" | "createdAt" | "updatedAt">
  ): Promise<WarrantyClaim> {
    const now = new Date().getTime();
    const claimRef = ref(db, `${WARRANTY_CLAIMS_PATH}/${claim.code}`);

    const claimData: WarrantyClaim = {
      ...claim,
      id: claim.code,
      createdAt: now,
      updatedAt: now,
    };

    await set(claimRef, removeUndefined(claimData));
    return claimData;
  }

  static async update(
    id: string,
    claim: Partial<Omit<WarrantyClaim, "id" | "createdAt">>
  ): Promise<void> {
    const claimData = removeUndefined({
      ...claim,
      updatedAt: new Date().getTime(),
    });
    await update(ref(db, `${WARRANTY_CLAIMS_PATH}/${id}`), claimData);
  }

  static async updateStatus(
    id: string,
    status: WarrantyClaimStatus
  ): Promise<void> {
    await this.update(id, { status });
  }

  static async delete(id: string): Promise<void> {
    await remove(ref(db, `${WARRANTY_CLAIMS_PATH}/${id}`));
  }

  static onSnapshot(
    callback: (claims: WarrantyClaim[]) => void
  ): () => void {
    const claimsRef = ref(db, WARRANTY_CLAIMS_PATH);
    const unsubscribe = onValue(claimsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const claims = Object.entries(data).map(([id, claim]) => ({
        id,
        ...(claim as Omit<WarrantyClaim, "id">),
      }));
      callback(claims);
    });
    return unsubscribe;
  }
}


