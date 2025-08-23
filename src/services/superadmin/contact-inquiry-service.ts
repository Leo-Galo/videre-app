
'use server';

import type { ContactInquiry } from '@/types/superadmin';
import { subDays } from 'date-fns';

let mockInquiries: ContactInquiry[] = [];

export async function getInquiries(): Promise<ContactInquiry[]> {
    return new Promise(resolve => setTimeout(() => resolve([...mockInquiries]), 50));
}

export async function updateInquiryStatus(inquiryId: string, newStatus: ContactInquiry['status']): Promise<boolean> {
    const inquiryIndex = mockInquiries.findIndex(i => i.id === inquiryId);
    if (inquiryIndex !== -1) {
        mockInquiries[inquiryIndex].status = newStatus;
        return new Promise(resolve => setTimeout(() => resolve(true), 50));
    }
    return false;
}
