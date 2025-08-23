// src/services/coupon-service.ts
'use server';

import type { Coupon } from '@/types/marketing';
import type { CouponFormValues } from '@/types/coupon-schema';

const COUPONS_STORAGE_KEY = 'videreCoupons';

const initialMockCoupons: Coupon[] = [];

const getStoredData = (): Coupon[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(COUPONS_STORAGE_KEY);
    if (data) return JSON.parse(data);
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(initialMockCoupons));
    return initialMockCoupons;
};

const saveData = (coupons: Coupon[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(coupons));
};


export async function getCoupons(): Promise<Coupon[]> {
  const coupons = getStoredData();
  return new Promise(resolve => setTimeout(() => resolve(coupons), 50));
}

export async function addCoupon(couponData: CouponFormValues): Promise<Coupon | null> {
  const coupons = getStoredData();
  const newCoupon: Coupon = {
    id: `cup-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...couponData,
    startDate: couponData.startDate?.toISOString(),
    endDate: couponData.endDate?.toISOString(),
  };
  const updatedCoupons = [newCoupon, ...coupons];
  saveData(updatedCoupons);
  return new Promise(resolve => setTimeout(() => resolve(newCoupon), 50));
}

export async function updateCoupon(couponId: string, couponData: CouponFormValues): Promise<Coupon | null> {
  let coupons = getStoredData();
  const index = coupons.findIndex(c => c.id === couponId);
  if (index === -1) return null;
  const updatedCoupon = { 
      ...coupons[index], 
      ...couponData, 
      updatedAt: new Date().toISOString(),
      startDate: couponData.startDate?.toISOString(),
      endDate: couponData.endDate?.toISOString(),
  };
  coupons[index] = updatedCoupon;
  saveData(coupons);
  return new Promise(resolve => setTimeout(() => resolve(updatedCoupon), 50));
}

export async function deleteCoupon(couponId: string): Promise<boolean> {
  let coupons = getStoredData();
  const originalLength = coupons.length;
  coupons = coupons.filter(c => c.id !== couponId);
  if (originalLength > coupons.length) {
    saveData(coupons);
    return new Promise(resolve => setTimeout(() => resolve(true), 50));
  }
  return false;
}
