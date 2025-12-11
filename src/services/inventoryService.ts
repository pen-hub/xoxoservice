import { InventorySettings, InventoryTransaction, Material } from '@/types/inventory';
import { genCode } from '@/utils/genCode';
import { get, getDatabase, onValue, ref, remove, set, update } from 'firebase/database';
import { FinanceService } from './financeService';

const db = getDatabase();
const MATERIALS_PATH = 'xoxo/inventory/materials';
const TRANSACTIONS_PATH = 'xoxo/inventory/transactions';
const SETTINGS_PATH = 'xoxo/inventory/settings';

// Helper function to remove undefined and null values
function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const key in obj) {
    const value = obj[key];
    // Only include if value is not undefined and not null
    if (value !== undefined && value !== null) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// ==================== MATERIALS ====================

export class InventoryService {
  // Get all materials
  static async getAllMaterials(): Promise<Material[]> {
    const snapshot = await get(ref(db, MATERIALS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data).map(([code, material]) => ({
      id: code, // Keep id for backward compatibility, but use code as key
      ...(material as Omit<Material, 'id'>)
    }));
  }

  // Get material by code
  static async getMaterialById(code: string): Promise<Material | null> {
    const snapshot = await get(ref(db, `${MATERIALS_PATH}/${code}`));
    const data = snapshot.val();
    return data ? { id: code, ...data } : null;
  }

  // Create new material
  static async createMaterial(material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>): Promise<Material> {
    const now = new Date().getTime();
    const materialCode = genCode("MAT_");

    const materialData: Material = {
      id: materialCode,
      ...material,
      createdAt: now,
      updatedAt: now,
    };

    await set(ref(db, `${MATERIALS_PATH}/${materialCode}`), removeUndefined(materialData));
    return materialData;
  }

  // Update material
  static async updateMaterial(code: string, material: Partial<Omit<Material, 'id' | 'createdAt'>>): Promise<void> {
    const materialData = {
      ...material,
      updatedAt: new Date().getTime(),
    };
    await update(ref(db, `${MATERIALS_PATH}/${code}`), materialData);
  }

  // Delete material
  static async deleteMaterial(code: string): Promise<void> {
    await remove(ref(db, `${MATERIALS_PATH}/${code}`));
  }

  // Real-time subscription for materials
  static onMaterialsSnapshot(callback: (materials: Material[]) => void): () => void {
    const materialsRef = ref(db, MATERIALS_PATH);
    const unsubscribe = onValue(materialsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const materials = Object.entries(data).map(([code, material]) => ({
        id: code, // Keep id for backward compatibility
        ...(material as Omit<Material, 'id'>)
      }));
      callback(materials);
    });

    return unsubscribe;
  }

  // ==================== TRANSACTIONS ====================

  // Get all transactions
  static async getAllTransactions(): Promise<InventoryTransaction[]> {
    const snapshot = await get(ref(db, TRANSACTIONS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data)
      .map(([code, transaction]) => ({
        code,
        ...(transaction as Omit<InventoryTransaction, 'code'>)
      }))
      .sort((a, b) => b.createdAt - a.createdAt); // Sort by newest first
  }

  // Get transactions by material ID
  static async getTransactionsByMaterialId(materialId: string): Promise<InventoryTransaction[]> {
    const snapshot = await get(ref(db, TRANSACTIONS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data)
      .map(([code, transaction]) => ({
        code,
        ...(transaction as Omit<InventoryTransaction, 'code'>)
      }))
      .filter(t => t.materialId === materialId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // Create transaction (import or export)
  static async createTransaction(
    transaction: Omit<InventoryTransaction, 'code' | 'createdAt'>
  ): Promise<InventoryTransaction> {
    const now = new Date().getTime();
    const transactionCode = genCode("TXN_");

    // Calculate totalAmount if not provided
    const totalAmount = transaction.totalAmount ||
      (transaction.price && transaction.quantity
        ? transaction.price * transaction.quantity
        : 0);

    // Build transaction data, only including defined values
    const transactionData: Partial<InventoryTransaction> = {
      code: transactionCode,
      materialId: transaction.materialId,
      materialName: transaction.materialName,
      type: transaction.type,
      quantity: transaction.quantity,
      unit: transaction.unit,
      date: transaction.date,
      createdAt: now,
    };

    // Add optional fields only if they have values
    if (transaction.price !== undefined && transaction.price !== null) {
      transactionData.price = transaction.price;
    }
    if (totalAmount > 0 || transaction.totalAmount) {
      transactionData.totalAmount = totalAmount > 0 ? totalAmount : transaction.totalAmount;
    }
    if (transaction.warehouse) {
      transactionData.warehouse = transaction.warehouse;
    }
    if (transaction.supplier) {
      transactionData.supplier = transaction.supplier;
    }
    if (transaction.reason) {
      transactionData.reason = transaction.reason;
    }
    if (transaction.note) {
      transactionData.note = transaction.note;
    }
    if (transaction.createdBy) {
      transactionData.createdBy = transaction.createdBy;
    }

    await set(ref(db, `${TRANSACTIONS_PATH}/${transactionCode}`), transactionData);

    // Return the complete transaction data (with all required fields)
    const returnData: InventoryTransaction = {
      code: transactionCode,
      materialId: transaction.materialId,
      materialName: transaction.materialName,
      type: transaction.type,
      quantity: transaction.quantity,
      unit: transaction.unit,
      date: transaction.date,
      createdAt: now,
    };

    // Add optional fields
    if (transaction.price !== undefined && transaction.price !== null) {
      returnData.price = transaction.price;
    }
    if (totalAmount > 0 || transaction.totalAmount) {
      returnData.totalAmount = totalAmount > 0 ? totalAmount : transaction.totalAmount;
    }
    if (transaction.warehouse) {
      returnData.warehouse = transaction.warehouse;
    }
    if (transaction.supplier) {
      returnData.supplier = transaction.supplier;
    }
    if (transaction.reason) {
      returnData.reason = transaction.reason;
    }
    if (transaction.note) {
      returnData.note = transaction.note;
    }
    if (transaction.createdBy) {
      returnData.createdBy = transaction.createdBy;
    }

    // Update material stock quantity
    const material = await this.getMaterialById(transaction.materialId);
    if (material) {
      const newQuantity = transaction.type === 'import'
        ? material.stockQuantity + transaction.quantity
        : material.stockQuantity - transaction.quantity;

      await this.updateMaterial(transaction.materialId, {
        stockQuantity: Math.max(0, newQuantity), // Ensure non-negative
        lastUpdated: new Date().toISOString().split('T')[0],
      });
    }

    // Tạo phiếu chi khi nhập kho (import)
    if (transaction.type === 'import' && returnData.totalAmount && returnData.totalAmount > 0) {
      try {
        await FinanceService.createInventoryTransaction(
          returnData,
          transactionCode,
          transaction.createdBy
        );
      } catch (financeError) {
        console.error("Failed to create inventory finance transaction:", financeError);
        // Don't throw error, just log it
      }
    }

    return returnData;
  }

  // Real-time subscription for transactions
  static onTransactionsSnapshot(callback: (transactions: InventoryTransaction[]) => void): () => void {
    const transactionsRef = ref(db, TRANSACTIONS_PATH);
    const unsubscribe = onValue(transactionsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const transactions = Object.entries(data)
        .map(([code, transaction]) => ({
          code,
          ...(transaction as Omit<InventoryTransaction, 'code'>)
        }))
        .sort((a, b) => b.createdAt - a.createdAt);
      callback(transactions);
    });

    return unsubscribe;
  }

  // ==================== SETTINGS ====================

  // Get settings
  static async getSettings(): Promise<InventorySettings> {
    const snapshot = await get(ref(db, SETTINGS_PATH));
    const data = snapshot.val();
    if (data) {
      return data;
    }
    // Return default settings if not exists
    const defaultSettings: InventorySettings = {
      defaultLongStockDays: 90,
    };
    await this.updateSettings(defaultSettings);
    return defaultSettings;
  }

  // Update settings
  static async updateSettings(settings: Partial<InventorySettings>): Promise<void> {
    const settingsData = {
      ...settings,
      updatedAt: new Date().getTime(),
    };
    await set(ref(db, SETTINGS_PATH), settingsData);
  }
}

