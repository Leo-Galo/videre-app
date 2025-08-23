
export const expenseCategories = ['Salarios', 'Alquiler', 'Servicios Públicos', 'Marketing', 'Inventario (Compra)', 'Mobiliario y Equipo', 'Impuestos', 'Otro'] as const;

export type ExpenseCategory = typeof expenseCategories[number];

export interface Expense {
  id: string;
  description: string;
  amount: number; // in CRC
  category: ExpenseCategory;
  date: string; // ISO date string
  branchId?: string; // Optional for multi-branch clinics
  notes?: string;
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
  supplierName?: string;
  documentNumber?: string;
}
