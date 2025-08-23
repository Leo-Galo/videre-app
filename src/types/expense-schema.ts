
import { z } from 'zod';

export const expenseFormSchema = z.object({
  description: z.string().min(3, "La descripción debe tener al menos 3 caracteres."),
  amount: z.coerce.number().positive("El monto debe ser un número positivo."),
  category: z.string().min(1, { message: "La categoría es requerida." }),
  date: z.date({ required_error: "La fecha es requerida." }),
  notes: z.string().optional(),
  supplierName: z.string().optional(),
  documentNumber: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
