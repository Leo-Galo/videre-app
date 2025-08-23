
export type LabOrderStatus = 'Pendiente' | 'Enviada' | 'En Proceso' | 'Completada' | 'Recibida' | 'Cancelada';

export interface LabOrder {
    id: string;
    orderNumber: string; // e.g., LAB-2024-001
    patientId: string;
    patientName: string;
    prescriptionId: string;
    prescriptionSummary: string; // A concise summary of the prescription details
    labName: string;
    status: LabOrderStatus;
    notes?: string; // Special instructions for the lab
    createdAt: string; // ISO Date string
    sentAt?: string; // ISO Date string, when the order was sent to the lab
    expectedDeliveryDate?: string; // ISO Date string
    receivedAt?: string; // ISO Date string, when the finished job was received
    orderId?: string; // ID of the sales order this is linked to
}
