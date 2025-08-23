// src/services/lab-order-service.ts
'use server';

import type { LabOrder, LabOrderStatus } from '@/types/lab-order';
import { format } from 'date-fns';

const LAB_ORDERS_STORAGE_KEY = 'videreLabOrders';

const initialLabOrders: LabOrder[] = [];

const getStoredData = (): LabOrder[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(LAB_ORDERS_STORAGE_KEY);
    if (data) return JSON.parse(data);
    localStorage.setItem(LAB_ORDERS_STORAGE_KEY, JSON.stringify(initialLabOrders));
    return initialLabOrders;
};

const saveData = (orders: LabOrder[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LAB_ORDERS_STORAGE_KEY, JSON.stringify(orders));
};

export async function getLabOrders(): Promise<LabOrder[]> {
    const orders = getStoredData();
    return new Promise(resolve => setTimeout(() => resolve(orders), 50));
}

export async function addLabOrder(
    patientId: string,
    patientName: string,
    prescriptionId: string,
    prescriptionSummary: string,
    values: { labName: string, notes?: string },
    orderId?: string
): Promise<LabOrder> {
    const orders = getStoredData();
    const newOrder: LabOrder = {
        id: `lab-${Date.now()}`,
        orderNumber: `LAB-${format(new Date(), 'yyMMdd')}-${Math.floor(Math.random() * 900 + 100)}`,
        patientId,
        patientName,
        prescriptionId,
        prescriptionSummary,
        labName: values.labName,
        notes: values.notes,
        orderId,
        status: 'Pendiente',
        createdAt: new Date().toISOString(),
    };
    saveData([newOrder, ...orders]);
    return new Promise(resolve => setTimeout(() => resolve(newOrder), 50));
}

export async function updateLabOrderStatus(orderId: string, status: LabOrderStatus): Promise<LabOrder | null> {
    const orders = getStoredData();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;

    const updatedOrder = { ...orders[index], status, updatedAt: new Date().toISOString() };
    if (status === 'Enviada') updatedOrder.sentAt = new Date().toISOString();
    if (status === 'Recibida') updatedOrder.receivedAt = new Date().toISOString();
    
    orders[index] = updatedOrder;
    saveData(orders);
    return new Promise(resolve => setTimeout(() => resolve(updatedOrder), 50));
}
