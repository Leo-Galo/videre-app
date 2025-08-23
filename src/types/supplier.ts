
export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string; // ISO String
}

export interface SupplierMovementItem {
  productId: string;
  productName: string;
  quantity: number;
  costPrice?: number; // Cost per item
}

export interface SupplierMovement {
  id: string;
  type: 'receipt' | 'return';
  supplierId: string;
  supplierName: string;
  date: string; // ISO String
  items: SupplierMovementItem[];
  notes?: string;
  referenceDocument?: string; // e.g., Supplier Invoice # or Return Authorization #
}
