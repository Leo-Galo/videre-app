
import { z } from 'zod';

export const branchFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export type BranchFormValues = z.infer<typeof branchFormSchema>;
