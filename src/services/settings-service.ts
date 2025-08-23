// src/services/settings-service.ts
'use server';

import type { DiscountTagConfig } from '@/config/discounts';

// Mocked Categories
const initialCategories = [
  "Armazones Oftálmicos", "Lentes de Sol", "Lentes de Contacto", 
  "Soluciones para Lentes de Contacto", "Gotas Oftálmicas / Lágrimas Artificiales", 
  "Accesorios para Gafas", "Servicios", "Otro"
];

// Mocked Tags
const initialTags: DiscountTagConfig[] = [
    { name: 'Ninguna', discountPercentage: 0, badgeClass: '' },
    { name: 'Roja', discountPercentage: 50, badgeClass: 'bg-red-500 hover:bg-red-500/80' },
    { name: 'Amarilla', discountPercentage: 30, badgeClass: 'bg-yellow-400 text-yellow-950 hover:bg-yellow-400/80' },
    { name: 'Verde', discountPercentage: 20, badgeClass: 'bg-green-500 hover:bg-green-500/80' },
];

const CATEGORIES_KEY = 'videreProductCategories';
const TAGS_KEY = 'videreDiscountTags';


const getStoredData = <T>(key: string, initialData: T): T => {
  if (typeof window === 'undefined') return initialData;
  try {
    const item = window.localStorage.getItem(key);
    if (item) return JSON.parse(item);
    window.localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return initialData;
  }
};

const saveData = <T>(key: string, data: T) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(data));
};

export async function getProductCategories(): Promise<string[]> {
  const categories = getStoredData(CATEGORIES_KEY, initialCategories);
  return new Promise(resolve => setTimeout(() => resolve(categories), 50));
}

export async function saveProductCategories(categories: string[]): Promise<boolean> {
  saveData(CATEGORIES_KEY, categories);
  return new Promise(resolve => setTimeout(() => resolve(true), 50));
}

export async function getDiscountTags(): Promise<DiscountTagConfig[]> {
  const tags = getStoredData(TAGS_KEY, initialTags);
  return new Promise(resolve => setTimeout(() => resolve(tags), 50));
}

export async function saveDiscountTags(tags: DiscountTagConfig[]): Promise<boolean> {
  saveData(TAGS_KEY, tags);
  return new Promise(resolve => setTimeout(() => resolve(true), 50));
}
