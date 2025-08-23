
// src/services/order-service.ts
'use server';

import type { Order, OrderStatus, ReturnedItemInfo, PaymentDetail } from '@/types/pos';
import { getProducts, saveStoredProducts } from './inventory-service';

const ORDERS_STORAGE_KEY = 'videreMockOrders';

// Initial mock data can be empty or have some examples
const initialMockOrders: Order[] = [];

const getStoredOrders = (): Order[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (data) {
        try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) return parsed;
        } catch(e) {
            console.error("Failed to parse orders from localStorage", e);
        }
    }
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(initialMockOrders));
    return initialMockOrders;
};

const saveStoredOrders = (orders: Order[]) => {
    if (typeof window === 'undefined') return;
    const sorted = orders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(sorted));
};

export async function getOrders(): Promise<Order[]> {
    const orders = getStoredOrders();
    return new Promise(resolve => setTimeout(() => resolve(orders), 50));
}

export async function getOrdersByPatientId(patientId: string): Promise<Order[]> {
    const orders = getStoredOrders();
    const patientOrders = orders.filter(o => o.customer?.id === patientId);
    return new Promise(resolve => setTimeout(() => resolve(patientOrders), 50));
}

export async function saveOrder(newOrderData: Omit<Order, 'id'>): Promise<Order> {
    const orders = getStoredOrders();
    const allProducts = await getProducts(); // Use await here
    
    // Simulate stock reduction only for completed sales
    if(newOrderData.status === 'completed' || newOrderData.status === 'partially_paid') {
        newOrderData.items.forEach(item => {
            const productIndex = allProducts.findIndex(p => p.id === item.product.id);
            if (productIndex !== -1) {
                // Do not reduce stock for services
                if(allProducts[productIndex].category.toLowerCase() !== 'servicios') {
                    allProducts[productIndex].stock -= item.quantity;
                }
            }
        });
        saveStoredProducts(allProducts);
    }

    const newOrder: Order = {
        id: `ord-${Date.now()}`,
        ...newOrderData
    };
    
    saveStoredOrders([newOrder, ...orders]);
    return new Promise(resolve => setTimeout(() => resolve(newOrder), 50));
}

export async function voidOrder(orderId: string, reason: string): Promise<Order | null> {
    let orders = getStoredOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;

    const updatedOrder: Order = {
        ...orders[index],
        status: 'voided',
        voidReason: reason,
        voidedAt: new Date().toISOString(),
    };
    orders[index] = updatedOrder;
    saveStoredOrders(orders);
    return new Promise(resolve => setTimeout(() => resolve(updatedOrder), 50));
}

export async function processReturn(orderId: string, returnedItems: ReturnedItemInfo[], newStatus: OrderStatus, generalReason?: string): Promise<Order | null> {
    let orders = getStoredOrders();
    let products = await getProducts(); // Use await here
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;

    // Simulate stock increase for returned items
    returnedItems.forEach(item => {
        const productIndex = products.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
            products[productIndex].stock += item.quantityReturned;
        }
    });
    saveStoredProducts(products);

    const updatedOrder: Order = {
        ...orders[index],
        status: newStatus,
        returnReason: generalReason || orders[index].returnReason,
        returnedItems: [...(orders[index].returnedItems || []), ...returnedItems],
    };
    orders[index] = updatedOrder;
    saveStoredOrders(orders);
    return new Promise(resolve => setTimeout(() => resolve(updatedOrder), 50));
}

export async function addPaymentToOrder(orderId: string, newPayments: PaymentDetail[]): Promise<Order | null> {
    let orders = getStoredOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;

    const order = orders[index];
    const updatedPayments = [...order.payments, ...newPayments];
    const newTotalPaid = updatedPayments.reduce((sum, p) => sum + p.amountCRC, 0);
    const newBalanceDue = order.totalCRC - newTotalPaid;

    const updatedOrder: Order = {
        ...order,
        payments: updatedPayments,
        amountPaidTotalCRC: newTotalPaid,
        balanceDueCRC: newBalanceDue,
        status: newBalanceDue <= 0.001 ? 'completed' : 'partially_paid',
        updatedAt: new Date().toISOString(),
    };
    orders[index] = updatedOrder;
    saveStoredOrders(orders);
    return new Promise(resolve => setTimeout(() => resolve(updatedOrder), 50));
}
