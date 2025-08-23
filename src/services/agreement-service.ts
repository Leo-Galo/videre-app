// src/services/agreement-service.ts
'use server';

import type { Agreement } from '@/types/agreement';
import type { AgreementFormValues } from '@/types/agreement-schema';

const AGREEMENTS_STORAGE_KEY = 'videreAgreements';

const initialMockData: Agreement[] = [];

const getStoredData = (): Agreement[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(AGREEMENTS_STORAGE_KEY);
    if (data) return JSON.parse(data);
    localStorage.setItem(AGREEMENTS_STORAGE_KEY, JSON.stringify(initialMockData));
    return initialMockData;
};

const saveData = (agreements: Agreement[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AGREEMENTS_STORAGE_KEY, JSON.stringify(agreements));
};


export async function getAgreements(): Promise<Agreement[]> {
  const agreements = getStoredData();
  return new Promise(resolve => setTimeout(() => resolve(agreements), 50));
}

export async function addAgreement(agreementData: AgreementFormValues): Promise<Agreement> {
  const agreements = getStoredData();
  const newAgreement: Agreement = {
    id: `agr-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...agreementData,
  };
  const updatedAgreements = [newAgreement, ...agreements];
  saveData(updatedAgreements);
  return new Promise(resolve => setTimeout(() => resolve(newAgreement), 50));
}

export async function updateAgreement(agreementId: string, agreementData: AgreementFormValues): Promise<Agreement | null> {
  let agreements = getStoredData();
  const index = agreements.findIndex(a => a.id === agreementId);
  if (index === -1) return null;
  
  const updatedAgreement = { ...agreements[index], ...agreementData, updatedAt: new Date().toISOString() };
  agreements[index] = updatedAgreement;
  saveData(agreements);
  return new Promise(resolve => setTimeout(() => resolve(updatedAgreement), 50));
}

export async function deleteAgreement(agreementId: string): Promise<boolean> {
  let agreements = getStoredData();
  const initialLength = agreements.length;
  agreements = agreements.filter(a => a.id !== agreementId);
  if (initialLength > agreements.length) {
    saveData(agreements);
    return new Promise(resolve => setTimeout(() => resolve(true), 50));
  }
  return false;
}
