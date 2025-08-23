// src/services/superadmin/clinic-service.ts
'use server';

import type { ClinicTenant, ClinicStatus } from '@/types/superadmin';
import type { EditClinicFormValues } from '@/types/superadmin-schemas';
import { subDays } from 'date-fns';

// MOCK DATA SIMULATION
const MOCK_CLINICS_KEY = 'videreSuperAdminClinics';

const initialMockClinics: ClinicTenant[] = [];


const getStoredData = (): ClinicTenant[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(MOCK_CLINICS_KEY);
    if (data) return JSON.parse(data);
    localStorage.setItem(MOCK_CLINICS_KEY, JSON.stringify(initialMockClinics));
    return initialMockClinics;
};

const saveData = (clinics: ClinicTenant[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(MOCK_CLINICS_KEY, JSON.stringify(clinics));
};


export async function getClinics(): Promise<ClinicTenant[]> {
  const clinics = getStoredData();
  return new Promise(resolve => setTimeout(() => resolve(clinics), 50));
}

export async function getClinicById(id: string): Promise<ClinicTenant | null> {
  const clinics = getStoredData();
  const clinic = clinics.find(c => c.id === id) || null;
  return new Promise(resolve => setTimeout(() => resolve(clinic), 50));
}

export async function updateClinicStatus(id: string, newStatus: ClinicStatus): Promise<ClinicTenant | null> {
    let clinics = getStoredData();
    const index = clinics.findIndex(c => c.id === id);
    if (index === -1) return null;
    clinics[index].status = newStatus;
    saveData(clinics);
    return new Promise(resolve => setTimeout(() => resolve(clinics[index]), 50));
}

export async function updateClinic(id: string, updateData: EditClinicFormValues): Promise<ClinicTenant | null> {
    let clinics = getStoredData();
    const index = clinics.findIndex(c => c.id === id);
    if (index === -1) return null;
    clinics[index] = { 
        ...clinics[index], 
        ...updateData,
        nextBillingDate: updateData.nextBillingDate?.toISOString(),
        trialEndDate: updateData.trialEndDate?.toISOString(),
    };
    saveData(clinics);
    return new Promise(resolve => setTimeout(() => resolve(clinics[index]), 50));
}

export async function deleteClinic(id: string): Promise<boolean> {
  let clinics = getStoredData();
  const initialLength = clinics.length;
  clinics = clinics.filter(c => c.id !== id);
  if (clinics.length < initialLength) {
    saveData(clinics);
    return new Promise(resolve => setTimeout(() => resolve(true), 50));
  }
  return false;
}
