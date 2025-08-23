// src/services/budget-service.ts
'use server';

import type { ExpenseCategory } from '@/types/finance';

const BUDGET_STORAGE_KEY_PREFIX = 'videreBudget_';

type BudgetData = Record<ExpenseCategory, number>;

export async function getBudget(year: number, month: number): Promise<Partial<BudgetData>> {
    if (typeof window === 'undefined') return {};
    const key = `${BUDGET_STORAGE_KEY_PREFIX}${year}_${month + 1}`;
    const data = localStorage.getItem(key);
    const storedBudget = data ? JSON.parse(data) : {};
    return new Promise(resolve => setTimeout(() => resolve(storedBudget), 50));
}

export async function saveBudget(year: number, month: number, budgetData: Partial<BudgetData>): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const key = `${BUDGET_STORAGE_KEY_PREFIX}${year}_${month + 1}`;
    localStorage.setItem(key, JSON.stringify(budgetData));
    return new Promise(resolve => setTimeout(() => resolve(true), 50));
}
