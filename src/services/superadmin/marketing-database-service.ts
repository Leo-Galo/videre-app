
'use server';

import type { ClinicTenant, ContactInquiry } from '@/types/superadmin';
import { getClinics } from './clinic-service';
import { getInquiries } from './contact-inquiry-service';

export interface VidereMarketingContact {
  id: string; 
  name: string;
  email: string;
  source: 'Clínica Registrada' | 'Consulta de Contacto';
  date: string; 
  plan?: string; 
  status?: string; 
  detailsLink?: string; 
}

export async function getMarketingContacts(): Promise<VidereMarketingContact[]> {
  const [clinics, inquiries] = await Promise.all([getClinics(), getInquiries()]);
  
  const combinedContacts: VidereMarketingContact[] = [];

  clinics.forEach(clinic => {
    combinedContacts.push({
      id: `clinic-${clinic.id}`,
      name: clinic.name,
      email: clinic.adminEmail,
      source: 'Clínica Registrada',
      date: clinic.createdAt,
      plan: clinic.plan,
      status: clinic.status,
      detailsLink: `/superadmin/clinics/${clinic.id}`
    });
  });

  inquiries.forEach(inquiry => {
    combinedContacts.push({
      id: `inquiry-${inquiry.id}`,
      name: inquiry.name,
      email: inquiry.email,
      source: 'Consulta de Contacto',
      date: inquiry.receivedAt,
      status: inquiry.status,
      detailsLink: `/superadmin/contact-inquiries` 
    });
  });
  
  const sortedContacts = combinedContacts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return new Promise(resolve => setTimeout(() => resolve(sortedContacts), 50));
}
