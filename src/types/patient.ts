

import type { IdentificationType } from "./pos";

export interface Prescription {
  id: string;
  date: string; // ISO string date for when the prescription was issued

  // Spectacle Lens Details
  lensType?: string; // e.g., "Monofocal", "Bifocal", "Progresivo Digital FreeForm"
  lensMaterial?: string; // e.g., "CR-39", "Policarbonato", "Alto Índice 1.67"
  lensCoatings?: string[]; // e.g., ["Antireflejo", "Filtro Azul", "Fotocromático"]
  lensCoatingsInput?: string; // Raw input for coatings, to be parsed
  
  sphericalOD?: string; // Spherical power - Right Eye
  cylinderOD?: string; // Cylindrical power - Right Eye
  axisOD?: string; // Axis - Right Eye
  addOD?: string; // Addition for bifocals/progressives - Right Eye
  prismOD?: string; // Prism power - Right Eye
  baseOD?: string; // Prism base direction - Right Eye

  sphericalOS?: string; // Spherical power - Left Eye
  cylinderOS?: string; // Cylindrical power - Left Eye
  axisOS?: string; // Axis - Left Eye
  addOS?: string; // Addition for bifocals/progressives - Left Eye
  prismOS?: string; // Prism power - Left Eye
  baseOS?: string; // Prism base direction - Left Eye

  pd?: string; // Pupillary Distance (Total, or could be R/L if needed)
  pdNear?: string; // Near Pupillary Distance (optional)
  vertexDistance?: string; // Vertex Distance (optional, mm)
  
  optometristNotes?: string; // General notes from the optometrist for this prescription
  optometristName?: string; // Name of the prescribing optometrist
  optometristLicense?: string; // License number of the optometrist
  expiryDate?: string; // ISO string date - When the prescription expires

  fittingHeightOD?: string; // Fitting Height - Right Eye (for progressives)
  fittingHeightOS?: string; // Fitting Height - Left Eye (for progressives)
  
  // Frame Details (if applicable)
  frameBrand?: string;
  frameModel?: string;
  frameColor?: string;
  frameMeasurements?: string; // e.g., "52-18-140" (eye size, bridge width, temple length)
  frameNotes?: string; // Any specific notes about the frame selected or recommended

  // Contact Lens Details (if applicable)
  clMaterial?: string; // Contact Lens Material (e.g., "Silicone Hydrogel")
  clBrandOD?: string; // Contact Lens Brand - Right Eye
  clBrandOS?: string; // Contact Lens Brand - Left Eye
  clBcOD?: string; // Base Curve - Right Eye
  clBcOS?: string; // Base Curve - Left Eye
  clDiaOD?: string; // Diameter - Right Eye
  clDiaOS?: string; // Diameter - Left Eye
  clPowerOD?: string; // Power (Sphere or Spherical Equivalent) - Right Eye
  clPowerOS?: string; // Power (Sphere or Spherical Equivalent) - Left Eye
  clCylOD?: string; // Cylinder (if toric) - Right Eye
  clCylOS?: string; // Cylinder (if toric) - Left Eye
  clAxisOD?: string; // Axis (if toric) - Right Eye
  clAxisOS?: string; // Axis (if toric) - Left Eye
  clAddPowerOD?: string; // Addition power for multifocal CLs - Right Eye
  clAddPowerOS?: string; // Addition power for multifocal CLs - Left Eye
  clMultifocalDesign?: string; // e.g., "Center Near", "Center Distance"
  clWearSchedule?: string; // e.g., "Uso Diario", "Uso Extendido"
  clReplacementSchedule?: string; // e.g., "Mensual", "Quincenal", "Diario Desechable"
  clQuantitySupplied?: string; // e.g., "Caja de 6", "Suministro para 3 meses"
  clColorOD?: string;
  clColorOS?: string;
  
  // For internal use / UI linking
  clinicalRecordId?: string; // ID of the clinical record this prescription belongs to
}

export interface ClinicalRecord {
  id: string;
  date: string; // ISO string date
  notes: string;
  diagnosis?: string;
  treatment?: string;
  prescriptions: Prescription[]; // Ensure this is always an array
  attachments?: { name: string; url: string }[]; // Optional for files
  nextRecommendedVisitDate?: string; // ISO string date
  reasonForNextVisit?: string;
  // For global view
  patientId?: string;
  patientName?: string;
}

export interface Patient {
  id: string; // Unique identifier
  firstName: string;
  lastName: string;
  personalId?: string; // Cédula o DNI
  identificationType?: IdentificationType;
  dateOfBirth?: string; // ISO string date
  phone?: string;
  email?: string;
  address?: string;
  occupation?: string;
  referredBy?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  registrationDate: string; // ISO string date
  lastVisitDate?: string; // ISO string date
  clinicalHistory: ClinicalRecord[]; // Ensure this is always an array
  
  // Quick-view prescription values
  sphericalOD?: string;
  sphericalOS?: string;
  cylindricalOD?: string;
  cylindricalOS?: string;
  axisOD?: string;
  axisOS?: string;
  additionOD?: string;
  additionOS?: string;
  pd?: string; 
  
  // Quick-view contact lens data
  clBrandOD?: string;
  clBcOD?: string;
  clDiaOD?: string;
  clPowerOD?: string;
  clCylOD?: string;
  clAxisOD?: string;
  clBrandOS?: string;
  clBcOS?: string;
  clDiaOS?: string;
  clPowerOS?: string;
  clCylOS?: string;
  clAxisOS?: string;
  
  notes?: string; // General notes for the patient

  // For overall next visit tracking, updated by latest clinical record
  overallNextRecommendedVisitDate?: string; 
  overallReasonForNextVisit?: string;
}
