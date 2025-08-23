
"use client";

import type { NextPage } from 'next';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DollarSign, Search, Eye, History, ArrowLeft, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatCurrencyCRC } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { getOrders, addPaymentToOrder } from '@/services/order-service';
import type { Order, OrderStatus, PaymentDetail } from '@/types/pos';
import { InvoiceModal } from '@/components/dashboard/sales/invoice-modal';
import { AddPaymentDialog } from '@/components/dashboard/sales/add-payment-dialog';
import { PaymentReceiptModal } from '@/components/dashboard/sales/payment-receipt-modal';

const AccountsReceivablePage: NextPage = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [orderToPay, setOrderToPay] = useState<Order | null>(null);
  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState(false);
  
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  
  const [lastPaymentDetails, setLastPaymentDetails] = useState<PaymentDetail[] | null>(null);
  const [orderForReceipt, setOrderForReceipt] = useState<Order | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const allOrders = await getOrders();
      const pendingOrders = allOrders.filter(
        o => o.status === 'partially_paid' || o.status === 'pending_payment'
      );
      setOrders(pendingOrders);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(order =>
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const totalBalanceDue = useMemo(() => {
    return filteredOrders.reduce((sum, order) => sum + (order.balanceDueCRC || 0), 0);
  }, [filteredOrders]);

  const handleOpenAddPaymentDialog = (order: Order) => {
    setOrderToPay(order);
    setIsAddPaymentDialogOpen(true);
  };
  
  const handleViewInvoice = (order: Order) => {
    setSelectedOrderForInvoice(order);
    setIsInvoiceModalOpen(true);
  };

  const handlePaymentAdded = async (orderId: string, newPayments: PaymentDetail[]) => {
    const updatedOrder = await addPaymentToOrder(orderId, newPayments);
    if (updatedOrder) {
      setOrders(prevOrders => {
        if (updatedOrder.status === 'completed') {
            return prevOrders.filter(o => o.id !== orderId);
        } else {
            return prevOrders.map(o => o.id === orderId ? updatedOrder : o);
        }
      });
      toast({
        title: "Pago Registrado",
        description: `Se ha registrado un nuevo abono para la orden ${updatedOrder.orderNumber}.`,
      });
      setLastPaymentDetails(newPayments);
      setOrderForReceipt(updatedOrder);
      setIsReceiptModalOpen(true);
    } else {
      toast({ variant: "destructive", title: "Error", description: "No se pudo registrar el pago." });
    }
    setIsAddPaymentDialogOpen(false);
    setOrderToPay(null);
  };
  
  const getStatusDisplayName = (status: OrderStatus): string => {
      switch (status) {
        case 'pending_payment': return 'Pend. Pago';
        case 'partially_paid': return 'Abonada';
        default: return status;
      }
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-4 w-2/3 mb-6" />
        <Card className="shadow-md rounded-xl"><CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader><CardContent><Skeleton className="h-80 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <Wallet className="h-7 w-7" /> Cuentas por Cobrar
        </h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard/sales/history">
            <History className="mr-2 h-4 w-4" /> Ver Historial Completo
          </Link>
        </Button>
      </div>
      <CardDescription>
        Gestiona y aplica pagos a todas las facturas con saldo pendiente.
      </CardDescription>

      <Card>
        <CardHeader>
            <CardTitle>Total Pendiente por Cobrar</CardTitle>
            <p className="text-3xl font-bold text-destructive">{formatCurrencyCRC(totalBalanceDue)}</p>
        </CardHeader>
      </Card>
      
      <Card className="shadow-md rounded-xl">
        <CardHeader>
          <CardTitle>Facturas con Saldo Pendiente</CardTitle>
          <div className="mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por Nº Orden o Cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full md:w-1/2 lg:w-1/3"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Orden</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Total Factura</TableHead>
                  <TableHead className="text-right">Total Pagado</TableHead>
                  <TableHead className="text-right">Saldo Pendiente</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.customer?.name || 'N/A'}</TableCell>
                    <TableCell className="text-right">{formatCurrencyCRC(order.totalCRC)}</TableCell>
                    <TableCell className="text-right">{formatCurrencyCRC(order.amountPaidTotalCRC)}</TableCell>
                    <TableCell className="text-right font-bold text-destructive">{formatCurrencyCRC(order.balanceDueCRC || 0)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{getStatusDisplayName(order.status)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="outline" size="sm" className="mr-2" onClick={() => handleViewInvoice(order)}>
                         <Eye className="mr-1 h-3 w-3"/> Ver Factura
                       </Button>
                       <Button size="sm" onClick={() => handleOpenAddPaymentDialog(order)}>
                         <DollarSign className="mr-1 h-3 w-3"/> Registrar Abono
                       </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                            ¡Felicidades! No hay cuentas pendientes por cobrar.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {orderToPay && (
        <AddPaymentDialog
            isOpen={isAddPaymentDialogOpen}
            onOpenChange={setIsAddPaymentDialogOpen}
            order={orderToPay}
            onPaymentAdded={handlePaymentAdded}
        />
      )}

      {selectedOrderForInvoice && (
        <InvoiceModal
            isOpen={isInvoiceModalOpen}
            onOpenChange={setIsInvoiceModalOpen}
            order={selectedOrderForInvoice}
        />
      )}

      {orderForReceipt && lastPaymentDetails && (
        <PaymentReceiptModal
            isOpen={isReceiptModalOpen}
            onOpenChange={setIsReceiptModalOpen}
            order={orderForReceipt}
            payments={lastPaymentDetails}
        />
      )}

    </div>
  );
};

export default AccountsReceivablePage;
