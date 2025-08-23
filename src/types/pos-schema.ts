import { z } from 'zod';

const parseLocaleFloat = (value?: string | number): number => {
    if (value === undefined || value === null) return 0;
    let numStr = String(value).trim();
    if (numStr === "") return 0;
    
    numStr = numStr.replace(/\s/g, ''); 
    const hasComma = numStr.includes(',');
    const hasDot = numStr.includes('.');

    if (hasComma && hasDot) { 
      if (numStr.lastIndexOf(',') > numStr.lastIndexOf('.')) { 
        numStr = numStr.replace(/\./g, '').replace(',', '.');
      } else {
        numStr = numStr.replace(/,/g, '');
      }
    } else if (hasComma) {
      numStr = numStr.replace(',', '.');
    }
    const num = parseFloat(numStr);
    return isNaN(num) ? 0 : num;
};

export const posFormSchema = z.object({
  orderNotes: z.string().optional(),
  preferredDocumentType: z.enum(['electronic_invoice', 'electronic_ticket', 'proforma_invoice', 'internal_sale_receipt']),
  editableExchangeRateUSD: z.coerce.number().positive("El tipo de cambio debe ser positivo.").default(512.15),
  
  billingEmail: z.string().email("Correo de facturación inválido.").optional().or(z.literal('')),
  
  cashCRCAmount: z.string().optional(),
  cashUSDAmount: z.string().optional(),
  
  cardCRCAmount: z.string().optional(),
  cardReference: z.string().optional(),
  
  sinpeCRCAmount: z.string().optional(),
  sinpeReference: z.string().optional(),
  
  transferCRCAmount: z.string().optional(),
  transferReference: z.string().optional(),
  transferVerified: z.boolean().default(false).optional(),

}).superRefine((data, ctx) => {
  const cardAmountNum = parseLocaleFloat(data.cardCRCAmount);
  if (cardAmountNum > 0 && (!data.cardReference || data.cardReference.trim() === "")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ref. tarjeta req.", path: ["cardReference"] });
  }
  const sinpeAmountNum = parseLocaleFloat(data.sinpeCRCAmount);
  if (sinpeAmountNum > 0 && (!data.sinpeReference || data.sinpeReference.trim() === "")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ref. SINPE req.", path: ["sinpeReference"] });
  }
  const transferAmountNum = parseLocaleFloat(data.transferCRCAmount);
  if (transferAmountNum > 0) {
    if (!data.transferReference || data.transferReference.trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ref. transferencia req.", path: ["transferReference"] });
    }
  }
  const cashCRCAmt = parseLocaleFloat(data.cashCRCAmount);
  const cashUSDAmt = parseLocaleFloat(data.cashUSDAmount);
  if (cashCRCAmt < 0 || cashUSDAmt < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Monto en efectivo no puede ser negativo.", path: ["cashCRCAmount"] });
  }
});

export type PosFormValues = z.infer<typeof posFormSchema>;

export const returnItemSchema = z.object({
  orderItemId: z.string(), 
  productId: z.string(),
  productName: z.string(),
  originalQuantity: z.number(),
  alreadyReturned: z.number().default(0),
  quantityToReturn: z.coerce.number().int().nonnegative("Debe ser no negativo.").default(0),
});

export const returnFormSchema = z.object({
  items: z.array(returnItemSchema),
  generalReturnReason: z.string().min(5, "El motivo general es requerido.").max(250, "Máximo 250 caracteres."),
}).refine(data => data.items.some(item => (item.quantityToReturn || 0) > 0), {
  message: "Debe seleccionar al menos un ítem y cantidad para devolver.",
  path: ["items"],
});

export type ReturnFormValues = z.infer<typeof returnFormSchema>;
