
export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "pending_confirmation";
export type AppointmentType = 
  | "Examen Visual General" 
  | "Examen Lentes de Contacto"
  | "Seguimiento" 
  | "Adaptación Lentes Progresivos"
  | "Consulta Especializada"
  | "Retiro/Ajuste de Lentes"
  | "Otro";

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  optometristId?: string; // Optional for initial assignment
  optometristName?: string; // Name of the assigned optometrist
  dateTime: string; // ISO string for date and time
  durationMinutes?: number; // Duration of the appointment in minutes
  type: AppointmentType;
  notes?: string;
  status: AppointmentStatus;
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
  cancellationReason?: string; // If cancelled
}

