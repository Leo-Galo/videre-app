
export type UserRole = "Admin" | "Optómetra" | "Asesor";
export type UserStatus = "Active" | "Inactive";

export interface ClinicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  passwordHash?: string; // Only for simulation, real app would never store this client-side
  lastLogin?: string; // ISO Date string
  createdAt: string; // ISO Date string
  clinicId?: string; // Add clinicId to associate user with a clinic
  disabledModules?: string[]; // Array of module keys that are disabled for this user
}
