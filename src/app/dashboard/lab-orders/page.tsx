
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, PlusCircle, Eye, Printer, FlaskConical, Loader2, CheckCircle, PackageCheck, Send, Ban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { LabOrder, LabOrderStatus } from '@/types/lab-order';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { LabOrderDialog } from '@/components/dashboard/lab/lab-order-dialog';
import type { Patient } from '@/types/patient';
import { getPatients } from '@/services/patient-service';
import { getLabOrders, addLabOrder, updateLabOrderStatus } from '@/services/lab-order-service';
import { LabOrderDetailsDialog } from '@/components/dashboard/lab/lab-order-details-dialog';

export default function LabOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [fetchedOrders, fetchedPatients] = await Promise.all([
        getLabOrders(),
        getPatients(),
      ]);
      setOrders(fetchedOrders);
      setPatients(fetchedPatients);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleOrderCreated = (newOrder: LabOrder) => {
    setOrders(prev => [newOrder, ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const handleStatusChange = async (orderId: string, status: LabOrderStatus) => {
    const updatedOrder = await updateLabOrderStatus(orderId, status);
    if(updatedOrder) {
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      toast({ title: "Estado Actualizado", description: `La orden ${updatedOrder.orderNumber} ahora está ${status}.`});
    }
  };
  
  const handlePrintOrder = (orderNumber: string) => {
    toast({
        title: "Impresión de Orden (Simulación)",
        description: `Se está preparando la orden de laboratorio #${orderNumber} para impresión.`
    });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o =>
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.labName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const getStatusBadgeVariant = (status: LabOrderStatus) => {
    switch(status) {
      case 'Pendiente': return 'outline';
      case 'Enviada': case 'En Proceso': return 'secondary';
      case 'Completada': case 'Recibida': return 'default';
      case 'Cancelada': return 'destructive';
      default: return 'default';
    }
  };

  const formatDateSafe = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try { return format(parseISO(dateString), "dd MMM, yy HH:mm", { locale: es }); }
    catch { return 'Fecha Inválida'; }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-4 w-2/3 mb-6" />
        <Card><CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader><CardContent><Skeleton className="h-80 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            <FlaskConical className="h-7 w-7" /> Órdenes de Laboratorio
          </h1>
          <p className="text-muted-foreground">Crea y da seguimiento a los trabajos enviados a laboratorios.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}><PlusCircle className="mr-2 h-5 w-5" /> Crear Orden</Button>
      </div>

      <Card className="shadow-md rounded-xl">
        <CardHeader>
          <CardTitle>Listado de Órdenes</CardTitle>
          <div className="mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar por Nº Orden, Paciente, Laboratorio..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-full md:w-1/2 lg:w-1/3" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Orden</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Laboratorio</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.patientName}</TableCell>
                    <TableCell>{order.labName || 'N/A'}</TableCell>
                    <TableCell>{formatDateSafe(order.createdAt)}</TableCell>
                    <TableCell className="text-center"><Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setSelectedOrder(order)}><Eye className="mr-2 h-4 w-4"/> Ver Detalles</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrintOrder(order.orderNumber)}><Printer className="mr-2 h-4 w-4"/> Imprimir Orden</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'Enviada')}><Send className="mr-2 h-4 w-4"/> Marcar como Enviada</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'Recibida')}><PackageCheck className="mr-2 h-4 w-4"/> Marcar como Recibida</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'Cancelada')} className="text-destructive"><Ban className="mr-2 h-4 w-4"/> Cancelar Orden</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <LabOrderDialog 
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        patients={patients}
        onOrderCreated={handleOrderCreated}
      />
      
      <LabOrderDetailsDialog
        isOpen={selectedOrder !== null}
        onOpenChange={(isOpen) => !isOpen && setSelectedOrder(null)}
        order={selectedOrder}
      />
    </div>
  );
}
