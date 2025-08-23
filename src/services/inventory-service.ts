
// src/services/inventory-service.ts
'use server';

import type { Product } from '@/types/pos';
import type { ProductFormValues } from '@/types/inventory-schema';
import { getTagConfig } from '@/config/discounts';

// MOCK DATA SIMULATION
const MOCK_PRODUCTS_KEY = 'videreMockProducts';

const initialMockProducts: Product[] = [];

export const getStoredProducts = (): Product[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(MOCK_PRODUCTS_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {
             console.error("Failed to parse products from localStorage, using initial data.", e);
        }
    }
    localStorage.setItem(MOCK_PRODUCTS_KEY, JSON.stringify(initialMockProducts));
    return initialMockProducts;
}

export const saveStoredProducts = (products: Product[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(MOCK_PRODUCTS_KEY, JSON.stringify(products));
}

export async function getProducts(): Promise<Product[]> {
    const products = getStoredProducts();
    return new Promise(resolve => setTimeout(() => resolve(products), 50));
}

export async function getProductById(productId: string): Promise<Product | null> {
    const products = getStoredProducts();
    const product = products.find(p => p.id === productId) || null;
    return new Promise(resolve => setTimeout(() => resolve(product), 50));
}

export async function addProduct(productData: ProductFormValues): Promise<Product | null> {
    const products = getStoredProducts();
    const allBranches = await getBranches();
    const selectedBranch = allBranches.find(b => b.id === productData.branchId);

    const newProduct: Product = {
      id: `prod${Date.now()}`,
      ...productData,
      price: Number(productData.price),
      stock: Number(productData.stock),
      costPrice: productData.costPrice !== '' ? Number(productData.costPrice) : undefined,
      lowStockThreshold: productData.lowStockThreshold !== '' ? Number(productData.lowStockThreshold) : undefined,
      imageUrl: productData.imageUrl || 'https://placehold.co/300x200.png',
      expiryDate: productData.expiryDate?.toISOString().split('T')[0],
      tag: productData.tag || 'Ninguna',
      ivaRate: 0.13, // Default IVA rate
      branchName: selectedBranch?.name
    };
    
    saveStoredProducts([newProduct, ...products]);
    return new Promise(resolve => setTimeout(() => resolve(newProduct), 50));
}

export async function updateProduct(product: Product): Promise<Product | null> {
    let products = getStoredProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index === -1) return null;

    products[index] = product;
    saveStoredProducts(products);
    return new Promise(resolve => setTimeout(() => resolve(product), 50));
}

export async function deleteProduct(productId: string): Promise<boolean> {
  let products = getStoredProducts();
  const initialLength = products.length;
  products = products.filter(p => p.id !== productId);
  if (products.length < initialLength) {
    saveStoredProducts(products);
    return new Promise(resolve => setTimeout(() => resolve(true), 50));
  }
  return false;
}


// --- BRANCHES ---
interface BranchInfo { id: string; name: string; address?: string; phone?: string; }
const MOCK_BRANCHES_KEY = 'videreMockBranches';
const mockBranches: BranchInfo[] = [];

const getStoredBranches = (): BranchInfo[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(MOCK_BRANCHES_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(MOCK_BRANCHES_KEY, JSON.stringify(mockBranches));
    return mockBranches;
};

export async function getBranches(): Promise<BranchInfo[]> {
    const branches = getStoredBranches();
    return new Promise(resolve => setTimeout(() => resolve(branches), 50));
}

export async function addBranch(branchData: Omit<BranchInfo, 'id'>): Promise<BranchInfo | null> {
    const branches = await getBranches();
    const newBranch: BranchInfo = {
      id: `branch-${Date.now()}`,
      ...branchData,
    };
    localStorage.setItem(MOCK_BRANCHES_KEY, JSON.stringify([...branches, newBranch]));
    return new Promise(resolve => setTimeout(() => resolve(newBranch), 50));
}

export async function updateBranch(branchId: string, updateData: Omit<BranchInfo, 'id'>): Promise<BranchInfo | null> {
    let branches = await getBranches();
    const index = branches.findIndex(b => b.id === branchId);
    if (index === -1) return null;
    const updatedBranch = { ...branches[index], ...updateData };
    branches[index] = updatedBranch;
    localStorage.setItem(MOCK_BRANCHES_KEY, JSON.stringify(branches));
    return new Promise(resolve => setTimeout(() => resolve(updatedBranch), 50));
}

export async function deleteBranch(branchId: string): Promise<boolean> {
    let branches = await getBranches();
    const initialLength = branches.length;
    branches = branches.filter(b => b.id !== branchId);
    if (branches.length < initialLength) {
        localStorage.setItem(MOCK_BRANCHES_KEY, JSON.stringify(branches));
        return new Promise(resolve => setTimeout(() => resolve(true), 50));
    }
    return false;
}
