// src/services/expense-service.ts
'use server';

import type { Expense, ExpenseCategory } from '@/types/finance';
import type { ExpenseFormValues } from '@/types/expense-schema';
import { expenseCategories } from '@/types/finance';

const EXPENSES_STORAGE_KEY = 'videreExpenses';

const initialMockExpenses: Expense[] = [];

const getStoredData = (): Expense[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (data) return JSON.parse(data);
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(initialMockExpenses));
    return initialMockExpenses;
};

const saveData = (expenses: Expense[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
};


export async function getExpenses(): Promise<Expense[]> {
  const expenses = getStoredData();
  return new Promise(resolve => setTimeout(() => resolve(expenses), 50));
}

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  return Promise.resolve([...expenseCategories]);
}

export async function addExpense(expenseData: ExpenseFormValues): Promise<Expense | null> {
    const expenses = getStoredData();
    const newExpense: Expense = {
        id: `exp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...expenseData,
        date: expenseData.date.toISOString(),
        category: expenseData.category as ExpenseCategory, // Cast as it's validated by schema
    };
    const updatedExpenses = [newExpense, ...expenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    saveData(updatedExpenses);
    return new Promise(resolve => setTimeout(() => resolve(newExpense), 50));
}

export async function updateExpense(expenseId: string, expenseData: ExpenseFormValues): Promise<Expense | null> {
  let expenses = getStoredData();
  const index = expenses.findIndex(e => e.id === expenseId);
  if (index === -1) return null;
  
  const updatedExpense = {
    ...expenses[index],
    ...expenseData,
    date: expenseData.date.toISOString(),
    category: expenseData.category as ExpenseCategory,
    updatedAt: new Date().toISOString(),
  };
  expenses[index] = updatedExpense;
  saveData(expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  return new Promise(resolve => setTimeout(() => resolve(updatedExpense), 50));
}

export async function deleteExpense(expenseId: string): Promise<boolean> {
  let expenses = getStoredData();
  const originalLength = expenses.length;
  expenses = expenses.filter(e => e.id !== expenseId);
  if (originalLength > expenses.length) {
    saveData(expenses);
    return new Promise(resolve => setTimeout(() => resolve(true), 50));
  }
  return false;
}
