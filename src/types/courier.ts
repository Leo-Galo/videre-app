export type CourierJobStatus = 'Pendiente' | 'Enviado' | 'En Tránsito' | 'Entregado' | 'Cancelado' | 'Problema';
export type DestinationType = 'Cliente' | 'Sucursal' | 'Proveedor' | 'Otro';
export type LinkedDocumentType = 'Factura' | 'Orden de Laboratorio' | 'Traslado';

export interface CourierItem {
    description: string;
    quantity: number;
    sku?: string; // Optional SKU for reference
}

export interface CourierJob {
    id: string;
    internalTrackingId: string; // e.g., MSG-2024-001
    externalTrackingNumber?: string;
    status: CourierJobStatus;
    destinationType: DestinationType;
    destinationName: string; // Name of client, branch, or supplier
    destinationAddress: string;
    recipientName?: string;
    recipientPhone?: string;
    items: CourierItem[];
    notes?: string;
    courierService?: string;
    createdAt: string; // ISO Date
    sentAt?: string; // ISO Date
    deliveredAt?: string; // ISO Date
    linkedDocumentType?: LinkedDocumentType;
    linkedDocumentId?: string; // The ID or number of the linked document (e.g., 'ORD-001')
}
