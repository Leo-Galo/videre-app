
import { z } from 'zod';

export const supplierFormSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  contactName: z.string().optional(),
  email: z.string().email({ message: "Correo electrónico inválido." }).optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;
