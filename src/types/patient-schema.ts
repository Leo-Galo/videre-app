

import { z } from 'zod';
import type { IdentificationType } from './pos';

const identificationTypeOptions: IdentificationType[] = ["Cédula Física", "Cédula Jurídica", "DIMEX", "NITE", "Pasaporte", "Otro"];

export const patientFormSchema = z.object({
  firstName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  lastName: z.string().min(2, { message: "El apellido debe tener al menos 2 caracteres." }),
  personalId: z.string().optional(),
  identificationType: z.enum(identificationTypeOptions as [string, ...string[]]).optional(),
  dateOfBirth: z.date().optional(),
  phone: z.string().optional().refine(val => !val || /^[0-9\s+-]+$/.test(val), { message: "Número de teléfono inválido." }),
  email: z.string().email({ message: "Correo electrónico inválido." }).optional().or(z.literal('')),
  address: z.string().optional(),
  occupation: z.string().optional(),
  referredBy: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional().refine(val => !val || /^[0-9\s+-]+$/.test(val), { message: "Número de teléfono inválido." }),
  notes: z.string().optional(),
  
  // Spectacle Lens - Quick View
  sphericalOD: z.string().optional(),
  sphericalOS: z.string().optional(),
  cylindricalOD: z.string().optional(),
  cylindricalOS: z.string().optional(),
  axisOD: z.string().optional(),
  axisOS: z.string().optional(),
  additionOD: z.string().optional(),
  additionOS: z.string().optional(),
  pd: z.string().optional(),

  // Contact Lens - Quick View
  clBrandOD: z.string().optional(),
  clBcOD: z.string().optional(),
  clDiaOD: z.string().optional(),
  clPowerOD: z.string().optional(),
  clCylOD: z.string().optional(),
  clAxisOD: z.string().optional(),
  
  clBrandOS: z.string().optional(),
  clBcOS: z.string().optional(),
  clDiaOS: z.string().optional(),
  clPowerOS: z.string().optional(),
  clCylOS: z.string().optional(),
  clAxisOS: z.string().optional(),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;

export const prescriptionFormSchema = z.object({
  id: z.string().optional(), 
  date: z.date({ required_error: "La fecha de la prescripción es requerida." }),
  lensType: z.string().optional(),
  lensMaterial: z.string().optional(),
  lensCoatingsInput: z.string().optional(), 
  
  sphericalOD: z.string().optional(),
  cylinderOD: z.string().optional(),
  axisOD: z.string().optional(),
  addOD: z.string().optional(),
  prismOD: z.string().optional(),
  baseOD: z.string().optional(),
  
  sphericalOS: z.string().optional(),
  cylinderOS: z.string().optional(),
  axisOS: z.string().optional(),
  addOS: z.string().optional(),
  prismOS: z.string().optional(),
  baseOS: z.string().optional(),
  
  pd: z.string().optional(),
  pdNear: z.string().optional(),
  vertexDistance: z.string().optional(),
  optometristNotes: z.string().optional(),
  optometristName: z.string().optional(),
  optometristLicense: z.string().optional(),
  expiryDate: z.date().optional(),

  fittingHeightOD: z.string().optional(),
  fittingHeightOS: z.string().optional(),

  frameBrand: z.string().optional(),
  frameModel: z.string().optional(),
  frameColor: z.string().optional(),
  frameMeasurements: z.string().optional(),
  frameNotes: z.string().optional(),

  // Contact Lens Fields
  clMaterial: z.string().optional(),
  clBrandOD: z.string().optional(),
  clBcOD: z.string().optional(),
  clDiaOD: z.string().optional(),
  clPowerOD: z.string().optional(),
  clCylOD: z.string().optional(),
  clAxisOD: z.string().optional(),
  clAddPowerOD: z.string().optional(),
  clColorOD: z.string().optional(),
  
  clBrandOS: z.string().optional(),
  clBcOS: z.string().optional(),
  clDiaOS: z.string().optional(),
  clPowerOS: z.string().optional(),
  clCylOS: z.string().optional(),
  clAxisOS: z.string().optional(),
  clAddPowerOS: z.string().optional(),
  clColorOS: z.string().optional(),

  clMultifocalDesign: z.string().optional(),
  clWearSchedule: z.string().optional(),
  clReplacementSchedule: z.string().optional(),
  clQuantitySupplied: z.string().optional(),
});

export type PrescriptionFormValues = z.infer<typeof prescriptionFormSchema>;

export const clinicalRecordSchema = z.object({
  date: z.date({ required_error: "La fecha es requerida." }),
  notes: z.string().min(5, { message: "Las notas deben tener al menos 5 caracteres." }),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  prescriptions: z.array(prescriptionFormSchema).optional(),
  nextRecommendedVisitDate: z.date().optional(),
  reasonForNextVisit: z.string().optional(),
});
