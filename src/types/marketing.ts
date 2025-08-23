
export interface Coupon {
  id: string;
  code: string;
  description?: string;
  type: 'percentage' | 'fixed'; // Porcentaje o monto fijo en CRC
  value: number; // El valor del porcentaje (ej. 10 para 10%) o el monto fijo
  isActive: boolean;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  minPurchaseAmountCRC?: number; // Monto mínimo de compra para que aplique
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
}
