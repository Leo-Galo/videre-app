
import { z } from 'zod';

export const agreementFormSchema = z.object({
  companyName: z.string().min(3, "El nombre de la empresa debe tener al menos 3 caracteres."),
  contactName: z.string().optional(),
  contactEmail: z.string().email("Correo electrónico inválido.").optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed'], { required_error: "Seleccione un tipo." }),
  discountValue: z.coerce.number().positive("El valor debe ser positivo."),
  notes: z.string().optional(),
  status: z.enum(['Active', 'Inactive'], { required_error: "El estado es requerido." }),
});

export type AgreementFormValues = z.infer<typeof agreementFormSchema>;
