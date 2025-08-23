
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { FileText, Printer, XCircle, Info, Tag, DollarSign, CreditCard, Smartphone, Landmark, Key } from 'lucide-react';
import type { Order, DocumentType, OrderItem, PaymentDetail, PaymentMethod } from '@/types/pos';
import { SiteLogo } from "@/components/shared/site-logo";
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useState } from "react";
import Image from 'next/image'; 
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface InvoiceModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  order: Order | null;
}

interface ClinicInvoiceSettings {
  clinicName?: string;
  clinicPhone?: string;
  clinicAddress?: string;
  clinicEmail?: string;
  clinicLogo?: string | null;
  billingLegalName?: string;
  billingIdType?: string;
  billingIdNumber?: string;
  billingReturnsPolicy?: string;
  billingIncludeReturnsPolicy?: boolean;
}

const formatCurrency = (amount: number, currency: 'CRC' | 'USD' = 'CRC') => {
  if (currency === 'USD') {
      return `$${new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
  }
  return `¢${new Intl.NumberFormat('es-CR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
};

const documentTypeLabels: Record<DocumentType, string> = {
  electronic_invoice: "Factura Electrónica",
  electronic_ticket: "Tiquete Electrónico",
  proforma_invoice: "Factura Proforma",
  internal_sale_receipt: "FACTURA DE VENTA",
};

const paymentMethodIcons: Record<PaymentMethod, React.ReactNode> = {
    cash: <DollarSign className="h-4 w-4 text-green-600 mr-1" />,
    card: <CreditCard className="h-4 w-4 text-blue-600 mr-1" />,
    sinpe: <Smartphone className="h-4 w-4 text-purple-600 mr-1" />,
    transfer: <Landmark className="h-4 w-4 text-orange-600 mr-1" />,
};
const paymentMethodLabels: Record<PaymentMethod, string> = {
    cash: "Efectivo",
    card: "Tarjeta",
    sinpe: "SINPE Móvil",
    transfer: "Transferencia",
};


export function InvoiceModal({ isOpen, onOpenChange, order }: InvoiceModalProps) {
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
            billingLegalName: "Óptica Videre Ejemplo S.A.",
            billingIdType: "Cédula Jurídica",
            billingIdNumber: "3-101-000000",
            billingIncludeReturnsPolicy: false,
            billingReturnsPolicy: ""
        });
      }
    }
  }, [isOpen, order]);

  if (!order || !clinicSettings) return null;

  const handlePrint = () => {
    toast({
      title: "Imprimiendo...",
      description: "Preparando vista de impresión.",
    });
    console.log("Print simulation triggered.");
  };

  const documentTitle = order.documentTypeGenerated
    ? documentTypeLabels[order.documentTypeGenerated]
    : "Comprobante de Venta";
  
  const emitterName = clinicSettings.billingLegalName || clinicSettings.clinicName || "Su Óptica";
  const emitterId = clinicSettings.billingIdNumber ? `${clinicSettings.billingIdType}: ${clinicSettings.billingIdNumber}` : "No especificado";


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <FileText className="h-7 w-7 text-primary" /> {documentTitle}
          </DialogTitle>
          <DialogDescription>
            Comprobante No. {order.orderNumber}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow overflow-y-auto px-6">
          <div className="my-6 space-y-6" id="invoice-content">
            
            {(order.documentTypeGenerated === 'proforma_invoice') && (
              <Alert variant="warning" className="my-2">
                  <Info className="h-4 w-4" />
                  <AlertTitle className="font-semibold">
                    DOCUMENTO PROFORMA
                  </AlertTitle>
                  <AlertDescription>
                    Este documento no tiene valor fiscal y es únicamente para fines informativos o de control.
                  </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between items-start">
              <div>
                {clinicSettings.clinicLogo ? (
                    <div className="relative w-32 h-16 mb-2"> 
                        <Image src={clinicSettings.clinicLogo} alt="Logo Clínica" fill style={{ objectFit: 'contain' }} />
                    </div>
                ) : (
                    <SiteLogo iconSize={32} textSize="text-2xl"/>
                )}
                <p className="text-sm font-semibold text-foreground">{emitterName}</p>
                <p className="text-xs text-muted-foreground">{emitterId}</p>
                <p className="text-xs text-muted-foreground">{clinicSettings.clinicAddress}</p>
                <p className="text-xs text-muted-foreground">Tel: {clinicSettings.clinicPhone} | Email: {clinicSettings.clinicEmail}</p>
              </div>
              <div className="text-right">
                <h3 className="text-lg font-semibold">Comprobante #{order.orderNumber}</h3>
                <p className="text-sm text-muted-foreground">Fecha: {format(parseISO(order.createdAt), 'PPPp', { locale: es })}</p>
                {order.sellerName && <p className="text-xs text-muted-foreground">Vendedor: {order.sellerName}</p>}
              </div>
            </div>
            <Separator />

            <div>
              <h4 className="font-semibold mb-1">Cliente:</h4>
              <p className="text-sm">{order.customer?.name || 'Consumidor Final'}</p>
              {order.customer?.identification && order.customer?.identificationType && order.customer.id !== '0' && (
                <p className="text-xs text-muted-foreground">
                  Identificación: {order.customer.identificationType}: {order.customer.identification}
                </p>
              )}
              {order.customer?.email && <p className="text-xs text-muted-foreground">Correo: {order.customer?.email}</p>}
              {order.customer?.phone && <p className="text-xs text-muted-foreground">Teléfono: {order.customer?.phone}</p>}
            </div>
            
            {(order.clave || order.consecutivo) && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-1 flex items-center gap-1.5"><Key className="h-4 w-4"/>Información Fiscal</h4>
                  {order.clave && <p className="text-xs text-muted-foreground break-all"><strong>Clave:</strong> {order.clave}</p>}
                  {order.consecutivo && <p className="text-xs text-muted-foreground"><strong>Consecutivo:</strong> {order.consecutivo}</p>}
                </div>
              </>
            )}
            <Separator />


            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[40%]">Producto/Servicio</TableHead>
                    <TableHead className="text-center">Cant.</TableHead>
                    <TableHead className="text-right">P. Unit.</TableHead>
                    <TableHead className="text-right">Descuento Ítem</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {order.items.map((item, index) => (
                    <TableRow key={item.product.id + (item.discount?.reason || '') + index}>
                        <TableCell className="font-medium">
                            {item.product.name}
                            {item.discount?.reason && <Badge variant="outline" className="ml-2 text-xs p-1 bg-green-100 text-green-700">{item.discount.reason}</Badge>}
                            {item.prescriptionDetails && <p className="text-xs text-blue-600 italic whitespace-pre-wrap mt-1">{item.prescriptionDetails}</p>}
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right text-green-600">
                            {item.discount?.amountApplied && item.discount.amountApplied > 0 ? `-${formatCurrency(item.discount.amountApplied)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-sm">
                <h4 className="font-semibold mb-1">Detalles de Pago:</h4>
                {order.payments.map((payment, index) => (
                    <div key={index} className="p-2 border rounded-md bg-muted/30 text-xs">
                        <div className="flex items-center font-medium">
                            {paymentMethodIcons[payment.method]}
                            {paymentMethodLabels[payment.method]}: {formatCurrency(payment.amountCRC)}
                            {payment.currencyPaid === 'USD' && payment.amountInCurrency && (
                                <span className="text-muted-foreground ml-1">({formatCurrency(payment.amountInCurrency, 'USD')} @ {payment.exchangeRateApplied?.toFixed(2)})</span>
                            )}
                        </div>
                        {payment.reference && <p className="text-muted-foreground pl-5">Ref: {payment.reference}</p>}
                        {payment.method === 'transfer' && payment.transferVerified && <p className="text-green-600 pl-5">(Transferencia Verificada)</p>}
                        {payment.method === 'cash' && typeof payment.cashChange === 'number' && payment.cashChange > 0 && (
                            <p className="text-muted-foreground pl-5">Vuelto: {formatCurrency(payment.cashChange)}</p>
                        )}
                    </div>
                ))}
              </div>
              <div className="space-y-1 text-sm text-right">
                <p><span className="font-medium text-muted-foreground">Subtotal Original:</span> {formatCurrency(order.subtotalOriginalCRC)}</p>
                { (order.itemsDiscountAmountCRC && order.itemsDiscountAmountCRC > 0) &&
                    <p className="text-green-600"><span className="font-medium">Descuentos Ítems:</span> -{formatCurrency(order.itemsDiscountAmountCRC)}</p>
                }
                <p><span className="font-medium text-muted-foreground">Subtotal (c/Dctos Ítem):</span> {formatCurrency(order.subtotalAfterItemDiscountsCRC)}</p>
                 { (order.orderDiscountAmountCRC && order.orderDiscountAmountCRC > 0 && order.couponApplied) &&
                    <p className="text-green-600"><span className="font-medium">Descuento Cupón ({order.couponApplied.code}):</span> -{formatCurrency(order.orderDiscountAmountCRC)}</p>
                }
                <p><span className="font-medium text-muted-foreground">Base Imponible:</span> {formatCurrency(order.baseForTaxCRC)}</p>
                <p><span className="font-medium text-muted-foreground">IV ({((order.taxAmountCRC / (order.baseForTaxCRC || 1)) * 100 || 13).toFixed(0)}%):</span> {formatCurrency(order.taxAmountCRC)}</p>
                <Separator className="my-1.5" />
                <p className="font-bold text-lg text-primary"><span className="font-medium text-muted-foreground">Total Orden:</span> {formatCurrency(order.totalCRC)}</p>
                 {typeof order.amountPaidTotalCRC === 'number' && (
                  <p><span className="font-medium text-muted-foreground">Monto Total Pagado:</span> {formatCurrency(order.amountPaidTotalCRC)}</p>
                )}
                {typeof order.balanceDueCRC === 'number' && order.balanceDueCRC > 0.001 && (
                  <p className="font-semibold text-destructive"><span className="text-muted-foreground">Saldo Pendiente:</span> {formatCurrency(order.balanceDueCRC)}</p>
                )}
              </div>
            </div>
            
            {order.notes && (
                <> <Separator /> <div> <h4 className="font-semibold mb-1">Notas del Pedido:</h4> <p className="text-xs text-muted-foreground whitespace-pre-wrap">{order.notes}</p> </div> </>
            )}
            
            {clinicSettings.billingIncludeReturnsPolicy && clinicSettings.billingReturnsPolicy && (
                 <> <Separator /> <div className="mt-4 pt-2 border-t border-dashed"> <h4 className="font-semibold mb-1 text-xs flex items-center gap-1"><Info className="h-3 w-3"/>Política de Devoluciones y Garantías:</h4> <p className="text-xs text-muted-foreground whitespace-pre-wrap">{clinicSettings.billingReturnsPolicy}</p> </div></>
            )}

            <Separator />
            <div className="text-center text-xs text-muted-foreground pt-4">
                <p>¡Gracias por su compra!</p>
                {(order.documentTypeGenerated === 'electronic_invoice' || order.documentTypeGenerated === 'electronic_ticket') && <p>Este documento es una simulación de un comprobante electrónico.</p>}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-muted/20 flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground text-left sm:mr-auto max-w-md">
                <Info className="inline h-3.5 w-3.5 mr-1" />
                <strong>Nota de Impresión:</strong> Este es un formato para pantalla. Para impresoras de recibos (ej: Epson TM-U220), el sistema generaría un formato de texto específico.
            </p>
            <div className="flex gap-2 self-end sm:self-center">
                <Button type="button" variant="outline" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" /> Imprimir Comprobante
                </Button>
                <DialogClose asChild>
                    <Button type="button" variant="default">
                     <XCircle className="mr-2 h-4 w-4" /> Cerrar
                    </Button>
                </DialogClose>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
