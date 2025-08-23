// src/services/appointment-service.ts
'use server';

import type { Appointment, AppointmentType } from '@/types/appointment';
import type { ClinicUser } from '@/types/user';
import { format, parseISO, setHours, setMinutes, addMinutes, startOfDay, addDays } from 'date-fns';

const APPOINTMENTS_STORAGE_KEY = 'videreMockAppointments';
const mockAppointmentTypes: AppointmentType[] = [
  "Examen Visual General", "Examen Lentes de Contacto", "Seguimiento", 
  "Adaptación Lentes Progresivos", "Consulta Especializada", "Retiro/Ajuste de Lentes", "Otro"
];

const initialAppointments: Appointment[] = [];

const getStoredAppointments = (): Appointment[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (data) return JSON.parse(data);
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(initialAppointments));
    return initialAppointments;
};

const saveStoredAppointments = (appointments: Appointment[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
};


export async function getAppointments(): Promise<Appointment[]> {
  const appointments = getStoredAppointments();
  return new Promise(resolve => setTimeout(() => resolve(appointments), 50));
}

export async function addOrUpdateAppointment(appointmentData: Appointment): Promise<Appointment | null> {
    let appointments = getStoredAppointments();
    const existingIndex = appointments.findIndex(a => a.id === appointmentData.id);

    if (existingIndex > -1) {
        appointments[existingIndex] = appointmentData;
    } else {
        appointments.push(appointmentData);
    }
    saveStoredAppointments(appointments);
    return new Promise(resolve => setTimeout(() => resolve(appointmentData), 50));
}

export async function deleteAppointment(appointmentId: string): Promise<boolean> {
    let appointments = getStoredAppointments();
    const initialLength = appointments.length;
    appointments = appointments.filter(a => a.id !== appointmentId);
    if (appointments.length < initialLength) {
        saveStoredAppointments(appointments);
        return new Promise(resolve => setTimeout(() => resolve(true), 50));
    }
    return false;
}

export async function getOptometrists(): Promise<ClinicUser[]> {
  return new Promise(resolve => setTimeout(() => resolve([]), 50)); // Return empty array
}

export async function getAppointmentTypes(): Promise<AppointmentType[]> {
  return new Promise(resolve => setTimeout(() => resolve(mockAppointmentTypes), 50));
}
