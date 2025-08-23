
import { z } from 'zod';

export const startPettyCashSchema = z.object({
  initialAmount: z.coerce.number().positive("El monto inicial debe ser mayor a cero."),
});
export type StartPettyCashValues = z.infer<typeof startPettyCashSchema>;


export const addPettyCashExpenseSchema = z.object({
  date: z.date({ required_error: "La fecha es requerida." }),
  description: z.string().min(3, "La descripción es requerida."),
  amount: z.coerce.number().positive("El monto debe ser positivo."),
  supplierName: z.string().optional(),
  documentNumber: z.string().optional(),
});
export type AddPettyCashExpenseValues = z.infer<typeof addPettyCashExpenseSchema>;

export const liquidatePettyCashSchema = z.object({
  finalCashCount: z.coerce.number().nonnegative("El conteo no puede ser negativo."),
  notes: z.string().optional(),
});

export type LiquidatePettyCashValues = z.infer<typeof liquidatePettyCashSchema>;
