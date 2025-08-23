
import { z } from 'zod';

export const labOrderFormSchema = z.object({
  patientId: z.string().min(1, "Debe seleccionar un paciente."),
  prescriptionId: z.string().min(1, "Debe seleccionar una prescripción."),
  labName: z.string().min(3, { message: "El nombre del laboratorio es requerido." }),
  notes: z.string().optional(),
});

export type LabOrderFormValues = z.infer<typeof labOrderFormSchema>;
