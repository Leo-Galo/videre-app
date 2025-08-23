
import { z } from 'zod';

export const itemDiscountSchema = z.object({
  type: z.enum(['percentage', 'fixed'], { required_error: "Seleccione un tipo de descuento."}),
  value: z.coerce.number().positive({ message: "El valor del descuento debe ser positivo." }),
  reason: z.string().optional(),
});

export type ItemDiscountFormValues = z.infer<typeof itemDiscountSchema>;
