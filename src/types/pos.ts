

import type { Coupon } from './marketing';
import type { ProductTag } from '@/config/discounts';

// Redefining Product for Videre (Optics) context
export type ProductCategory = 
  | "Armazones Oftálmicos"
  | "Lentes de Sol"
  | "Lentes de Contacto"
  | "Soluciones para Lentes de Contacto"
  | "Gotas Oftálmicas / Lágrimas Artificiales"
  | "Accesorios para Gafas"
  | "Baterías para Audífonos"
  | "Suplementos Visuales"
  | "Material de Gabinete / Consumibles"
  | "Servicios"
  | "Otro";

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number; // Unit price (BEFORE TAX)
  costPrice?: number | '' | null;
  category: string; 
  sku?: string;
  stock: number;
  imageUrl?: string;
  dataAiHint?: string;
  branchId?: string;
  branchName?: string;
  supplier?: string;
  lowStockThreshold?: number | '' | null;
  expiryDate?: string;
  requiresPrescription?: boolean;
  ivaRate: number; // e.g., 0.13 for 13%, 0.04 for 4%, 0 for exempt/unaffected
  tag?: ProductTag;
}

export interface CartItem extends Product {
  quantity: number;
  prescriptionVerified?: boolean;
  // Calculated fields for cart display and totals
  lineSubtotalWithoutTax: number; // Calculated: price * quantity
  lineTaxAmount: number;          // Calculated: lineSubtotalWithoutTax * ivaRate
  lineTotalWithTax: number;       // Calculated: lineSubtotalWithoutTax + lineTaxAmount
}


export interface OrderItemDiscount {
  type: 'percentage' | 'fixed';
  value: number;
  amountApplied: number;
  reason?: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  unitPrice: number; // Price before tax
  subtotal: number; // Subtotal after item discount, before tax
  discount?: OrderItemDiscount;
  prescriptionDetails?: string;
}

export type IdentificationType = "Cédula Física" | "Cédula Jurídica" | "DIMEX" | "NITE" | "Pasaporte" | "Otro";

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  identification?: string;
  identificationType?: IdentificationType;
  address?: string;
  clinicalRecords?: any[]; // Simplified for POS context
}

export type PaymentMethod = "cash" | "card" | "sinpe" | "transfer";
export type Currency = "CRC" | "USD";
export type DocumentType = 'electronic_invoice' | 'electronic_ticket' | 'proforma_invoice' | 'internal_sale_receipt';
export type OrderStatus =
  | 'pending_payment'
  | 'processing_payment'
  | 'completed'
  | 'cancelled'
  | 'partially_returned'
  | 'fully_returned'
  | 'voided'
  | 'partially_paid';

export interface AppliedCouponInfo {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  amountAppliedCRC: number;
}

export interface ReturnedItemInfo {
  productId: string;
  productName: string;
  quantityReturned: number;
  originalOrderItemId?: string;
}

export interface PaymentDetail {
  method: PaymentMethod;
  amountCRC: number;
  reference?: string;
  transferVerified?: boolean;
  currencyPaid?: Currency;
  amountInCurrency?: number;
  exchangeRateApplied?: number;
  cashReceived?: number;
  cashChange?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  customer?: Customer;
  billingEmail?: string;
  subtotalOriginalCRC: number;
  itemsDiscountAmountCRC: number;
  subtotalAfterItemDiscountsCRC: number;
  couponApplied?: AppliedCouponInfo;
  orderDiscountAmountCRC: number;
  baseForTaxCRC: number;
  taxAmountCRC: number;
  totalCRC: number;
  documentTypeGenerated?: DocumentType;
  clave?: string;
  consecutivo?: string;
  payments: PaymentDetail[];
  amountPaidTotalCRC: number;
  balanceDueCRC: number;
  status: OrderStatus;
  createdAt: string;
  completedAt?: string;
  notes?: string;
  returnedItems?: ReturnedItemInfo[];
  returnReason?: string;
  creditNoteId?: string;
  voidReason?: string;
  voidedAt?: string;
  updatedAt?: string;
  sellerName?: string;
  optometrist?: string;
}

    