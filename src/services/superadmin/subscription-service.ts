// src/services/superadmin/subscription-service.ts
'use server';

import type { VidereSubscription } from '@/types/superadmin';
import { getClinics } from './clinic-service';

const getMockSubscriptions = async (): Promise<VidereSubscription[]> => {
    const clinics = await getClinics();
    return clinics.map(clinic => ({
        id: `sub-${clinic.id}`,
        clinicId: clinic.id,
        clinicName: clinic.name,
        planName: clinic.plan,
        status: clinic.status === 'Active' ? 'Active' : clinic.status === 'Trialing' ? 'Trialing' : 'Cancelled', // Simplified mapping
        amount: clinic.plan === 'Premium' ? 139 : clinic.plan === 'Pro' ? 99 : 49,
        currency: 'USD',
        billingCycle: 'Monthly',
        startDate: clinic.createdAt,
        nextBillingDate: clinic.nextBillingDate,
        trialEndDate: clinic.trialEndDate,
    }));
};

export async function getSubscriptions(): Promise<VidereSubscription[]> {
    const subscriptions = await getMockSubscriptions();
    return new Promise(resolve => setTimeout(() => resolve(subscriptions), 50));
}
