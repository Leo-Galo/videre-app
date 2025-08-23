// src/services/dashboard-service.ts
'use server';

import type { Appointment } from '@/types/appointment';
import type { Patient } from '@/types/patient';
import type { Order } from '@/types/pos';
import { getOrders } from '@/services/order-service';
import { getPatients } from '@/services/patient-service';
import { getAppointments } from '@/services/appointment-service';
import { format, parseISO, startOfMonth, subMonths, isWithinInterval, isToday, addDays, isPast } from 'date-fns';

export interface KpiData {
  totalSales: { value: number; trend: string };
  newPatients: { value: number; trend: string };
  productsSold: { value: number };
  appointmentsToday: { value: number };
}

export async function getDashboardKpiData(): Promise<KpiData> {
  const [orders, patients, appointments] = await Promise.all([
    getOrders(),
    getPatients(),
    getAppointments(),
  ]);

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = addDays(startOfMonth(now), -1);

  const salesThisMonth = (orders || [])
    .filter(o => o.status === 'completed' && isWithinInterval(parseISO(o.createdAt), { start: thisMonthStart, end: now }))
    .reduce((sum, o) => sum + o.totalCRC, 0);

  const salesLastMonth = (orders || [])
    .filter(o => o.status === 'completed' && isWithinInterval(parseISO(o.createdAt), { start: lastMonthStart, end: lastMonthEnd }))
    .reduce((sum, o) => sum + o.totalCRC, 0);
  
  const salesTrend = salesLastMonth > 0 ? ((salesThisMonth - salesLastMonth) / salesLastMonth) * 100 : (salesThisMonth > 0 ? 100 : 0);

  const newPatientsThisMonth = (patients || [])
    .filter(p => isWithinInterval(parseISO(p.registrationDate), { start: thisMonthStart, end: now })).length;
  
  const newPatientsLastMonth = (patients || [])
    .filter(p => isWithinInterval(parseISO(p.registrationDate), { start: lastMonthStart, end: lastMonthEnd })).length;

  const patientTrend = newPatientsLastMonth > 0 ? ((newPatientsThisMonth - newPatientsLastMonth) / newPatientsLastMonth) * 100 : (newPatientsThisMonth > 0 ? 100 : 0);

  const productsSoldCount = (orders || [])
    .filter(o => o.status === 'completed' && isWithinInterval(parseISO(o.createdAt), { start: thisMonthStart, end: now }))
    .reduce((sum, o) => sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);


  const appointmentsTodayCount = (appointments || []).filter(a => isToday(parseISO(a.dateTime)) && a.status === 'scheduled').length;

  return {
    totalSales: {
      value: salesThisMonth,
      trend: `${salesTrend >= 0 ? '+' : ''}${salesTrend.toFixed(1)}% vs mes anterior`,
    },
    newPatients: {
      value: newPatientsThisMonth,
      trend: `${patientTrend >= 0 ? '+' : ''}${patientTrend.toFixed(1)}% vs mes anterior`,
    },
    productsSold: {
      value: productsSoldCount,
    },
    appointmentsToday: {
      value: appointmentsTodayCount,
    },
  };
}

export async function getTodaysAppointments(): Promise<Appointment[]> {
  const allAppointments = await getAppointments();
  return (allAppointments || []).filter(appt => 
    isToday(parseISO(appt.dateTime)) && appt.status === 'scheduled'
  ).sort((a, b) => parseISO(a.dateTime).getTime() - parseISO(b.dateTime).getTime());
}


export async function getUpcomingBirthdays(): Promise<Patient[]> {
  const allPatients = await getPatients();
  const today = new Date();
  const nextTwoWeeks = addDays(today, 14);

  return (allPatients || []).filter(p => {
    if (!p.dateOfBirth) return false;
    try {
      const dob = parseISO(p.dateOfBirth);
      const currentYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      
      const nextBirthday = isPast(currentYearBirthday) && !isToday(currentYearBirthday)
        ? addDays(currentYearBirthday, 365) // Simplified leap year logic
        : currentYearBirthday;
        
      return isWithinInterval(nextBirthday, { start: today, end: nextTwoWeeks });
    } catch (e) {
      return false;
    }
  }).sort((a, b) => {
    const dobA = parseISO(a.dateOfBirth!);
    const dobB = parseISO(b.dateOfBirth!);
    const nextBirthdayA = new Date(today.getFullYear(), dobA.getMonth(), dobA.getDate());
    const nextBirthdayB = new Date(today.getFullYear(), dobB.getMonth(), dobB.getDate());
    const effectiveNextA = isPast(nextBirthdayA) && !isToday(nextBirthdayA) ? addDays(nextBirthdayA, 365) : nextBirthdayA;
    const effectiveNextB = isPast(nextBirthdayB) && !isToday(nextBirthdayB) ? addDays(nextBirthdayB, 365) : nextBirthdayB;
    return effectiveNextA.getTime() - effectiveNextB.getTime();
  });
}


export async function getFollowUpReminders(): Promise<Patient[]> {
  const allPatients = await getPatients();
  const today = new Date();
  const nextMonth = addDays(today, 30);
  
  return (allPatients || []).filter(p => {
    if (!p.overallNextRecommendedVisitDate) return false;
    try {
      const nextVisit = parseISO(p.overallNextRecommendedVisitDate);
      return isPast(nextVisit) || isWithinInterval(nextVisit, { start: today, end: nextMonth });
    } catch (e) {
      return false;
    }
  }).sort((a,b) => parseISO(a.overallNextRecommendedVisitDate!).getTime() - parseISO(b.overallNextRecommendedVisitDate!).getTime());
}
