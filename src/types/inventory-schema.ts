
import { z } from 'zod';
import { PRODUCT_TAGS } from '@/config/discounts';

export const productFormSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  sku: z.string().optional(),
  category: z.string().min(2, { message: "La categoría es requerida." }),
  description: z.string().optional(),
  price: z.coerce.number().positive({ message: "El precio de venta debe ser un número positivo." }),
  costPrice: z.union([z.coerce.number().nonnegative({ message: "El precio de costo no puede ser negativo." }), z.literal('')]).optional(),
  stock: z.coerce.number().int().nonnegative({ message: "El stock debe ser un número entero no negativo." }),
  supplier: z.string().optional(),
  lowStockThreshold: z.union([z.coerce.number().int().nonnegative({ message: "El umbral debe ser un número entero no negativo." }), z.literal('')]).optional(),
  imageUrl: z.string().optional(),
  dataAiHint: z.string().max(50, {message: "Máximo 50 caracteres para el hint."}).optional(),
  branchId: z.string().optional(), 
  expiryDate: z.date().optional(),
  tag: z.enum(PRODUCT_TAGS as [string, ...string[]]).optional().default('Ninguna'),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const quickStockAdjustmentSchema = z.object({
  newStock: z.coerce.number().int().nonnegative({ message: "El stock debe ser un número entero no negativo." }),
  reason: z.string().min(5, { message: "El motivo debe tener al menos 5 caracteres." }).max(200, { message: "El motivo no puede exceder los 200 caracteres." }),
});

export type QuickStockAdjustmentFormValues = z.infer<typeof quickStockAdjustmentSchema>;

const transferItemSchema = z.object({
  productId: z.string().min(1, "Debe seleccionar un producto."),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a 0."),
});

export const transferFormSchema = z.object({
  fromBranchId: z.string().min(1, "Debe seleccionar una sucursal de origen."),
  toBranchId: z.string().min(1, "Debe seleccionar una sucursal de destino."),
  items: z.array(transferItemSchema).min(1, "Debe añadir al menos un producto al traslado."),
  notes: z.string().optional(),
}).refine(data => data.fromBranchId !== data.toBranchId, {
  message: "La sucursal de origen y destino no pueden ser la misma.",
  path: ["toBranchId"], 
});

export type TransferFormValues = z.infer<typeof transferFormSchema>;

const adjustmentReasons = ["Dañado", "Vencido", "Pérdida", "Uso Interno", "Corrección de Conteo", "Otro"] as const;

export const damageLossSchema = z.object({
  quantityToRemove: z.coerce
    .number()
    .int()
    .positive({ message: "La cantidad debe ser mayor a 0." }),
  reason: z.enum(adjustmentReasons, { required_error: "El motivo es requerido." }),
  notes: z.string().optional(),
});

export type DamageLossFormValues = z.infer<typeof damageLossSchema>;
