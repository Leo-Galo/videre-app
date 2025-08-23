
// src/services/patient-service.ts
'use server';

import type { Patient, ClinicalRecord } from '@/types/patient';
import type { PatientFormValues, PrescriptionFormValues } from '@/types/patient-schema';
import { subDays, subYears, addDays } from 'date-fns';

// MOCK DATA SIMULATION
const MOCK_PATIENTS_KEY = 'videreMockPatients';

const getStoredPatients = (): Patient[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(MOCK_PATIENTS_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {
            console.error("Failed to parse patients from localStorage, using initial data.", e);
        }
    }
    localStorage.setItem(MOCK_PATIENTS_KEY, JSON.stringify([]));
    return [];
}

const saveStoredPatients = (patients: Patient[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(MOCK_PATIENTS_KEY, JSON.stringify(patients));
}

export async function getPatients(forceRefresh: boolean = false): Promise<Patient[]> {
  const patients = getStoredPatients();
  return new Promise(resolve => setTimeout(() => resolve(patients), 50));
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const patients = getStoredPatients();
  const patient = patients.find(p => p.id === id) || null;
  return new Promise(resolve => setTimeout(() => resolve(patient), 50));
}

export async function addPatient(patientData: PatientFormValues): Promise<Patient | null> {
    const patients = getStoredPatients();
    const newPatient: Patient = {
        id: `pat-${Date.now()}`,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        ...patientData,
        dateOfBirth: patientData.dateOfBirth?.toISOString(),
        registrationDate: new Date().toISOString(),
        clinicalHistory: [],
    };
    saveStoredPatients([newPatient, ...patients]);
    return new Promise(resolve => setTimeout(() => resolve(newPatient), 50));
}

export async function updatePatient(id: string, patientData: PatientFormValues): Promise<Patient | null> {
    let patients = getStoredPatients();
    const index = patients.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    const updatedPatient = {
        ...patients[index],
        ...patientData,
        dateOfBirth: patientData.dateOfBirth?.toISOString(),
    };
    patients[index] = updatedPatient;
    saveStoredPatients(patients);
    return new Promise(resolve => setTimeout(() => resolve(updatedPatient), 50));
}

export async function deletePatient(id: string): Promise<boolean> {
  let patients = getStoredPatients();
  const initialLength = patients.length;
  patients = patients.filter(p => p.id !== id);
  if (patients.length < initialLength) {
    saveStoredPatients(patients);
    return new Promise(resolve => setTimeout(() => resolve(true), 50));
  }
  return false;
}

export async function addClinicalRecord(patientId: string, recordData: Omit<ClinicalRecord, 'id'>): Promise<Patient | null> {
    let patients = getStoredPatients();
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex === -1) return null;

    const patient = { ...patients[patientIndex] };
    const newRecord: ClinicalRecord = {
        id: `hist-${Date.now()}`,
        ...recordData,
        prescriptions: recordData.prescriptions?.map(p => ({
            ...p,
            id: p.id || `presc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            date: (p.date as unknown as Date).toISOString(), // Coerce from form Date to ISO string
            expiryDate: (p.expiryDate as unknown as Date)?.toISOString(),
            lensCoatings: (p as any).lensCoatingsInput ? (p as any).lensCoatingsInput.split(',').map((s:string)=>s.trim()).filter((s:string)=>s) : [],
        })) || []
    };
    
    patient.clinicalHistory = [newRecord, ...(patient.clinicalHistory || [])];
    patient.lastVisitDate = newRecord.date;
    if (newRecord.nextRecommendedVisitDate) {
        patient.overallNextRecommendedVisitDate = newRecord.nextRecommendedVisitDate;
        patient.overallReasonForNextVisit = newRecord.reasonForNextVisit;
    }
    
    // Update top-level prescription if a new one is added
    if(newRecord.prescriptions && newRecord.prescriptions.length > 0) {
        const latestPrescription = newRecord.prescriptions[0];
        patient.sphericalOD = latestPrescription.sphericalOD;
        patient.cylindricalOD = latestPrescription.cylinderOD;
        patient.axisOD = latestPrescription.axisOD;
        patient.additionOD = latestPrescription.addOD;
        patient.sphericalOS = latestPrescription.sphericalOS;
        patient.cylindricalOS = latestPrescription.cylinderOS;
        patient.axisOS = latestPrescription.axisOS;
        patient.additionOS = latestPrescription.addOS;
        patient.pd = latestPrescription.pd;
    }

    patients[patientIndex] = patient;
    saveStoredPatients(patients);
    return new Promise(resolve => setTimeout(() => resolve(patient), 50));
}

export async function getGlobalClinicalRecords(): Promise<ClinicalRecord[]> {
  const patients = getStoredPatients();
  const allRecords = (patients || []).flatMap(p => 
    (p.clinicalHistory || []).map(r => ({
      ...r,
      patientId: p.id,
      patientName: `${p.firstName} ${p.lastName}`
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return new Promise(resolve => setTimeout(() => resolve(allRecords), 50));
}
