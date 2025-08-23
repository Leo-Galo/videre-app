// src/services/supplier-service.ts
'use server';

import type { Supplier, SupplierMovement } from '@/types/supplier';
import type { SupplierFormValues } from '@/types/supplier-schema';

const SUPPLIERS_STORAGE_KEY = 'videreSuppliers';

const initialMockSuppliers: Supplier[] = [];

const getStoredData = (): Supplier[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(SUPPLIERS_STORAGE_KEY);
    if (data) return JSON.parse(data);
    localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(initialMockSuppliers));
    return initialMockSuppliers;
};

const saveData = (suppliers: Supplier[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(suppliers));
};

export async function getSuppliers(): Promise<Supplier[]> {
    const suppliers = getStoredData();
    return new Promise(resolve => setTimeout(() => resolve(suppliers), 50));
}

export async function getSupplierById(supplierId: string): Promise<Supplier | null> {
    const suppliers = getStoredData();
    const supplier = suppliers.find(s => s.id === supplierId) || null;
    return new Promise(resolve => setTimeout(() => resolve(supplier), 50));
}

export async function addSupplier(supplierData: SupplierFormValues): Promise<Supplier> {
    const suppliers = getStoredData();
    const newSupplier: Supplier = {
        id: `sup-${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...supplierData,
    };
    saveData([newSupplier, ...suppliers]);
    return new Promise(resolve => setTimeout(() => resolve(newSupplier), 50));
}

export async function updateSupplier(supplierId: string, updateData: SupplierFormValues): Promise<Supplier | null> {
    const suppliers = getStoredData();
    const index = suppliers.findIndex(s => s.id === supplierId);
    if (index === -1) return null;
    const updatedSupplier = { ...suppliers[index], ...updateData };
    suppliers[index] = updatedSupplier;
    saveData(suppliers);
    return new Promise(resolve => setTimeout(() => resolve(updatedSupplier), 50));
}

export async function deleteSupplier(supplierId: string): Promise<boolean> {
    let suppliers = getStoredData();
    const originalLength = suppliers.length;
    suppliers = suppliers.filter(s => s.id !== supplierId);
    if (originalLength > suppliers.length) {
        saveData(suppliers);
        return new Promise(resolve => setTimeout(() => resolve(true), 50));
    }
    return false;
}

export async function addSupplierMovement(supplierId: string, movementData: Omit<SupplierMovement, 'id' | 'supplierId' | 'supplierName'>): Promise<boolean> {
    const suppliers = getStoredData();
    const index = suppliers.findIndex(s => s.id === supplierId);
    if (index === -1) return false;

    const supplier = suppliers[index];
    const newMovement: SupplierMovement = {
        id: `mov-${Date.now()}`,
        supplierId: supplier.id,
        supplierName: supplier.name,
        ...movementData,
    };

    supplier.movements = [newMovement, ...(supplier.movements || [])];
    saveData(suppliers);
    return new Promise(resolve => setTimeout(() => resolve(true), 50));
}
