
import { z } from 'zod';

export const couponFormSchema = z.object({
  code: z.string().min(3, "El código debe tener al menos 3 caracteres.").max(20, "Máximo 20 caracteres.").regex(/^[A-Z0-9]+$/, "Solo mayúsculas y números."),
  description: z.string().optional(),
  type: z.enum(['percentage', 'fixed'], { required_error: "Seleccione un tipo." }),
  value: z.coerce.number().positive("El valor debe ser positivo."),
  isActive: z.boolean().default(true),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  minPurchaseAmountCRC: z.coerce.number().nonnegative("Debe ser no negativo.").optional(),
}).refine(data => !data.endDate || !data.startDate || data.endDate >= data.startDate, {
  message: "La fecha de fin no puede ser anterior a la fecha de inicio.",
  path: ["endDate"],
});

export type CouponFormValues = z.infer<typeof couponFormSchema>;
