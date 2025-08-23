
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
import { FileText, Printer, XCircle, DollarSign, CreditCard, Smartphone, Landmark, Banknote } from 'lucide-react';
import type { Order, PaymentDetail, PaymentMethod } from '@/types/pos';
import { SiteLogo } from "@/components/shared/site-logo";
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useState } from "react";
import Image from 'next/image'; 
import { useToast } from "@/hooks/use-toast";

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  order: Order | null;
  payments: PaymentDetail[] | null; // The payment(s) just made
}

interface ClinicInvoiceSettings {
  clinicName?: string;
  clinicPhone?: string;
  clinicAddress?: string;
  clinicEmail?: string;
  clinicLogo?: string | null;
}

const formatCurrency = (amount: number) => {
  return `¢${new Intl.NumberFormat('es-CR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
};

const paymentMethodIcons: Record<PaymentMethod, React.ReactNode> = {
    cash: <DollarSign className="h-4 w-4 text-green-600 mr-2" />,
    card: <CreditCard className="h-4 w-4 text-blue-600 mr-2" />,
    sinpe: <Smartphone className="h-4 w-4 text-purple-600 mr-2" />,
    transfer: <Landmark className="h-4 w-4 text-orange-600 mr-2" />,
};
const paymentMethodLabels: Record<PaymentMethod, string> = {
    cash: "Efectivo",
    card: "Tarjeta",
    sinpe: "SINPE Móvil",
    transfer: "Transferencia",
};


export function PaymentReceiptModal({ isOpen, onOpenChange, order, payments }: PaymentReceiptModalProps) {
  const [clinicSettings, setClinicSettings] = useState<ClinicInvoiceSettings | null>(null);
  const { toast } = useToast(); 

  useEffect(() => {
    if (isOpen && order) {
      const savedSettings = localStorage.getItem("videreClinicSettings");
      if (savedSettings) {
        setClinicSettings(JSON.parse(savedSettings));
      } else {
        setClinicSettings({
            clinicName: "Óptica Videre (Ejemplo)",
            clinicAddress: "Dirección de Ejemplo, San José",
            clinicPhone: "2222-2222",
            clinicEmail: "facturas@videre.com",
        });
      }
    }
  }, [isOpen, order]);

  if (!order || !payments || !clinicSettings) return null;

  const handlePrint = () => {
    toast({
      title: "Imprimiendo Recibo...",
      description: "Preparando el recibo de dinero para impresión.",
    });
  };

  const totalPaidNow = payments.reduce((sum, p) => sum + p.amountCRC, 0);
  const previousBalance = (order.balanceDueCRC || 0) + totalPaidNow;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Banknote className="h-7 w-7 text-primary" /> Recibo de Dinero
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-grow overflow-y-auto px-6">
          <div className="my-6 space-y-4" id="receipt-content">
            
            <div className="flex justify-between items-start">
              <div>
                {clinicSettings.clinicLogo ? (
                    <div className="relative w-28 h-14 mb-2"> 
                        <Image src={clinicSettings.clinicLogo} alt="Logo Clínica" fill style={{ objectFit: 'contain' }} />
                    </div>
                ) : (
                    <SiteLogo iconSize={28} textSize="text-xl"/>
                )}
                <p className="text-sm font-semibold text-foreground">{clinicSettings.clinicName}</p>
                <p className="text-xs text-muted-foreground">{clinicSettings.clinicAddress}</p>
              </div>
              <div className="text-right">
                <h3 className="text-lg font-semibold">Recibo #{`REC-${order.orderNumber.slice(-4)}-${Date.now() % 1000}`}</h3>
                <p className="text-sm text-muted-foreground">Fecha: {format(new Date(), 'PPPp', { locale: es })}</p>
              </div>
            </div>
            <Separator />

            <div>
              <p className="text-sm"><strong className="text-muted-foreground">Recibido de:</strong> {order.customer?.name || 'N/A'}</p>
              <p className="text-sm"><strong className="text-muted-foreground">Aplicado a Factura:</strong> #{order.orderNumber}</p>
            </div>
            <Separator />

             <div>
              <h4 className="font-semibold mb-2">Detalle del Pago Realizado</h4>
              <div className="space-y-2">
                 {payments.map((payment, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded-md bg-muted/30">
                        <span className="font-medium flex items-center">{paymentMethodIcons[payment.method]} {paymentMethodLabels[payment.method]}</span>
                        <span className="font-semibold">{formatCurrency(payment.amountCRC)}</span>
                    </div>
                 ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-1 text-sm text-right">
              <p><span className="font-medium text-muted-foreground">Saldo Anterior:</span> {formatCurrency(previousBalance)}</p>
              <p className="text-green-600"><span className="font-medium">Monto Abonado:</span> -{formatCurrency(totalPaidNow)}</p>
              <Separator className="my-1.5" />
              <p className="font-bold text-lg text-primary"><span className="text-muted-foreground">Nuevo Saldo Pendiente:</span> {formatCurrency(order.balanceDueCRC || 0)}</p>
            </div>

          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-muted/20">
            <Button type="button" variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Imprimir Recibo
            </Button>
            <DialogClose asChild>
                <Button type="button" variant="default">
                 <XCircle className="mr-2 h-4 w-4" /> Cerrar
                </Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
