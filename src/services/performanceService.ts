import {
  ErrorSeverity,
  ErrorType,
  TechnicalError
} from "@/types/performance";
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
const TECHNICAL_ERRORS_PATH = "xoxo/technical_errors";

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

export class PerformanceService {
  static async getAll(): Promise<TechnicalError[]> {
    const snapshot = await get(ref(db, TECHNICAL_ERRORS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data).map(([id, error]) => ({
      id,
      ...(error as Omit<TechnicalError, "id">),
    }));
  }

  static async getById(id: string): Promise<TechnicalError | null> {
    const snapshot = await get(ref(db, `${TECHNICAL_ERRORS_PATH}/${id}`));
    const data = snapshot.val();
    return data ? { id, ...data } : null;
  }

  static async getByTechnicianId(
    technicianId: string
  ): Promise<TechnicalError[]> {
    const snapshot = await get(ref(db, TECHNICAL_ERRORS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data)
      .filter(
        ([_, error]) =>
          (error as TechnicalError).technicianId === technicianId
      )
      .map(([id, error]) => ({
        id,
        ...(error as Omit<TechnicalError, "id">),
      }));
  }

  static async getByOrderCode(
    orderCode: string
  ): Promise<TechnicalError[]> {
    const snapshot = await get(ref(db, TECHNICAL_ERRORS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data)
      .filter(
        ([_, error]) => (error as TechnicalError).orderCode === orderCode
      )
      .map(([id, error]) => ({
        id,
        ...(error as Omit<TechnicalError, "id">),
      }));
  }

  static async getUnresolved(): Promise<TechnicalError[]> {
    const all = await this.getAll();
    return all.filter((e) => !e.resolved);
  }

  static async create(
    error: Omit<TechnicalError, "id" | "createdAt" | "updatedAt">
  ): Promise<TechnicalError> {
    const now = new Date().getTime();
    const errorCode = genCode("ERR_");

    const errorData: TechnicalError = {
      ...error,
      id: errorCode,
      createdAt: now,
      updatedAt: now,
    };

    await set(ref(db, `${TECHNICAL_ERRORS_PATH}/${errorCode}`), removeUndefined(errorData));
    return errorData;
  }

  static async update(
    id: string,
    error: Partial<Omit<TechnicalError, "id" | "createdAt">>
  ): Promise<void> {
    const errorData = removeUndefined({
      ...error,
      updatedAt: new Date().getTime(),
    });
    await update(ref(db, `${TECHNICAL_ERRORS_PATH}/${id}`), errorData);
  }

  static async resolve(
    id: string,
    resolvedBy: string,
    resolvedByName: string,
    resolution: string
  ): Promise<void> {
    await this.update(id, {
      resolved: true,
      resolvedBy,
      resolvedByName,
      resolvedAt: new Date().getTime(),
      resolution,
    });
  }

  static async delete(id: string): Promise<void> {
    await remove(ref(db, `${TECHNICAL_ERRORS_PATH}/${id}`));
  }

  static onSnapshot(
    callback: (errors: TechnicalError[]) => void
  ): () => void {
    const errorsRef = ref(db, TECHNICAL_ERRORS_PATH);
    const unsubscribe = onValue(errorsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const errors = Object.entries(data).map(([id, error]) => ({
        id,
        ...(error as Omit<TechnicalError, "id">),
      }));
      callback(errors);
    });
    return unsubscribe;
  }

  // Generate reports for training
  static async getErrorReport(
    startDate?: number,
    endDate?: number,
    technicianId?: string,
    errorType?: ErrorType
  ): Promise<{
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    byTechnician: Record<string, number>;
    unresolved: number;
  }> {
    let errors = await this.getAll();

    if (startDate) {
      errors = errors.filter((e) => e.createdAt >= startDate);
    }
    if (endDate) {
      errors = errors.filter((e) => e.createdAt <= endDate);
    }
    if (technicianId) {
      errors = errors.filter((e) => e.technicianId === technicianId);
    }
    if (errorType) {
      errors = errors.filter((e) => e.errorType === errorType);
    }

    const byType: Record<ErrorType, number> = {
      [ErrorType.TECHNICAL]: 0,
      [ErrorType.QUALITY]: 0,
      [ErrorType.PROCESS]: 0,
      [ErrorType.COMMUNICATION]: 0,
    };

    const bySeverity: Record<ErrorSeverity, number> = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0,
    };

    const byTechnician: Record<string, number> = {};

    errors.forEach((error) => {
      byType[error.errorType] = (byType[error.errorType] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      byTechnician[error.technicianId] =
        (byTechnician[error.technicianId] || 0) + 1;
    });

    return {
      total: errors.length,
      byType,
      bySeverity,
      byTechnician,
      unresolved: errors.filter((e) => !e.resolved).length,
    };
  }
}


