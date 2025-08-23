
"use client";

import { useState, useEffect, useMemo } from 'react';
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { PlusCircle, Trash2, Loader2, DollarSign, CreditCard, Smartphone, Landmark, Settings2, Banknote } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { Order, PaymentMethod, PaymentDetail } from '@/types/pos';

interface AddPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  order: Order | null;
  onPaymentAdded: (orderId: string, newPayments: PaymentDetail[]) => void;
}

const paymentMethodOptions: { value: PaymentMethod; label: string; icon: React.ElementType; requiresReference: boolean }[] = [
    { value: "cash", label: "Efectivo", icon: DollarSign, requiresReference: false },
    { value: "card", label: "Tarjeta", icon: CreditCard, requiresReference: true },
    { value: "sinpe", label: "SINPE Móvil", icon: Smartphone, requiresReference: true },
    { value: "transfer", label: "Transferencia", icon: Landmark, requiresReference: true },
];

export function AddPaymentDialog({ isOpen, onOpenChange, order, onPaymentAdded }: AddPaymentDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentLines, setPaymentLines] = useState<{ id: string; method: PaymentMethod; amount: number; reference?: string }[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<PaymentMethod>("cash");
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<string>("");
  const [currentPaymentReference, setCurrentPaymentReference] = useState<string>("");
  
  const balanceDue = order?.balanceDueCRC || 0;

  useEffect(() => {
    if (isOpen && order) {
      setPaymentLines([]);
      setCurrentPaymentAmount(balanceDue > 0 ? balanceDue.toFixed(2) : "");
      setCurrentPaymentMethod("cash");
      setCurrentPaymentReference("");
    }
  }, [isOpen, order, balanceDue]);
  
  const totalNewPaid = useMemo(() => {
    return paymentLines.reduce((sum, line) => sum + line.amount, 0);
  }, [paymentLines]);
  
  const newRemainingBalance = useMemo(() => {
    return balanceDue - totalNewPaid;
  }, [balanceDue, totalNewPaid]);


  const handleAddPaymentLine = () => {
    const amount = parseFloat(currentPaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Monto Inválido", variant: "default" });
      return;
    }
    if (amount > balanceDue - totalNewPaid + 0.001) {
        toast({ title: "Monto Excede Saldo", description: `No puede abonar más del saldo pendiente (¢${(balanceDue - totalNewPaid).toLocaleString('es-CR')}).`, variant: "default" });
        return;
    }
    const selectedMethodDetails = paymentMethodOptions.find(pm => pm.value === currentPaymentMethod);
    if (selectedMethodDetails?.requiresReference && !currentPaymentReference.trim()) {
        toast({ title: "Referencia Requerida", variant: "default" });
        return;
    }

    setPaymentLines(prev => [...prev, {
      id: Date.now().toString(),
      method: currentPaymentMethod,
      amount,
      reference: currentPaymentReference || undefined
    }]);
    
    const newRemaining = balanceDue - (totalNewPaid + amount);
    setCurrentPaymentAmount(newRemaining > 0 ? newRemaining.toFixed(2) : "");
    setCurrentPaymentReference("");
  };
  
  const handleRemovePaymentLine = (lineId: string) => {
    setPaymentLines(prev => prev.filter(line => line.id !== lineId));
  };
  
  const handleConfirmPayment = async () => {
    if (!order || paymentLines.length === 0) return;
    setIsLoading(true);
    await onPaymentAdded(order.id, paymentLines.map(p => ({...p})));
    setIsLoading(false);
  };


  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-6 w-6" /> Registrar Abono / Pago
          </DialogTitle>
          <DialogDescription>
            Añade un pago para la orden #{order.orderNumber} de <strong>{order.customer?.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-lg font-bold text-center">Saldo Pendiente: <span className="text-destructive">{new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(newRemainingBalance)}</span></p>
          
          <Card className="p-4 bg-muted/30">
              <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                      <Label htmlFor="paymentMethod-add">Método de Pago</Label>
                      <Select value={currentPaymentMethod} onValueChange={(value: PaymentMethod) => setCurrentPaymentMethod(value)}><SelectTrigger id="paymentMethod-add"><SelectValue /></SelectTrigger><SelectContent>{paymentMethodOptions.map(pm => <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div>
                      <Label htmlFor="paymentAmount-add">Monto (¢)</Label>
                      <Input id="paymentAmount-add" type="number" placeholder="Monto" value={currentPaymentAmount} onChange={e => setCurrentPaymentAmount(e.target.value)} />
                  </div>
              </div>
              {paymentMethodOptions.find(pm => pm.value === currentPaymentMethod)?.requiresReference && (
                  <div><Label htmlFor="paymentReference-add">Referencia</Label><Input id="paymentReference-add" placeholder="Nº de Ref. o Lote" value={currentPaymentReference} onChange={e => setCurrentPaymentReference(e.target.value)}/></div>
              )}
              <Button onClick={handleAddPaymentLine} className="w-full mt-3" size="sm"><PlusCircle className="mr-2 h-4 w-4"/> Añadir Pago</Button>
          </Card>
          
          {paymentLines.length > 0 && (
            <div className="space-y-2">
                <Label className="text-sm font-medium">Pagos a Registrar:</Label>
                <div className="border rounded-md max-h-32 overflow-y-auto">
                {paymentLines.map((line) => (
                    <div key={line.id} className="flex justify-between items-center p-2 text-xs border-b last:border-b-0">
                    <div className="flex items-center gap-2">
                        {React.createElement(paymentMethodOptions.find(pm => pm.value === line.method)?.icon || Settings2, { className: "h-4 w-4 text-muted-foreground" })}
                        <span>{paymentMethodOptions.find(pm => pm.value === line.method)?.label}: {new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(line.amount)}</span>
                        {line.reference && <span className="text-muted-foreground truncate" title={line.reference}> (Ref: {line.reference})</span>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemovePaymentLine(line.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                ))}
                </div>
            </div>
          )}

        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline" disabled={isLoading}>Cancelar</Button></DialogClose>
          <Button onClick={handleConfirmPayment} disabled={isLoading || paymentLines.length === 0}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Pago(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
