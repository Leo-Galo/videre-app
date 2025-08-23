// src/services/report-service.ts
'use server';

import type { Patient, Prescription } from '@/types/patient';
import type { Expense } from '@/types/finance';
import type { Order } from '@/types/pos';
import type { SupplierMovement } from '@/types/supplier';
import { getPatients } from './patient-service';
import { getOrders } from './order-service';
import { getProducts } from './inventory-service';
import { getExpenses } from './expense-service';
import { getSuppliers } from './supplier-service';
import { getBudget } from './budget-service';
import { formatDateSafe, formatCurrencyCRC, calculateMargin } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReportDateRange {
    startDate?: Date;
    endDate?: Date;
}

// --- Report Service Implementations ---

export async function getDetailedSalesReport({ startDate, endDate }: ReportDateRange): Promise<any[]> {
    const orders = await getOrders();
    const filtered = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return (!startDate || orderDate >= startDate) && (!endDate || orderDate <= endDate);
    });
    return filtered.map(o => ({
        id: o.orderNumber,
        date: o.createdAt,
        customer: o.customer?.name || 'N/A',
        asesor: o.sellerName || 'N/A',
        total: o.totalCRC,
        status: o.status,
    }));
}

export async function getSalesBySalespersonReport({ startDate, endDate }: ReportDateRange): Promise<any[]> {
    const orders = await getOrders();
    const filtered = orders.filter(o => o.status === 'completed' && (!startDate || new Date(o.createdAt) >= startDate) && (!endDate || new Date(o.createdAt) <= endDate));
    
    const salesByPerson = filtered.reduce((acc, order) => {
        const seller = order.sellerName || "Sin Asesor";
        if (!acc[seller]) {
            acc[seller] = { name: seller, totalSalesCRC: 0, numTransactions: 0 };
        }
        acc[seller].totalSalesCRC += order.totalCRC;
        acc[seller].numTransactions++;
        return acc;
    }, {} as Record<string, { name: string; totalSalesCRC: number; numTransactions: number }>);
    
    return Object.values(salesByPerson).sort((a, b) => b.totalSalesCRC - a.totalSalesCRC);
}

export async function getInventorySummaryReport({ startDate, endDate }: ReportDateRange): Promise<any[]> {
    const products = await getProducts();
    return products.map(p => ({
        sku: p.sku || 'N/A',
        name: p.name,
        category: p.category,
        stock: p.stock,
        value: (p.costPrice && typeof p.costPrice === 'number') ? p.stock * p.costPrice : 0,
    }));
}

export async function getInventoryPricingReport({ startDate, endDate }: ReportDateRange): Promise<any[]> {
    const products = await getProducts();
    return products.map(p => ({
        sku: p.sku || 'N/A',
        name: p.name,
        costPrice: p.costPrice || 0,
        sellingPrice: p.price,
    }));
}

export async function getPatientListReport({ startDate, endDate }: ReportDateRange): Promise<any[]> {
    const patients = await getPatients();
    const filtered = patients.filter(p => (!startDate || new Date(p.registrationDate) >= startDate) && (!endDate || new Date(p.registrationDate) <= endDate));
    return filtered;
}

export async function getPrescriptionReport({ startDate, endDate }: ReportDateRange): Promise<any[]> {
    const patients = await getPatients();
    const prescriptions = patients.flatMap(p => 
        (p.clinicalHistory || []).flatMap(h => 
            (h.prescriptions || []).map(presc => ({
                ...presc,
                patientName: `${p.firstName} ${p.lastName}`,
                recordDate: h.date,
            }))
        )
    );
    const filtered = prescriptions.filter(p => (!startDate || new Date(p.date) >= startDate) && (!endDate || new Date(p.date) <= endDate));
    return filtered;
}

export async function getPatientVisitFrequencyReport({ startDate, endDate }: ReportDateRange): Promise<any[]> {
    const patients = await getPatients();
    return patients.map(p => ({
        patientName: `${p.firstName} ${p.lastName}`,
        lastVisitDate: p.lastVisitDate,
        totalVisitsLastYear: (p.clinicalHistory || []).filter(h => new Date(h.date) > new Date(new Date().setFullYear(new Date().getFullYear() - 1))).length,
        nextRecommendedVisitDate: p.overallNextRecommendedVisitDate,
    })).filter(p => p.lastVisitDate);
}

export async function getTopProductsReport({ startDate, endDate }: ReportDateRange): Promise<any[]> {
    const orders = await getOrders();
    const filtered = orders.filter(o => o.status === 'completed' && (!startDate || new Date(o.createdAt) >= startDate) && (!endDate || new Date(o.createdAt) <= endDate));
    
    const productSales = filtered.flatMap(o => o.items.map(item => ({...item, customerId: o.customer?.id }))).reduce((acc, item) => {
        const id = item.product.id;
        if (!acc[id]) {
            acc[id] = { 
                name: item.product.name, 
                category: item.product.category, 
                quantitySold: 0, 
                customerSet: new Set<string>(),
            };
        }
        acc[id].quantitySold += item.quantity;
        if (item.customerId) {
            acc[id].customerSet.add(item.customerId);
        }
        return acc;
    }, {} as Record<string, { name: string; category:string; quantitySold: number; customerSet: Set<string> }>);

    return Object.values(productSales).map(p => ({...p, uniqueCustomers: p.customerSet.size, customerSet: undefined})).sort((a, b) => b.quantitySold - a.quantitySold);
}

export async function getBirthdayReport({ startDate, endDate }: ReportDateRange): Promise<any[]> {
    const patients = await getPatients();
    return patients.filter(p => {
        if (!p.dateOfBirth) return false;
        const dob = new Date(p.dateOfBirth);
        const dobThisYear = new Date(startDate?.getFullYear() || new Date().getFullYear(), dob.getMonth(), dob.getDate());
        return (!startDate || dobThisYear >= startDate) && (!endDate || dobThisYear <= endDate);
    });
}

export async function getFollowUpReport({ startDate, endDate }: ReportDateRange): Promise<any[]> {
    const patients = await getPatients();
    return patients.filter(p => p.overallNextRecommendedVisitDate && (!startDate || new Date(p.overallNextRecommendedVisitDate) >= startDate) && (!endDate || new Date(p.overallNextRecommendedVisitDate) <= endDate));
}

export async function getFinancialExpensesReport({ startDate, endDate }: ReportDateRange): Promise<Expense[]> {
    const expenses = await getExpenses();
    return expenses.filter(e => (!startDate || new Date(e.date) >= startDate) && (!endDate || new Date(e.date) <= endDate));
}

export async function getPurchasesBySupplierReport({ startDate, endDate }: ReportDateRange): Promise<any[]> {
    const suppliers = await getSuppliers();
    return suppliers.map(s => {
        const movements = s.movements || [];
        const filteredMovements = movements.filter(m => m.type === 'receipt' && (!startDate || new Date(m.date) >= startDate) && (!endDate || new Date(m.date) <= endDate));
        return {
            supplierName: s.name,
            receiptCount: filteredMovements.length,
            totalCost: filteredMovements.flatMap(m => m.items).reduce((sum, item) => sum + ((item.costPrice || 0) * item.quantity), 0),
        };
    }).filter(s => s.receiptCount > 0);
}


export async function getMonthlyGoalComplianceReport({ startDate, endDate }: ReportDateRange): Promise<any[]> {
    const reportYear = startDate?.getFullYear() || new Date().getFullYear();
    const reportMonth = startDate?.getMonth() || new Date().getMonth();

    const [budget, orders] = await Promise.all([
        getBudget(reportYear, reportMonth),
        getOrders(),
    ]);

    const generalGoal = budget['Salarios'] || 0; // Example: use Salarios as a placeholder for general goal
    
    const filteredOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate.getFullYear() === reportYear && orderDate.getMonth() === reportMonth;
    });
    
    const totalActualSales = filteredOrders.reduce((sum, order) => sum + order.totalCRC, 0);

    const generalData = {
        period: format(startDate || new Date(), 'MMMM yyyy', { locale: es }),
        salesperson: 'General',
        goal: generalGoal,
        actual: totalActualSales,
    };
    
    return [generalData];
}
