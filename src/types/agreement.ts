
export interface Agreement {
  id: string;
  companyName: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  notes?: string;
  status: 'Active' | 'Inactive';
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
}
