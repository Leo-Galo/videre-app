
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Search, Eye, Edit, RefreshCw, XCircle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { VidereSubscription } from '@/types/superadmin';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { getSubscriptions } from '@/services/superadmin/subscription-service';

const getStatusDisplayName = (status: VidereSubscription['status']) => {
    switch (status) {
      case 'Active': return 'Activa';
      case 'Trialing': return 'En Prueba';
      case 'PaymentFailed': return 'Pago Fallido';
      case 'Cancelled': return 'Cancelada';
      case 'Expired': return 'Expirada';
      case 'PastDue': return 'Pago Vencido';
      default: return status;
    }
};

export default function SuperAdminSubscriptionsPage() {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<VidereSubscription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const fetchedSubscriptions = await getSubscriptions();
      setSubscriptions(fetchedSubscriptions);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub =>
      sub.clinicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subscriptions, searchTerm]);

  const handleAction = (action: string, subscriptionId: string, clinicName: string) => {
    console.log(`Action: ${action} for subscription ${subscriptionId} of ${clinicName}`);
    toast({
      title: "Acción Realizada",
      description: `${action} para la suscripción de "${clinicName}" procesada.`,
    });
  };
  
  const getStatusBadgeVariant = (status: VidereSubscription['status']) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Trialing': return 'secondary';
      case 'PaymentFailed':
      case 'Cancelled':
      case 'Expired': return 'destructive';
      default: return 'outline';
    }
  };

  const formatDateSafe = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'dd MMM, yyyy', { locale: es });
    } catch (e) { return 'Fecha Inválida'; }
  };

  const formatCurrencyUSD = (amount: number) => {
    return `$${new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
  };


  if (isLoading) {
     return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-4 w-2/3 mb-6" />
        <Card className="shadow-md rounded-xl">
          <CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader>
          <CardContent><Skeleton className="h-80 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary">Gestión de Suscripciones</h1>
        <p className="text-muted-foreground">
          Supervisa y administra todas las suscripciones de las clínicas a Videre SaaS.
        </p>
      </div>

      <Card className="shadow-md rounded-xl">
        <CardHeader>
          <CardTitle>Listado de Suscripciones</CardTitle>
          <div className="mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por clínica, plan o estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full md:w-1/2 lg:w-1/3"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSubscriptions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clínica</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Monto</TableHead>
                    <TableHead className="hidden lg:table-cell">Próx. Factura / Fin Prueba</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.clinicName}</TableCell>
                      <TableCell>{sub.planName}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusBadgeVariant(sub.status)}>{getStatusDisplayName(sub.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        {formatCurrencyUSD(sub.amount)} {sub.currency}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {sub.status === 'Trialing' ? `Fin Prueba: ${formatDateSafe(sub.trialEndDate)}` : `Próx. Fact: ${formatDateSafe(sub.nextBillingDate)}`}
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
                            <DropdownMenuItem onClick={() => handleAction('Ver Historial de Pagos', sub.id, sub.clinicName)}>
                              <Eye className="mr-2 h-4 w-4" /> Ver Historial
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction('Modificar Plan', sub.id, sub.clinicName)}>
                              <Edit className="mr-2 h-4 w-4" /> Modificar Plan
                            </DropdownMenuItem>
                            {sub.status === 'PaymentFailed' && (
                                <DropdownMenuItem onClick={() => handleAction('Reintentar Pago', sub.id, sub.clinicName)}>
                                    <RefreshCw className="mr-2 h-4 w-4 text-blue-500" /> Reintentar Pago
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleAction('Enviar Última Factura', sub.id, sub.clinicName)}>
                                <FileText className="mr-2 h-4 w-4" /> Enviar Factura
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {(sub.status === 'Active' || sub.status === 'Trialing' || sub.status === 'PaymentFailed') && (
                                <DropdownMenuItem 
                                    className="text-destructive hover:!text-destructive focus:text-destructive focus:bg-destructive/10"
                                    onClick={() => handleAction('Cancelar Suscripción', sub.id, sub.clinicName)}
                                >
                                    <XCircle className="mr-2 h-4 w-4" /> Cancelar Suscripción
                                </DropdownMenuItem>
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
              <p>No se encontraron suscripciones con los criterios de búsqueda.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
