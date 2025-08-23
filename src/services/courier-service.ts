// src/services/courier-service.ts
'use server';

import type { CourierJob, CourierJobStatus } from '@/types/courier';
import type { CourierJobFormValues } from '@/types/courier-schema';
import { format } from 'date-fns';

const COURIER_JOBS_KEY = 'videreCourierJobs';

const initialJobs: CourierJob[] = [];

const getStoredJobs = (): CourierJob[] => {
    if (typeof window === 'undefined') return initialJobs;
    const data = localStorage.getItem(COURIER_JOBS_KEY);
    return data ? JSON.parse(data) : initialJobs;
};

const saveStoredJobs = (jobs: CourierJob[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(COURIER_JOBS_KEY, JSON.stringify(jobs));
};

export async function getCourierJobs(): Promise<CourierJob[]> {
    const jobs = getStoredJobs();
    return new Promise(resolve => setTimeout(() => resolve(jobs), 50));
}

export async function addCourierJob(jobData: CourierJobFormValues): Promise<CourierJob> {
    const jobs = getStoredJobs();
    const newJob: CourierJob = {
        id: `job-${Date.now()}`,
        internalTrackingId: `MSG-${format(new Date(), 'yyMMdd')}-${Math.floor(Math.random() * 900 + 100)}`,
        status: 'Pendiente',
        createdAt: new Date().toISOString(),
        ...jobData,
        destinationAddress: jobData.destinationAddress || 'Dirección no especificada',
    };
    const updatedJobs = [newJob, ...jobs];
    saveStoredJobs(updatedJobs);
    return new Promise(resolve => setTimeout(() => resolve(newJob), 50));
}

export async function updateCourierJobStatus(jobId: string, status: CourierJobStatus): Promise<CourierJob | null> {
    const jobs = getStoredJobs();
    const jobIndex = jobs.findIndex(j => j.id === jobId);
    if (jobIndex !== -1) {
        const job = { ...jobs[jobIndex] };
        job.status = status;
        if (status === 'Enviado') job.sentAt = new Date().toISOString();
        if (status === 'Entregado') job.deliveredAt = new Date().toISOString();
        jobs[jobIndex] = job;
        saveStoredJobs(jobs);
        return new Promise(resolve => setTimeout(() => resolve(job), 50));
    }
    return null;
}
