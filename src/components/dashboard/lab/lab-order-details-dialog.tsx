
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FileText, Printer, XCircle, FlaskConical, User, CalendarDays } from 'lucide-react';
import type { LabOrder } from '@/types/lab-order';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";

interface LabOrderDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  order: LabOrder | null;
}

export function LabOrderDetailsDialog({ isOpen, onOpenChange, order }: LabOrderDetailsDialogProps) {
  const { toast } = useToast();

  if (!order) return null;

  const handlePrint = () => {
    toast({
      title: "Impresión de Orden de Laboratorio (Simulación)",
      description: `Se prepararía la orden #${order.orderNumber} para impresión.`,
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try { return format(parseISO(dateString), 'PPPp', { locale: es }); }
    catch { return 'Fecha Inválida'; }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" /> Detalle de Orden: #{order.orderNumber}
          </DialogTitle>
          <DialogDescription>
            Para: <strong>{order.labName}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] my-2 pr-4">
          <div className="space-y-4 text-sm">
            <div>
              <p><strong className="text-muted-foreground">Paciente:</strong> {order.patientName}</p>
              <p><strong className="text-muted-foreground">Fecha Creación:</strong> {formatDate(order.createdAt)}</p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-1">Resumen de Prescripción Enviada:</h4>
              <p className="text-xs whitespace-pre-wrap bg-muted/50 p-3 rounded-md border">{order.prescriptionSummary}</p>
            </div>
            {order.notes && (
                <div>
                    <h4 className="font-semibold mb-1">Instrucciones Adicionales:</h4>
                    <p className="text-xs whitespace-pre-wrap bg-muted/50 p-3 rounded-md border">{order.notes}</p>
                </div>
            )}
             <Separator />
             <div>
                <h4 className="font-semibold mb-1">Trazabilidad:</h4>
                <p><strong className="text-muted-foreground">Enviada el:</strong> {order.sentAt ? formatDate(order.sentAt) : 'Pendiente'}</p>
                <p><strong className="text-muted-foreground">Recibida el:</strong> {order.receivedAt ? formatDate(order.receivedAt) : 'Pendiente'}</p>
             </div>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <Button type="button" variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
          <DialogClose asChild>
            <Button type="button">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
