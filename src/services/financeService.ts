import { InventoryTransaction } from "@/types/inventory";
import { FirebaseOrderData } from "@/types/order";
import { RefundRequest, RefundStatus } from "@/types/refund";
import { genCode } from "@/utils/genCode";
import { getDatabase, ref, set } from "firebase/database";

const db = getDatabase();
const FINANCE_TRANSACTIONS_PATH = "xoxo/finance/transactions";

export interface FinanceTransaction {
  id: string;
  date: number; // Timestamp
  type: "income" | "expense";
  category: "inventory" | "order" | "salary";
  amount: number;
  description: string;
  reference: string; // Order code, transaction ID, etc.
  sourceId?: string; // ID của order, transaction, refund, etc.
  sourceType?: "order" | "inventory" | "refund" | "manual"; // Nguồn gốc
  createdBy?: string;
  createdByName?: string;
  createdAt: number;
  updatedAt: number;
  notes?: string;
  isManual?: boolean; // Đánh dấu là tạo thủ công
}

export class FinanceService {
  /**
   * Tạo phiếu thu khi đơn hàng chuyển sang CONFIRMED (tiền cọc)
   */
  static async createDepositTransaction(
    order: FirebaseOrderData,
    orderId: string,
    userId?: string,
    userName?: string
  ): Promise<void> {
    if (!order.depositAmount || order.depositAmount <= 0) {
      return; // Không có cọc thì không tạo
    }

    const now = new Date().getTime();
    const transactionCode = genCode("FIN_");

    const transaction: FinanceTransaction = {
      id: transactionCode,
      date: order.updatedAt || order.orderDate || now,
      type: "income",
      category: "order",
      amount: order.depositAmount,
      description: `Tiền cọc đơn hàng ${order.code}`,
      reference: order.code,
      sourceId: orderId,
      sourceType: "order",
      createdBy: userId || order.createdBy,
      createdByName: userName || order.createdByName,
      createdAt: now,
      updatedAt: now,
      notes: `Tiền cọc đơn hàng ${order.code}`,
      isManual: false,
    };

    await set(ref(db, `${FINANCE_TRANSACTIONS_PATH}/${transactionCode}`), transaction);
  }

  /**
   * Tạo phiếu thu khi đơn hàng chuyển sang COMPLETED (số tiền còn lại)
   */
  static async createRemainingAmountTransaction(
    order: FirebaseOrderData,
    orderId: string,
    userId?: string,
    userName?: string
  ): Promise<void> {
    if (!order.totalAmount) {
      return;
    }

    const depositAmount = order.depositAmount || 0;
    const remainingAmount = order.totalAmount - depositAmount;

    if (remainingAmount <= 0) {
      return; // Không còn tiền thì không tạo
    }

    const now = new Date().getTime();
    const transactionCode = genCode("FIN_");

    const transaction: FinanceTransaction = {
      id: transactionCode,
      date: order.updatedAt || order.orderDate || now,
      type: "income",
      category: "order",
      amount: remainingAmount,
      description: `Số tiền còn lại đơn hàng ${order.code}`,
      reference: order.code,
      sourceId: orderId,
      sourceType: "order",
      createdBy: userId || order.createdBy,
      createdByName: userName || order.createdByName,
      createdAt: now,
      updatedAt: now,
      notes: `Số tiền còn lại đơn hàng ${order.code} (Tổng: ${order.totalAmount.toLocaleString("vi-VN")} VNĐ - Cọc: ${depositAmount.toLocaleString("vi-VN")} VNĐ)`,
      isManual: false,
    };

    await set(ref(db, `${FINANCE_TRANSACTIONS_PATH}/${transactionCode}`), transaction);
  }

  /**
   * Tạo phiếu chi khi refund được phê duyệt/xử lý
   */
  static async createRefundTransaction(
    refund: RefundRequest,
    refundId: string,
    userId?: string,
    userName?: string
  ): Promise<void> {
    if (!refund.amount || refund.amount <= 0) {
      return;
    }

    // Chỉ tạo khi refund được processed
    if (refund.status !== RefundStatus.PROCESSED) {
      return;
    }

    const now = new Date().getTime();
    const transactionCode = genCode("FIN_");

    const transaction: FinanceTransaction = {
      id: transactionCode,
      date: refund.processedDate || refund.updatedAt || refund.createdAt,
      type: "expense",
      category: "order",
      amount: refund.amount,
      description: `Hoàn tiền đơn hàng ${refund.orderCode}`,
      reference: refund.orderCode,
      sourceId: refundId,
      sourceType: "refund",
      createdBy: userId || refund.processedBy,
      createdByName: userName || refund.processedByName,
      createdAt: now,
      updatedAt: now,
      notes: refund.notes || `Lý do: ${refund.reason}`,
      isManual: false,
    };

    await set(ref(db, `${FINANCE_TRANSACTIONS_PATH}/${transactionCode}`), transaction);
  }

  /**
   * Tạo phiếu chi khi nhập kho
   */
  static async createInventoryTransaction(
    inventoryTransaction: InventoryTransaction,
    transactionId: string,
    userId?: string,
    userName?: string
  ): Promise<void> {
    // Chỉ tạo cho import
    if (inventoryTransaction.type !== "import") {
      return;
    }

    // Tính totalAmount nếu chưa có
    const totalAmount =
      inventoryTransaction.totalAmount ||
      (inventoryTransaction.price && inventoryTransaction.quantity
        ? inventoryTransaction.price * inventoryTransaction.quantity
        : 0);

    if (totalAmount <= 0) {
      return;
    }

    const now = new Date().getTime();
    const transactionCode = genCode("FIN_");

    const transaction: FinanceTransaction = {
      id: transactionCode,
      date: inventoryTransaction.createdAt,
      type: "expense",
      category: "inventory",
      amount: totalAmount,
      description: `Phiếu nhập kho: ${inventoryTransaction.materialName}`,
      reference: inventoryTransaction.code,
      sourceId: transactionId,
      sourceType: "inventory",
      createdBy: userId || inventoryTransaction.createdBy,
      createdAt: now,
      updatedAt: now,
      notes: inventoryTransaction.note || `Số lượng: ${inventoryTransaction.quantity} ${inventoryTransaction.unit}`,
      isManual: false,
    };

    await set(ref(db, `${FINANCE_TRANSACTIONS_PATH}/${transactionCode}`), transaction);
  }

  /**
   * Tạo giao dịch thủ công
   */
  static async createManualTransaction(
    transaction: Omit<FinanceTransaction, "id" | "createdAt" | "updatedAt" | "isManual">,
    userId: string,
    userName: string
  ): Promise<FinanceTransaction> {
    const now = new Date().getTime();
    const transactionCode = genCode("FIN_");

    const fullTransaction: FinanceTransaction = {
      ...transaction,
      id: transactionCode,
      createdBy: userId,
      createdByName: userName,
      createdAt: now,
      updatedAt: now,
      isManual: true,
    };

    await set(ref(db, `${FINANCE_TRANSACTIONS_PATH}/${transactionCode}`), fullTransaction);
    return fullTransaction;
  }
}

