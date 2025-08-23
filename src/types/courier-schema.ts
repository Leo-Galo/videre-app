import { z } from 'zod';

const courierItemSchema = z.object({
  description: z.string().min(3, "La descripción es requerida."),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a 0."),
  sku: z.string().optional(),
});

export const courierJobFormSchema = z.object({
  destinationType: z.enum(['Cliente', 'Sucursal', 'Proveedor', 'Otro'], { required_error: "El tipo de destino es requerido." }),
  destinationName: z.string().min(3, "El nombre del destino es requerido."),
  destinationAddress: z.string().min(10, "La dirección es requerida.").optional().or(z.literal('')),
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  items: z.array(courierItemSchema).min(1, "Debe añadir al menos un ítem."),
  notes: z.string().optional(),
  courierService: z.string().optional(),
  externalTrackingNumber: z.string().optional(),
  linkedDocumentType: z.enum(['Factura', 'Orden de Laboratorio', 'Traslado']).optional(),
  linkedDocumentId: z.string().optional(),
}).refine(data => (data.linkedDocumentId && data.linkedDocumentType) || (!data.linkedDocumentId && !data.linkedDocumentType), {
  message: "Debe seleccionar un tipo de documento si proporciona un ID.",
  path: ["linkedDocumentType"],
});


export type CourierJobFormValues = z.infer<typeof courierJobFormSchema>;
