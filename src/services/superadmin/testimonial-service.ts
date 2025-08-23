// src/services/superadmin/testimonial-service.ts
'use server';

import type { Testimonial } from '@/types/index';
import type { TestimonialFormValues } from '@/types/superadmin-schemas';

const TESTIMONIALS_STORAGE_KEY = 'videreAppTestimonials';

const mockTestimonialsData: Testimonial[] = [];

const getStoredData = (): Testimonial[] => {
    if (typeof window === 'undefined') return mockTestimonialsData;
    try {
        const stored = localStorage.getItem(TESTIMONIALS_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        }
        localStorage.setItem(TESTIMONIALS_STORAGE_KEY, JSON.stringify(mockTestimonialsData));
        return mockTestimonialsData;
    } catch (error) {
        console.error("Error with localStorage:", error);
        return mockTestimonialsData;
    }
};

const saveDataToStorage = (data: Testimonial[]) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(TESTIMONIALS_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Error saving to localStorage:", error);
    }
};


export async function getTestimonials(): Promise<Testimonial[]> {
    const testimonials = getStoredData();
    return new Promise(resolve => setTimeout(() => resolve([...testimonials]), 50));
}

export async function addTestimonial(values: TestimonialFormValues): Promise<Testimonial> {
    const testimonials = getStoredData();
    const newTestimonial: Testimonial = {
        id: `testimonial-${Date.now()}`,
        ...values,
    };
    const updatedTestimonials = [newTestimonial, ...testimonials];
    saveDataToStorage(updatedTestimonials);
    return new Promise(resolve => setTimeout(() => resolve(newTestimonial), 50));
}

export async function updateTestimonial(id: string, values: TestimonialFormValues): Promise<boolean> {
    let testimonials = getStoredData();
    const index = testimonials.findIndex(t => t.id === id);
    if (index !== -1) {
        testimonials[index] = { ...testimonials[index], ...values };
        saveDataToStorage(testimonials);
        return new Promise(resolve => setTimeout(() => resolve(true), 50));
    }
    return false;
}

export async function deleteTestimonial(id: string): Promise<boolean> {
    let testimonials = getStoredData();
    const initialLength = testimonials.length;
    testimonials = testimonials.filter(t => t.id !== id);
    if (testimonials.length < initialLength) {
        saveDataToStorage(testimonials);
        return new Promise(resolve => setTimeout(() => resolve(true), 50));
    }
    return false;
}
