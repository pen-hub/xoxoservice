import {
  Appointment,
  AppointmentStatus
} from "@/types/appointment";
import { genCode } from "@/utils/genCode";
import dayjs from "dayjs";
import {
  get,
  getDatabase,
  onValue,
  ref,
  remove,
  set,
  update
} from "firebase/database";

const db = getDatabase();
const APPOINTMENTS_PATH = "xoxo/appointments";

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

export class AppointmentService {
  static async getAll(): Promise<Appointment[]> {
    const snapshot = await get(ref(db, APPOINTMENTS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data).map(([id, appointment]) => ({
      id,
      ...(appointment as Omit<Appointment, "id">),
    }));
  }

  static async getById(id: string): Promise<Appointment | null> {
    const snapshot = await get(ref(db, `${APPOINTMENTS_PATH}/${id}`));
    const data = snapshot.val();
    return data ? { id, ...data } : null;
  }

  static async getByDateRange(
    startDate: number,
    endDate: number
  ): Promise<Appointment[]> {
    const snapshot = await get(ref(db, APPOINTMENTS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data)
      .filter(([_, appointment]) => {
        const appt = appointment as Appointment;
        return (
          appt.scheduledDate >= startDate && appt.scheduledDate <= endDate
        );
      })
      .map(([id, appointment]) => ({
        id,
        ...(appointment as Omit<Appointment, "id">),
      }));
  }

  static async getByStaffId(staffId: string): Promise<Appointment[]> {
    const snapshot = await get(ref(db, APPOINTMENTS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data)
      .filter(
        ([_, appointment]) => (appointment as Appointment).staffId === staffId
      )
      .map(([id, appointment]) => ({
        id,
        ...(appointment as Omit<Appointment, "id">),
      }));
  }

  static async getByOrderCode(orderCode: string): Promise<Appointment[]> {
    const snapshot = await get(ref(db, APPOINTMENTS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data)
      .filter(
        ([_, appointment]) =>
          (appointment as Appointment).orderCode === orderCode
      )
      .map(([id, appointment]) => ({
        id,
        ...(appointment as Omit<Appointment, "id">),
      }));
  }

  // Check for conflicts (overlapping appointments for same staff)
  static async checkConflict(
    staffId: string,
    scheduledDate: number,
    duration: number = 60,
    excludeAppointmentId?: string
  ): Promise<Appointment | null> {
    const appointments = await this.getByStaffId(staffId);
    const appointmentEnd = scheduledDate + duration * 60 * 1000;

    const conflict = appointments.find((appt) => {
      if (excludeAppointmentId && appt.id === excludeAppointmentId) {
        return false;
      }
      if (appt.status === AppointmentStatus.CANCELLED) {
        return false;
      }
      const apptEnd = appt.scheduledDate + (appt.duration || 60) * 60 * 1000;
      return (
        (scheduledDate >= appt.scheduledDate && scheduledDate < apptEnd) ||
        (appointmentEnd > appt.scheduledDate && appointmentEnd <= apptEnd) ||
        (scheduledDate <= appt.scheduledDate && appointmentEnd >= apptEnd)
      );
    });

    return conflict || null;
  }

  static async create(
    appointment: Omit<Appointment, "id" | "createdAt" | "updatedAt">
  ): Promise<Appointment> {
    // Check for conflicts if staff is assigned
    if (appointment.staffId) {
      const conflict = await this.checkConflict(
        appointment.staffId,
        appointment.scheduledDate,
        appointment.duration || 60
      );
      if (conflict) {
        throw new Error(
          `Nhân viên đã có lịch hẹn khác vào thời gian này: ${dayjs(
            conflict.scheduledDate
          ).format("DD/MM/YYYY HH:mm")}`
        );
      }
    }

    const now = new Date().getTime();
    const appointmentCode = genCode("APT_");

    const appointmentData: Appointment = {
      ...appointment,
      id: appointmentCode,
      createdAt: now,
      updatedAt: now,
    };

    await set(ref(db, `${APPOINTMENTS_PATH}/${appointmentCode}`), removeUndefined(appointmentData));
    return appointmentData;
  }

  static async update(
    id: string,
    appointment: Partial<Omit<Appointment, "id" | "createdAt">>
  ): Promise<void> {
    // Check for conflicts if staff or time is being changed
    const existing = await this.getById(id);
    if (existing && appointment.staffId && appointment.scheduledDate) {
      const conflict = await this.checkConflict(
        appointment.staffId,
        appointment.scheduledDate,
        appointment.duration || existing.duration || 60,
        id
      );
      if (conflict) {
        throw new Error(
          `Nhân viên đã có lịch hẹn khác vào thời gian này: ${dayjs(
            conflict.scheduledDate
          ).format("DD/MM/YYYY HH:mm")}`
        );
      }
    }

    const appointmentData = removeUndefined({
      ...appointment,
      updatedAt: new Date().getTime(),
    });
    await update(ref(db, `${APPOINTMENTS_PATH}/${id}`), appointmentData);
  }

  static async delete(id: string): Promise<void> {
    await remove(ref(db, `${APPOINTMENTS_PATH}/${id}`));
  }

  static onSnapshot(
    callback: (appointments: Appointment[]) => void
  ): () => void {
    const appointmentsRef = ref(db, APPOINTMENTS_PATH);
    const unsubscribe = onValue(appointmentsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const appointments = Object.entries(data).map(([id, appointment]) => ({
        id,
        ...(appointment as Omit<Appointment, "id">),
      }));
      callback(appointments);
    });
    return unsubscribe;
  }

  // Get upcoming appointments
  static async getUpcoming(limit: number = 10): Promise<Appointment[]> {
    const all = await this.getAll();
    const now = Date.now();
    return all
      .filter(
        (appt) =>
          appt.scheduledDate >= now &&
          appt.status !== AppointmentStatus.CANCELLED &&
          appt.status !== AppointmentStatus.COMPLETED
      )
      .sort((a, b) => a.scheduledDate - b.scheduledDate)
      .slice(0, limit);
  }

  // Get today's appointments
  static async getToday(): Promise<Appointment[]> {
    const all = await this.getAll();
    const todayStart = dayjs().startOf("day").valueOf();
    const todayEnd = dayjs().endOf("day").valueOf();
    return all.filter(
      (appt) =>
        appt.scheduledDate >= todayStart &&
        appt.scheduledDate <= todayEnd &&
        appt.status !== AppointmentStatus.CANCELLED
    );
  }
}


