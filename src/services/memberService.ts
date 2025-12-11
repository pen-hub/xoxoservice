import { ROLES } from '@/types/enum';
import { IMembers } from '@/types/members';
import { get, getDatabase, onValue, ref, remove, set, update } from 'firebase/database';

const db = getDatabase();
const MEMBERS_PATH = 'xoxo/members';

export class MemberService {
  static async getAll(): Promise<IMembers[]> {
    const snapshot = await get(ref(db, MEMBERS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data).map(([id, member]) => ({
      id,
      ...(member as Omit<IMembers, 'id'>)
    }));
  }

  static async getById(id: string): Promise<IMembers | null> {
    const snapshot = await get(ref(db, `${MEMBERS_PATH}/${id}`));
    const data = snapshot.val();
    return data ? { id, ...data } : null;
  }

  static async create(member: Omit<IMembers & {password: string}, | 'createdAt' | 'updatedAt'>){
    const now = new Date().getTime();

    // Tạo tài khoản sử dụng API (không tự động đăng nhập)
    const createUserResponse = await fetch('/api/members/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: member.email,
        password: member.password,
        displayName: member.name,
        role: member.role,
      }),
    });

    if (!createUserResponse.ok) {
      const error = await createUserResponse.json();
      throw new Error(error.error || 'Failed to create user account');
    }

    const userData = await createUserResponse.json();

    const memberData = {
      ...member,
      id: userData.user.uid,
      createdAt: now,
      updatedAt: now,
    };

    // Lưu thông tin member vào database
    await set(ref(db, `${MEMBERS_PATH}/${userData.user.uid}`), memberData);
    return memberData;
  }

  static async update(id: string, member: Partial<Omit<IMembers,'createdAt'>>): Promise<void> {
    const memberData = {
      ...member,
      updatedAt: new Date().getTime(),
    };
    await update(ref(db, `${MEMBERS_PATH}/${id}`), memberData);
  }

  static async updatePassword(id: string, newPassword: string, role: ROLES): Promise<void> {
    const response = await fetch(`/api/members/${id}/update-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: newPassword ,
        role: role,

      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update password');
    }
  }

  static async updateWithPassword(id: string, member: Partial<Omit<IMembers,'createdAt'>>, newPassword?: string): Promise<void> {
    // Update member data in database
    const memberData = {
      ...member,
      updatedAt: new Date().getTime(),
    };
    await update(ref(db, `${MEMBERS_PATH}/${id}`), memberData);

    // Update password if provided
    if (newPassword && newPassword.trim() !== '') {
      await this.updatePassword(id, newPassword, member.role as ROLES);
    }
  }

  static async delete(id: string): Promise<void> {
    await remove(ref(db, `${MEMBERS_PATH}/${id}`));
  }

  static onSnapshot(callback: (members: IMembers[]) => void): () => void {
    const membersRef = ref(db, MEMBERS_PATH);
    const unsubscribe = onValue(membersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const members = Object.entries(data).map(([id, member]) => ({
        id,
        ...(member as Omit<IMembers, 'id'>)
      }));
      callback(members);
    });

    return unsubscribe;
  }
}
