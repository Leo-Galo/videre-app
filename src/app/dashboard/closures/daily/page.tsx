"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Archive, DollarSign, CreditCard, Smartphone, Landmark, AlertTriangle, CheckCircle2, Printer, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { Order } from '@/types/pos';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCashBoxStore } from '@/hooks/use-cash-register-store';
import { getOrders } from '@/services/order-service';

export default function DailyCashRegisterClosurePage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { cashBoxStatus, closeCashBox, lastOpeningDate } = useCashBoxStore();
  const [userName, setUserName] = useState("Cajero");
  
  const [closureNotes, setClosureNotes] = useState<string>("");
  const [sessionSales, setSessionSales] = useState<Order[]>([]);

  useEffect(() => {
    const storedUserName = localStorage.getItem('mockUserName');
    if (storedUserName) setUserName(storedUserName);

    if (cashBoxStatus === 'open' && lastOpeningDate) {
        setIsDataLoading(true);
        getOrders().then(allOrders => {
             const salesSinceLastClosure = allOrders.filter(order => 
                (order.status === 'completed' || order.status === 'partially_paid') &&
                parseISO(order.createdAt) > new Date(lastOpeningDate)
            );
            setSessionSales(salesSinceLastClosure);
            setIsDataLoading(false);
        });
    } else {
        setIsDataLoading(false);
    }

  }, [cashBoxStatus, lastOpeningDate]);

  const salesSummary = useMemo(() => {
    const summary = {
      cash: 0,
      card: 0,
      sinpe: 0,
      transfer: 0,
      totalCollected: 0,
    };

    sessionSales.forEach(order => {
      if (order.status !== 'completed' && order.status !== 'partially_paid') return;
      
      order.payments.forEach(payment => {
        summary.totalCollected += payment.amountCRC;
        summary[payment.method] = (summary[payment.method] || 0) + payment.amountCRC;
      });
    });
    return summary;
  }, [sessionSales]);

  const handleConfirmClosure = async () => {
    setIsLoading(true);
    console.log("Cierre de Caja Confirmado:", {
      userName,
      sessionStartTime: lastOpeningDate,
      closureTime: new Date().toISOString(),
      salesSummary,
      closureNotes,
    });
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    closeCashBox();
    
    toast({
      title: "Cierre de Caja Finalizado",
      description: `El cierre para ${userName} se ha completado.`,
    });
    setIsLoading(false);
    setClosureNotes("");
  };

  const formatCurrency = (amount: number) => `¢${new Intl.NumberFormat('es-CR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
  const formatDate = (date: Date | string | null) => {
      if (!date) return 'N/A';
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return format(dateObj, 'PPPpp', { locale: es });
  }
  
  if (cashBoxStatus === 'closed' && !isDataLoading) {
      return (
        <Card className="shadow-lg rounded-xl text-center">
             <CardHeader>
                <Archive className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <CardTitle className="text-2xl font-headline text-primary">Caja Cerrada</CardTitle>
                <CardDescription>No hay ninguna sesión de caja activa para cerrar.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">Para poder realizar un cierre, primero debes abrir una nueva sesión de caja.</p>
                <Button asChild>
                    <Link href="/dashboard/closures/opening">Abrir Caja</Link>
                </Button>
            </CardContent>
        </Card>
      );
  }

  if (isDataLoading) {
      return <div className="space-y-6"><Skeleton className="h-40 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
            <Archive className="h-6 w-6" /> Cierre de Caja Diario
          </CardTitle>
          <CardDescription>
            Realiza el cierre de caja para el turno actual del usuario: <strong>{userName}</strong>.
            <br/>
            <span className="text-xs text-muted-foreground">
              {lastOpeningDate ? `Sesión actual iniciada el: ${formatDate(lastOpeningDate)}` : "No hay sesión de caja activa."}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="p-4 border rounded-md bg-muted/20">
              <h3 className="font-semibold text-lg mb-3">Resumen de Cobros de la Sesión</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div><strong className="text-muted-foreground">Total Cobrado en Sesión:</strong> {formatCurrency(salesSummary.totalCollected)}</div>
                <Separator className="md:col-span-2 my-1"/>
                <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-green-600"/>Cobros en Efectivo (¢): <strong>{formatCurrency(salesSummary.cash)}</strong></div>
                <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-blue-600"/>Cobros con Tarjeta (¢): <strong>{formatCurrency(salesSummary.card)}</strong></div>
                <div className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-purple-600"/>Cobros SINPE Móvil (¢): <strong>{formatCurrency(salesSummary.sinpe)}</strong></div>
                <div className="flex items-center gap-2"><Landmark className="h-4 w-4 text-orange-600"/>Cobros Transferencia (¢): <strong>{formatCurrency(salesSummary.transfer)}</strong></div>
              </div>
            </div>
            
            <div>
                <label htmlFor="closureNotes">Notas del Cierre (Opcional)</label>
                <Textarea id="closureNotes" placeholder="Observaciones, justificación de diferencias, etc." value={closureNotes} onChange={(e) => setClosureNotes(e.target.value)} className="mt-1" rows={3}/>
            </div>

             <Alert variant="warning" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Acción Final</AlertTitle>
                <AlertDescription>
                    Una vez confirmado, este cierre de caja se registrará y no podrá modificarse. Asegúrese de que todos los datos son correctos.
                </AlertDescription>
            </Alert>
        </CardContent>
         <CardFooter className="p-6 pt-0 flex flex-col sm:flex-row justify-end gap-3">
            <Button variant="outline" onClick={() => { closeCashBox(); toast({title: "Caja Liberada", description: "Se ha cancelado el cierre y la caja está disponible para una nueva apertura."}) }} disabled={isLoading} className="w-full sm:w-auto">
                Cancelar Cierre y Liberar Caja
            </Button>
            <Button onClick={handleConfirmClosure} disabled={isLoading} className="w-full sm:w-auto">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Confirmar y Finalizar Cierre
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
