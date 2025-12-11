export enum AppointmentStatus {
  SCHEDULED = "scheduled",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
}

export interface Appointment {
  id: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  orderId?: string;
  orderCode?: string;
  scheduledDate: number; // Timestamp
  duration?: number; // Duration in minutes (default 60)
  purpose: string; // Purpose of appointment
  staffId?: string; // Assigned staff member
  staffName?: string;
  status: AppointmentStatus;
  notes?: string;
  reminderSent?: boolean; // Whether reminder has been sent
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  createdByName?: string;
}

export interface FirebaseAppointments {
  [appointmentId: string]: Appointment;
}

export const AppointmentStatusLabels: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: "Đã đặt lịch",
  [AppointmentStatus.CONFIRMED]: "Đã xác nhận",
  [AppointmentStatus.COMPLETED]: "Đã hoàn thành",
  [AppointmentStatus.CANCELLED]: "Đã hủy",
  [AppointmentStatus.NO_SHOW]: "Không đến",
};

export const AppointmentStatusOptions = [
  { label: "Đã đặt lịch", value: AppointmentStatus.SCHEDULED },
  { label: "Đã xác nhận", value: AppointmentStatus.CONFIRMED },
  { label: "Đã hoàn thành", value: AppointmentStatus.COMPLETED },
  { label: "Đã hủy", value: AppointmentStatus.CANCELLED },
  { label: "Không đến", value: AppointmentStatus.NO_SHOW },
];


