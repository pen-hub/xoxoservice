import { Category } from '@/types/category';
import { get, getDatabase, onValue, ref, remove, set, update } from 'firebase/database';

const db = getDatabase();
const CATEGORIES_PATH = 'xoxo/inventory/categories';

export class CategoryService {
  // Get all categories
  static async getAll(): Promise<Category[]> {
    const snapshot = await get(ref(db, CATEGORIES_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data).map(([code, category]) => ({
      code,
      ...(category as Omit<Category, 'code'>)
    }));
  }

  // Get category by code
  static async getByCode(code: string): Promise<Category | null> {
    const snapshot = await get(ref(db, `${CATEGORIES_PATH}/${code}`));
    const data = snapshot.val();
    return data ? { code, ...data } : null;
  }

  // Create new category
  static async create(category: Omit<Category, 'createdAt' | 'updatedAt'>): Promise<Category> {
    const now = new Date().getTime();
    const categoryRef = ref(db, `${CATEGORIES_PATH}/${category.code}`);

    // Build category data without undefined values
    const categoryData: Record<string, any> = {
      code: category.code,
      name: category.name,
      createdAt: now,
      updatedAt: now,
    };

    // Only add description if it exists and is not empty
    if (category.description !== undefined && category.description !== null && category.description !== '') {
      categoryData.description = category.description;
    }

    // Only add color if it exists
    if (category.color !== undefined && category.color !== null && category.color !== '') {
      categoryData.color = category.color;
    }

    await set(categoryRef, categoryData);
    return categoryData as Category;
  }

  // Update category
  static async update(code: string, category: Partial<Omit<Category, 'code' | 'createdAt'>>): Promise<void> {
    // Build update data without undefined values
    const categoryData: Record<string, any> = {
      updatedAt: new Date().getTime(),
    };

    if (category.name !== undefined && category.name !== null) {
      categoryData.name = category.name;
    }

    // Handle description: only include if it's a non-empty string, or explicitly set empty string to clear
    if (category.description !== undefined) {
      if (category.description !== null && category.description !== '') {
        categoryData.description = category.description;
      } else {
        // Set to empty string to clear the field
        categoryData.description = '';
      }
    }

    if (category.color !== undefined && category.color !== null && category.color !== '') {
      categoryData.color = category.color;
    }

    await update(ref(db, `${CATEGORIES_PATH}/${code}`), categoryData);
  }

  // Delete category
  static async delete(code: string): Promise<void> {
    await remove(ref(db, `${CATEGORIES_PATH}/${code}`));
  }

  // Real-time subscription for categories
  static onSnapshot(callback: (categories: Category[]) => void): () => void {
    const categoriesRef = ref(db, CATEGORIES_PATH);
    const unsubscribe = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const categories = Object.entries(data).map(([code, category]) => ({
        code,
        ...(category as Omit<Category, 'code'>)
      }));
      callback(categories);
    });

    return unsubscribe;
  }
}

