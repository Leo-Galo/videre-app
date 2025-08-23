// src/app/dashboard/consultas/facturas/page.tsx
"use client";

import type { NextPage } from 'next';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Search, Eye, Receipt, Info, MoreHorizontal, Ban, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrencyCRC, cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Order, OrderStatus } from '@/types/pos';
import { getOrders, voidOrder } from '@/services/order-service';
import { InvoiceModal } from '@/components/dashboard/sales/invoice-modal';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';


const getStatusDisplayName = (status: OrderStatus): string => {
    switch (status) {
      case 'completed': return 'Facturada';
      case 'pending_payment': return 'Pend. Pago';
      case 'cancelled': return 'Cancelada';
      case 'voided': return 'Anulada';
      case 'partially_returned': return 'Dev. Parcial';
      case 'fully_returned': return 'Dev. Total';
      case 'partially_paid': return 'Abonada';
      default: return status;
    }
};

const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending_payment': return 'secondary';
      case 'cancelled': case 'voided': return 'destructive';
      case 'partially_returned': return 'outline';
      case 'fully_returned': return 'outline';
      case 'partially_paid': return 'secondary';
      default: return 'default';
    }
};


const InvoiceQueryPage: NextPage = () => {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [orderToVoid, setOrderToVoid] = useState<Order | null>(null);
  const [isVoidConfirmOpen, setIsVoidConfirmOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [isProcessingVoid, setIsProcessingVoid] = useState(false);
  
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const orders = await getOrders();
      setAllOrders(orders);
      setIsLoading(false);
    }
    loadData();

    const role = localStorage.getItem('mockUserRole');
    setUserRole(role);
  }, []);

  const isAdmin = userRole === "Admin";

  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) {
      return []; // No mostrar nada hasta que se busque
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return allOrders.filter(order =>
      order.orderNumber.toLowerCase().includes(lowercasedTerm) ||
      (order.customer?.name.toLowerCase().includes(lowercasedTerm)) ||
      (order.customer?.personalId && order.customer.personalId.includes(lowercasedTerm))
    );
  }, [allOrders, searchTerm]);

  const handleViewInvoice = useCallback((order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  }, []);

  const handleVoidAction = (order: Order) => {
    if (order.status !== 'completed' && order.status !== 'partially_returned') {
      toast({ variant: "destructive", title: "Acción No Permitida", description: "Solo se pueden anular facturas completadas o parcialmente devueltas." });
      return;
    }
    setOrderToVoid(order);
    setVoidReason('');
    setIsVoidConfirmOpen(true);
  };

  const handleConfirmVoid = async () => {
    if (!orderToVoid || !voidReason.trim()) {
      toast({ variant: "destructive", title: "Error", description: "El motivo de anulación es requerido." });
      return;
    }
    setIsProcessingVoid(true);
    const updatedOrder = await voidOrder(orderToVoid.id, voidReason);
    if (updatedOrder) {
      setAllOrders(prev => prev.map(o => o.id === orderToVoid.id ? updatedOrder : o));
      toast({ title: "Factura Anulada", description: `La orden ${orderToVoid.orderNumber} ha sido anulada.` });
    } else {
      toast({ variant: "destructive", title: "Error", description: "No se pudo anular la factura." });
    }
    setIsProcessingVoid(false);
    setIsVoidConfirmOpen(false);
    setOrderToVoid(null);
  };


  return (
    <TooltipProvider>
    <div className="space-y-6">
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
            <Receipt className="h-6 w-6" /> Consulta de Facturas
          </CardTitle>
          <CardDescription>Busca facturas por número de orden, nombre o identificación del paciente.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative w-full sm:w-auto sm:flex-grow md:flex-grow-0 md:w-1/2 lg:w-1/3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por Nº Orden, Nombre o Cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full"
                autoFocus
              />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : searchTerm.trim() && filteredOrders.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>No se encontraron facturas con los criterios de búsqueda.</p>
            </div>
          ) : searchTerm.trim() && filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Orden</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.slice(0, 50).map((order) => ( // Limitar a 50 resultados para rendimiento
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{format(parseISO(order.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell>{order.customer?.name || 'N/A'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusBadgeVariant(order.status)}>{getStatusDisplayName(order.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatCurrencyCRC(order.totalCRC)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir menú</span><MoreHorizontal className="h-4 w-4" /></Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewInvoice(order)}><Eye className="mr-2 h-4 w-4"/> Ver Detalle</DropdownMenuItem>
                              <DropdownMenuSeparator />
                               <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuItem onClick={() => isAdmin && handleVoidAction(order)} disabled={!isAdmin || order.status === 'voided' || order.status === 'cancelled'}>
                                        <div className={cn("flex items-center w-full", !isAdmin && "text-muted-foreground cursor-not-allowed")}>
                                            <Ban className="mr-2 h-4 w-4 text-destructive"/> Anular Factura
                                        </div>
                                    </DropdownMenuItem>
                                </TooltipTrigger>
                                {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
                               </Tooltip>
                           </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredOrders.length > 50 && <p className="text-xs text-muted-foreground text-center mt-4">Mostrando los primeros 50 resultados. Afine su búsqueda para ver más.</p>}
            </div>
          ) : (
             <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-lg">
                <Info className="h-10 w-10 mx-auto mb-2 text-primary/50" />
                <p>Introduce un término de búsqueda para encontrar facturas.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedOrder && (
        <InvoiceModal
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
            order={selectedOrder}
        />
      )}

      <AlertDialog open={isVoidConfirmOpen} onOpenChange={setIsVoidConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anular Factura: {orderToVoid?.orderNumber}</AlertDialogTitle>
            <AlertDialogDescription>Esta acción marcará la factura como anulada. En un sistema real, se generaría una Nota de Crédito fiscal.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="voidReason">Motivo de Anulación *</Label>
            <Textarea id="voidReason" placeholder="Ej: Error en facturación, Cliente canceló..." value={voidReason} onChange={(e) => setVoidReason(e.target.value)} rows={3} />
            {voidReason.trim().length === 0 && <p className="text-xs text-destructive">El motivo es requerido.</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsVoidConfirmOpen(false)} disabled={isProcessingVoid}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmVoid} disabled={isProcessingVoid || !voidReason.trim()}>
              {isProcessingVoid && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Anulación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
};

export default InvoiceQueryPage;
