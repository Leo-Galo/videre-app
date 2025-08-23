// src/services/petty-cash-service.ts
'use server';

import type { PettyCashLiquidation } from '@/types/petty-cash';

const LIQUIDATIONS_STORAGE_KEY = 'viderePettyCashLiquidations';

const initialLiquidations: PettyCashLiquidation[] = []; // Start with no history

const getStoredLiquidations = (): PettyCashLiquidation[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(LIQUIDATIONS_STORAGE_KEY);
    return data ? JSON.parse(data) : initialLiquidations;
};

const saveStoredLiquidations = (liquidations: PettyCashLiquidation[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LIQUIDATIONS_STORAGE_KEY, JSON.stringify(liquidations));
};


export async function getLiquidationHistory(): Promise<PettyCashLiquidation[]> {
    const liquidations = getStoredLiquidations();
    // Simulate API delay
    return new Promise(resolve => setTimeout(() => resolve(liquidations), 50));
}

// In a real app, you would have functions like:
// - addPettyCashExpense
// - createPettyCashLiquidation
// - etc.
