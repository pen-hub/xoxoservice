export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum ErrorType {
  TECHNICAL = "technical", // Lỗi kỹ thuật
  QUALITY = "quality", // Lỗi chất lượng
  PROCESS = "process", // Lỗi quy trình
  COMMUNICATION = "communication", // Lỗi giao tiếp
}

export interface TechnicalError {
  id: string;
  orderId: string;
  orderCode: string;
  productId?: string;
  stepId?: string;
  stepName?: string;
  technicianId: string;
  technicianName?: string;
  errorType: ErrorType;
  severity: ErrorSeverity;
  description: string;
  resolution?: string; // How it was resolved
  resolved: boolean;
  resolvedBy?: string;
  resolvedByName?: string;
  resolvedAt?: number;
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  createdByName?: string;
}

export interface FirebaseTechnicalErrors {
  [errorId: string]: TechnicalError;
}

export const ErrorSeverityLabels: Record<ErrorSeverity, string> = {
  [ErrorSeverity.LOW]: "Thấp",
  [ErrorSeverity.MEDIUM]: "Trung bình",
  [ErrorSeverity.HIGH]: "Cao",
  [ErrorSeverity.CRITICAL]: "Nghiêm trọng",
};

export const ErrorTypeLabels: Record<ErrorType, string> = {
  [ErrorType.TECHNICAL]: "Lỗi kỹ thuật",
  [ErrorType.QUALITY]: "Lỗi chất lượng",
  [ErrorType.PROCESS]: "Lỗi quy trình",
  [ErrorType.COMMUNICATION]: "Lỗi giao tiếp",
};

export const ErrorSeverityOptions = [
  { label: "Thấp", value: ErrorSeverity.LOW },
  { label: "Trung bình", value: ErrorSeverity.MEDIUM },
  { label: "Cao", value: ErrorSeverity.HIGH },
  { label: "Nghiêm trọng", value: ErrorSeverity.CRITICAL },
];

export const ErrorTypeOptions = [
  { label: "Lỗi kỹ thuật", value: ErrorType.TECHNICAL },
  { label: "Lỗi chất lượng", value: ErrorType.QUALITY },
  { label: "Lỗi quy trình", value: ErrorType.PROCESS },
  { label: "Lỗi giao tiếp", value: ErrorType.COMMUNICATION },
];


