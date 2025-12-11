import {
  CustomerFeedback
} from "@/types/feedback";
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
const FEEDBACK_PATH = "xoxo/feedback";

export class FeedbackService {
  static async getAll(): Promise<CustomerFeedback[]> {
    const snapshot = await get(ref(db, FEEDBACK_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data).map(([id, feedback]) => ({
      id,
      ...(feedback as Omit<CustomerFeedback, "id">),
    }));
  }

  static async getById(id: string): Promise<CustomerFeedback | null> {
    const snapshot = await get(ref(db, `${FEEDBACK_PATH}/${id}`));
    const data = snapshot.val();
    return data ? { id, ...data } : null;
  }

  static async getByOrderId(orderId: string): Promise<CustomerFeedback[]> {
    const snapshot = await get(ref(db, FEEDBACK_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data)
      .filter(([_, feedback]) => (feedback as CustomerFeedback).orderId === orderId)
      .map(([id, feedback]) => ({
        id,
        ...(feedback as Omit<CustomerFeedback, "id">),
      }));
  }

  static async getByOrderCode(orderCode: string): Promise<CustomerFeedback[]> {
    const snapshot = await get(ref(db, FEEDBACK_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data)
      .filter(([_, feedback]) => (feedback as CustomerFeedback).orderCode === orderCode)
      .map(([id, feedback]) => ({
        id,
        ...(feedback as Omit<CustomerFeedback, "id">),
      }));
  }

  static async create(
    feedback: Omit<CustomerFeedback, "id" | "createdAt" | "updatedAt">
  ): Promise<CustomerFeedback> {
    const now = new Date().getTime();
    const feedbackCode = genCode("FB_");

    const feedbackData: CustomerFeedback = {
      ...feedback,
      id: feedbackCode,
      createdAt: now,
      updatedAt: now,
    };

    await set(ref(db, `${FEEDBACK_PATH}/${feedbackCode}`), feedbackData);
    return feedbackData;
  }

  static async update(
    id: string,
    feedback: Partial<Omit<CustomerFeedback, "id" | "createdAt">>
  ): Promise<void> {
    const feedbackData = {
      ...feedback,
      updatedAt: new Date().getTime(),
    };
    await update(ref(db, `${FEEDBACK_PATH}/${id}`), feedbackData);
  }

  static async delete(id: string): Promise<void> {
    await remove(ref(db, `${FEEDBACK_PATH}/${id}`));
  }

  static onSnapshot(
    callback: (feedbacks: CustomerFeedback[]) => void
  ): () => void {
    const feedbacksRef = ref(db, FEEDBACK_PATH);
    const unsubscribe = onValue(feedbacksRef, (snapshot) => {
      const data = snapshot.val() || {};
      const feedbacks = Object.entries(data).map(([id, feedback]) => ({
        id,
        ...(feedback as Omit<CustomerFeedback, "id">),
      }));
      callback(feedbacks);
    });
    return unsubscribe;
  }

  // Get feedbacks that require re-service (CHÊ or BỨC XÚC)
  static async getRequiringReService(): Promise<CustomerFeedback[]> {
    const allFeedbacks = await this.getAll();
    return allFeedbacks.filter(
      (f) =>
        (f.feedbackType === "complaint" || f.feedbackType === "angry") &&
        !f.reServiceOrderId
    );
  }
}


