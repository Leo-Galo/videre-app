
"use client";

import type { NextPage } from 'next';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"; // Added
import { MoreHorizontal, Search, Eye, Printer, RotateCcw, AlertTriangle, Receipt, Ban, Loader2, Download, Upload, DollarSign } from 'lucide-react'; 
import Link from 'next/link';
import { useEffect, useState, useMemo, useRef } from 'react'; 
import type { Order, OrderStatus, ReturnedItemInfo, PaymentMethod, DocumentType } from '@/types/pos'; 
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn, formatCurrencyCRC } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ReturnOrderDialog } from '@/components/dashboard/sales/return-order-dialog';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; 
import { getOrders, voidOrder, processReturn, addPaymentToOrder } from '@/services/order-service';
import { InvoiceModal } from '@/components/dashboard/sales/invoice-modal';
import { AddPaymentDialog } from '@/components/dashboard/sales/add-payment-dialog';

const SalesHistoryPage: NextPage = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [orderToReturn, setOrderToReturn] = useState<Order | null>(null);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [orderToVoid, setOrderToVoid] = useState<Order | null>(null);
  const [isVoidConfirmOpen, setIsVoidConfirmOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [isProcessingVoid, setIsProcessingVoid] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const salesHistoryImportInputRef = useRef<HTMLInputElement>(null);
  const [isSalesHistoryImportConfirmOpen, setIsSalesHistoryImportConfirmOpen] = useState(false);
  const [salesHistoryFileToImport, setSalesHistoryFileToImport] = useState<File | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [orderToPay, setOrderToPay] = useState<Order | null>(null);
  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('mockUserRole');
    setUserRole(role);
    async function loadOrders() {
        setIsLoading(true);
        const fetchedOrders = await getOrders();
        setOrders(fetchedOrders);
        setIsLoading(false);
    }
    loadOrders();
  }, []);

  const isAdmin = userRole === "Admin";

  const filteredOrders = useMemo(() => {
    return orders.filter(order =>
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const handleOpenReturnDialog = (order: Order) => {
    if (order.status !== 'completed' && order.status !== 'partially_returned') {
        toast({
            variant: "destructive",
            title: "Acción No Permitida",
            description: "Solo se pueden procesar devoluciones para órdenes completadas o parcialmente devueltas.",
        });
        return;
    }
    setOrderToReturn(order);
    setIsReturnDialogOpen(true);
  };
  
  const handleReturnProcessed = async (orderId: string, returnedItems: ReturnedItemInfo[], newStatus: OrderStatus, generalReason?: string) => {
    const updatedOrder = await processReturn(orderId, returnedItems, newStatus, generalReason);
    if(updatedOrder){
        setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? updatedOrder : o));
        returnedItems.forEach(item => {
          console.log(`SIMULATED: Stock for product ${item.productId} (${item.productName}) increased by ${item.quantityReturned}.`);
        });
        toast({
          title: "Devolución Procesada",
          description: `La orden ${updatedOrder.orderNumber} ha sido actualizada.`,
        });
    } else {
        toast({ variant: "destructive", title: "Error", description: "No se pudo procesar la devolución." });
    }
    setIsReturnDialogOpen(false);
    setOrderToReturn(null);
  };
  
  const handleVoidAction = (order: Order) => {
    if (order.status !== 'completed' && order.status !== 'partially_returned') {
        toast({
            variant: "destructive",
            title: "Acción No Permitida",
            description: "Solo se pueden anular facturas completadas o parcialmente devueltas.",
        });
        return;
    }
    if (isAdmin) {
      // Admin flow: open the dialog to confirm voiding
      setOrderToVoid(order);
      setVoidReason('');
      setIsVoidConfirmOpen(true);
    } else {
      // Non-admin flow: simulate sending a request
      toast({
        title: "Solicitud de Anulación Enviada",
        description: `Se ha enviado una solicitud para anular la orden ${order.orderNumber}. Un administrador debe aprobarla.`
      });
      // In a real app, this would trigger a backend call to create a request record.
    }
  };

  const handleConfirmVoid = async () => {
    if (!orderToVoid || !voidReason.trim()) {
        toast({ variant: "destructive", title: "Error", description: "El motivo de anulación es requerido." });
        return;
    }
    setIsProcessingVoid(true);
    const updatedOrder = await voidOrder(orderToVoid.id, voidReason);
    
    if (updatedOrder) {
        setOrders(prevOrders => prevOrders.map(o => o.id === orderToVoid.id ? updatedOrder : o));
        toast({
          title: "Factura Anulada",
          description: `La orden ${orderToVoid.orderNumber} ha sido anulada. Motivo: ${voidReason}. En un sistema real, se generaría una Nota de Crédito.`,
        });
    } else {
        toast({ variant: "destructive", title: "Error", description: "No se pudo anular la factura." });
    }
    
    setIsProcessingVoid(false);
    setIsVoidConfirmOpen(false);
    setOrderToVoid(null);
    setVoidReason('');
  };
  
  const handleOpenAddPaymentDialog = (order: Order) => {
    setOrderToPay(order);
    setIsAddPaymentDialogOpen(true);
  };

  const handlePaymentAdded = async (orderId: string, newPayments: any[]) => {
    const updatedOrder = await addPaymentToOrder(orderId, newPayments);
    if (updatedOrder) {
        setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? updatedOrder : o));
        toast({
            title: "Pago Registrado",
            description: `Se ha registrado un nuevo abono para la orden ${updatedOrder.orderNumber}.`,
        });
    } else {
        toast({ variant: "destructive", title: "Error", description: "No se pudo registrar el pago." });
    }
    setIsAddPaymentDialogOpen(false);
    setOrderToPay(null);
  };


  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending_payment': return 'secondary';
      case 'cancelled':
      case 'voided': return 'destructive';
      case 'partially_returned': return 'outline';
      case 'fully_returned': return 'outline';
      case 'partially_paid': return 'secondary';
      default: return 'default';
    }
  };
  
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

  const formatDateWithTime = (dateString?: string) => {
    if (!dateString) return <span className="text-muted-foreground">N/A</span>;
    try {
        const date = parseISO(dateString);
        return (
            <div className="flex flex-col">
                <span>{format(date, 'dd MMM, yyyy', { locale: es })}</span>
                <span className="text-xs text-muted-foreground">{format(date, 'HH:mm', { locale: es })}</span>
            </div>
        );
    } catch(e) {
        return <span className="text-destructive">Fecha inválida</span>;
    }
  }

  const handleDownloadSalesHistoryImportTemplate = () => {
    const headers = "ID_Orden_Sistema_Anterior,Fecha_Orden (YYYY-MM-DD HH:MM:SS),Nombre_Cliente,Total_Orden_CRC,Estado_Orden,Metodo_Pago_Principal,Referencia_Pago_Principal,Numero_Factura_Hacienda,Notas_Orden\n";
    const exampleRow = "ORD_SYS_OLD_001,2023-12-15 14:30:00,Maria Solano,55000,completed,card,REF12345,FE-001-00000001,Venta de lentes progresivos\n";
    const csvContent = "\uFEFF" + headers + exampleRow;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "plantilla_importacion_ventas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Plantilla de Importación de Ventas Descargada" });
  };

  const handleImportSalesHistoryClick = () => {
    salesHistoryImportInputRef.current?.click();
  };

  const handleSalesHistoryFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.type !== 'text/csv') {
            toast({ variant: "destructive", title: "Archivo Inválido", description: "Solo se permiten archivos CSV para importar ventas." });
            event.target.value = "";
            return;
        }
        setSalesHistoryFileToImport(file);
        setIsSalesHistoryImportConfirmOpen(true);
        event.target.value = "";
    }
  };
  
  const processSalesHistoryImportFile = () => {
    if (!salesHistoryFileToImport) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvData = e.target?.result as string;
      const rows = csvData.split('\n').slice(1); 
      const importedOrders: Order[] = [];
      rows.forEach((row, index) => {
        const columns = row.split(',');
        if (columns.length >= 5 && columns[0] && columns[1] && columns[2] && columns[3] && columns[4]) {
          try {
            importedOrders.push({
              id: `imported-order-${Date.now()}-${index}`,
              orderNumber: columns[0] || `IMP-${Date.now()}-${index}`,
              createdAt: parseISO(columns[1]).toISOString(),
              customer: { id: `imported-cust-${index}`, name: columns[2] },
              totalCRC: parseFloat(columns[3]) || 0,
              status: (columns[4].trim() as OrderStatus) || 'completed',
              items: [], 
              payments: columns[5] ? [{ method: columns[5].trim() as PaymentMethod, amountCRC: parseFloat(columns[3]) || 0, reference: columns[6] || undefined }] : [],
              subtotalOriginalCRC: parseFloat(columns[3]) || 0, 
              itemsDiscountAmountCRC: 0,
              subtotalAfterItemDiscountsCRC: parseFloat(columns[3]) || 0,
              orderDiscountAmountCRC: 0,
              baseForTaxCRC: parseFloat(columns[3]) || 0, 
              taxAmountCRC: 0, 
              documentTypeGenerated: columns[7] ? 'electronic_invoice' : 'electronic_ticket', 
              notes: columns[8] || undefined,
              amountPaidTotalCRC: parseFloat(columns[3]) || 0,
              balanceDueCRC: 0,
            });
          } catch (error) {
            console.warn(`Error parsing row ${index+1} for sales history import:`, error);
          }
        }
      });
      setOrders(prev => [...prev, ...importedOrders]);
      toast({ title: "Importación de Ventas Completa", description: `${importedOrders.length} órdenes procesadas del CSV.` });
    };
    reader.readAsText(salesHistoryFileToImport);
    setSalesHistoryFileToImport(null);
  };
  
    const handleViewInvoice = (order: Order) => {
      setSelectedOrderForInvoice(order);
      setIsInvoiceModalOpen(true);
    };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-56 mb-2" />
              <Skeleton className="h-4 w-72" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full md:w-1/2 lg:w-1/3 mb-4" />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {[...Array(6)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-20" /></TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                      <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <Card className="shadow-lg rounded-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
              <Receipt className="h-6 w-6" /> Historial de Ventas
            </CardTitle>
            <CardDescription>Consulta y gestiona las órdenes y ventas pasadas.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Button variant="outline" onClick={handleDownloadSalesHistoryImportTemplate} disabled={!isAdmin} className="flex items-center gap-2">
                          <Download className="h-4 w-4" /> Plantilla
                      </Button>
                  </TooltipTrigger>
                  {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
              </Tooltip>
              <input type="file" accept=".csv" ref={salesHistoryImportInputRef} onChange={handleSalesHistoryFileSelected} className="hidden"/>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Button variant="outline" onClick={handleImportSalesHistoryClick} disabled={!isAdmin} className="flex items-center gap-2">
                          <Upload className="h-4 w-4" /> Importar
                      </Button>
                  </TooltipTrigger>
                  {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
              </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative w-full sm:w-auto sm:flex-grow md:flex-grow-0 md:w-1/2 lg:w-1/3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por Nº Orden, Cliente o Estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
          </div>
          {filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Orden</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{formatDateWithTime(order.createdAt)}</TableCell>
                      <TableCell>{order.customer?.name || 'N/A'}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrencyCRC(order.totalCRC)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusBadgeVariant(order.status)}>{getStatusDisplayName(order.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewInvoice(order)}>
                              <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewInvoice(order)}>
                              <Printer className="mr-2 h-4 w-4" /> Imprimir Comprobante
                            </DropdownMenuItem>
                             {order.status === 'partially_paid' && (
                                <DropdownMenuItem onClick={() => handleOpenAddPaymentDialog(order)}>
                                    <DollarSign className="mr-2 h-4 w-4 text-green-600"/> Registrar Abono / Pagar
                                </DropdownMenuItem>
                            )}
                            {(order.status === 'completed' || order.status === 'partially_returned') && (
                                <>
                                <DropdownMenuItem onClick={() => handleOpenReturnDialog(order)}>
                                    <RotateCcw className="mr-2 h-4 w-4 text-orange-500" /> Iniciar Devolución
                                </DropdownMenuItem>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuItem onClick={() => handleVoidAction(order)} disabled={!isAdmin} className={cn(!isAdmin && "text-muted-foreground cursor-not-allowed")}>
                                          <Ban className="mr-2 h-4 w-4 text-red-500" /> Anular Factura
                                        </DropdownMenuItem>
                                    </TooltipTrigger>
                                    {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
                                </Tooltip>
                                </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Receipt size={48} className="mx-auto mb-2" />
              <p>No se encontraron órdenes con los criterios de búsqueda.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {orderToReturn && (
        <ReturnOrderDialog
            isOpen={isReturnDialogOpen}
            onOpenChange={setIsReturnDialogOpen}
            order={orderToReturn}
            onReturnProcessed={handleReturnProcessed}
        />
      )}

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

      <AlertDialog open={isVoidConfirmOpen} onOpenChange={setIsVoidConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anular Factura: {orderToVoid?.orderNumber}</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará la factura como anulada. En un sistema real, se generaría una Nota de Crédito fiscal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="voidReason">Motivo de Anulación *</Label>
            <Textarea 
              id="voidReason"
              placeholder="Ej: Error en facturación, Cliente canceló servicio..."
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              rows={3}
            />
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
      <AlertDialog open={isSalesHistoryImportConfirmOpen} onOpenChange={(open) => { if (!open) setSalesHistoryFileToImport(null); setIsSalesHistoryImportConfirmOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                ¡Atención! ¿Confirmas la importación?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de importar un historial de ventas desde "{salesHistoryFileToImport?.name}". Esta acción puede tener consecuencias irreversibles.
              <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                <li>Asegúrate de que el archivo CSV utiliza la <strong>plantilla descargada</strong>.</li>
                <li>La importación <strong>añadirá nuevas ventas</strong>.</li>
                <li>Esta funcionalidad es para migración de datos. Úsala con precaución.</li>
              </ul>
              ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSalesHistoryFileToImport(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={processSalesHistoryImportFile}>Sí, continuar con la importación</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
    </TooltipProvider>
  );
};

export default SalesHistoryPage;
