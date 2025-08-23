

export type PettyCashExpenseStatus = 'pending' | 'liquidated';
export type PettyCashExpenseCategory = 'transporte' | 'alimentos' | 'suministros_limpieza' | 'suministros_oficina' | 'reparaciones_menores' | 'otros';

export const pettyCashCategories: { value: PettyCashExpenseCategory; label: string }[] = [
    { value: 'transporte', label: 'Transporte (pases, taxi)' },
    { value: 'alimentos', label: 'Alimentos y Bebidas (café, almuerzos)' },
    { value: 'suministros_limpieza', label: 'Suministros de Limpieza Menores' },
    { value: 'suministros_oficina', label: 'Suministros de Oficina Menores' },
    { value: 'reparaciones_menores', label: 'Reparaciones Menores' },
    { value: 'otros', label: 'Otros Gastos Menores' },
];

export interface PettyCashExpense {
  id: string;
  date: string; // ISO String
  description: string;
  amount: number;
  category: PettyCashExpenseCategory;
  status: PettyCashExpenseStatus;
  liquidationId?: string; // Link to the liquidation it belongs to
  createdBy: string; // User who registered the expense
  supplierName?: string;
  documentNumber?: string;
}

export interface PettyCashLiquidation {
  id: string;
  liquidationDate: string; // ISO String
  totalAmount: number;
  responsibleUser: string;
  expenseIds: string[]; // List of expense IDs included
  createdAt: string; // ISO String
  // For summary report page
  initialAmount: number;
  finalBalance: number;
  startDate: string;
  endDate: string;
  notes?: string;
}
