
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Search, Eye, Edit, ShieldCheck, ShieldOff, Trash2, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ClinicTenant, ClinicStatus } from '@/types/superadmin';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getClinics, updateClinicStatus, deleteClinic } from '@/services/superadmin/clinic-service';

const getStatusDisplayName = (status: ClinicTenant['status']): string => {
    switch (status) {
      case 'Active': return 'Activo';
      case 'Trialing': return 'En Prueba';
      case 'Suspended': return 'Suspendida';
      case 'Expired': return 'Expirada';
      case 'Cancelled': return 'Cancelada';
      default: return status;
    }
};

export default function SuperAdminClinicsPage() {
  const { toast } = useToast();
  const [clinics, setClinics] = useState<ClinicTenant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [clinicToManage, setClinicToManage] = useState<ClinicTenant | null>(null);
  const [actionType, setActionType] = useState<'suspend' | 'reactivate' | 'delete' | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const fetchedClinics = await getClinics();
      setClinics(fetchedClinics);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const filteredClinics = useMemo(() => {
    return clinics.filter(clinic =>
      clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.plan.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clinics, searchTerm]);

  const handleActionConfirm = async () => {
    if (!clinicToManage || !actionType) return;
    
    let success = false;
    let message = "";

    if (actionType === 'delete') {
      success = await deleteClinic(clinicToManage.id);
      message = `Clínica "${clinicToManage.name}" eliminada.`;
    } else {
      const newStatus = actionType === 'suspend' ? 'Suspended' : 'Active';
      const updatedClinic = await updateClinicStatus(clinicToManage.id, newStatus);
      success = !!updatedClinic;
      if (success) {
        message = `Clínica "${clinicToManage.name}" ${newStatus === 'Active' ? 'reactivada' : 'suspendida'}.`;
      }
    }

    if (success) {
      const updatedClinics = await getClinics();
      setClinics(updatedClinics);
      toast({ title: "Acción Realizada", description: message });
    } else {
      toast({ variant: "destructive", title: "Error", description: `No se pudo procesar la acción.` });
    }

    setClinicToManage(null);
    setActionType(null);
  };

  const openActionDialog = (clinic: ClinicTenant, type: 'suspend' | 'reactivate' | 'delete') => {
    setClinicToManage(clinic);
    setActionType(type);
  };

  const getStatusBadgeVariant = (status: ClinicTenant['status']) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Trialing': return 'secondary';
      case 'Suspended': return 'outline';
      case 'Expired':
      case 'Cancelled': return 'destructive';
      default: return 'default';
    }
  };
  
  const formatDateSafe = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'dd MMM, yyyy', { locale: es });
    } catch (e) { return 'Fecha Inválida'; }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-4 w-2/3 mb-6" />
        <Card className="shadow-md rounded-xl">
          <CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader>
          <CardContent>
             <div className="mb-4"><Skeleton className="h-10 w-full md:w-1/2 lg:w-1/3"/></div>
             <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary">Gestión de Clínicas Cliente</h1>
        <p className="text-muted-foreground">
          Administra todas las ópticas suscritas a Videre.
        </p>
      </div>

      <Card className="shadow-md rounded-xl">
        <CardHeader>
          <CardTitle>Listado de Clínicas</CardTitle>
          <div className="mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre, correo o plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full md:w-1/2 lg:w-1/3"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClinics.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Clínica</TableHead>
                    <TableHead className="hidden md:table-cell">Admin Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">Usuarios</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Sucursales</TableHead>
                    <TableHead className="hidden xl:table-cell">Creada</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClinics.map((clinic) => (
                    <TableRow key={clinic.id}>
                      <TableCell className="font-medium">{clinic.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{clinic.adminEmail}</TableCell>
                      <TableCell>{clinic.plan}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusBadgeVariant(clinic.status)}>{getStatusDisplayName(clinic.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-center hidden sm:table-cell">{clinic.users}</TableCell>
                      <TableCell className="text-center hidden lg:table-cell">{clinic.branches}</TableCell>
                      <TableCell className="hidden xl:table-cell">{formatDateSafe(clinic.createdAt)}</TableCell>
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
                            <DropdownMenuItem asChild>
                                <Link href={`/superadmin/clinics/${clinic.id}`} className="flex items-center gap-2 cursor-pointer"><Eye className="mr-2 h-4 w-4" /> Ver Detalles</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/superadmin/clinics/${clinic.id}/edit`} className="flex items-center gap-2 cursor-pointer"><Edit className="mr-2 h-4 w-4" /> Editar Clínica</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => alert(`Acceder como admin de ${clinic.name} (no implementado)`)}>
                              <ExternalLink className="mr-2 h-4 w-4" /> Acceder como Admin
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {clinic.status === 'Active' || clinic.status === 'Trialing' ? (
                              <DropdownMenuItem onClick={() => openActionDialog(clinic, 'suspend')}>
                                <ShieldOff className="mr-2 h-4 w-4 text-orange-500" /> Suspender Clínica
                              </DropdownMenuItem>
                            ) : clinic.status === 'Suspended' ? (
                              <DropdownMenuItem onClick={() => openActionDialog(clinic, 'reactivate')}>
                                <ShieldCheck className="mr-2 h-4 w-4 text-green-500" /> Reactivar Clínica
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem 
                                className="text-destructive hover:!text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={() => openActionDialog(clinic, 'delete')}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar Clínica
                            </DropdownMenuItem>
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
              <p>No se encontraron clínicas con los criterios de búsqueda.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={clinicToManage !== null && actionType !== null} onOpenChange={(open) => !open && (setClinicToManage(null), setActionType(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Acción</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres {actionType === 'suspend' ? 'suspender' : actionType === 'reactivate' ? 'reactivar' : 'eliminar'} la clínica "{clinicToManage?.name}"?
              {actionType === 'delete' && " Esta acción es irreversible."}
              {actionType === 'suspend' && " Esto podría afectar el acceso de sus usuarios."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => (setClinicToManage(null), setActionType(null))}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleActionConfirm}
              className={cn(buttonVariants({variant: (actionType === 'delete' || actionType === 'suspend') ? 'destructive' : 'default'}))}
            >
              Confirmar {actionType === 'suspend' ? 'Suspensión' : actionType === 'reactivate' ? 'Reactivación' : 'Eliminación'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
