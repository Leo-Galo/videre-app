
"use client";

import type { NextPage } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import type { ClinicTenant } from '@/types/superadmin';
import type { ClinicUser, UserRole, UserStatus } from '@/types/user'; // For mock users
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit, Shield, Users, CalendarDays, BarChart3, Store, DollarSign, AlertTriangle, MoreHorizontal, UserCog, ToggleLeft, ToggleRight, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO, subDays } from 'date-fns'; // Added subDays import
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label'; // Added Label for dialog
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Added Select for dialog
import { getClinicById } from '@/services/superadmin/clinic-service';

// Mock users for a specific clinic
const generateMockClinicUsers = (clinicName: string, userCount: number): ClinicUser[] => {
  const roles: UserRole[] = ["Admin", "Optometrist", "Salesperson"];
  const statuses: UserStatus[] = ["Active", "Inactive"];
  return Array.from({ length: userCount }, (_, i) => ({
    id: `user-${clinicName.replace(/\s+/g, '').toLowerCase()}-${i + 1}`,
    name: `Usuario ${i + 1} de ${clinicName.substring(0,10)}`,
    email: `user${i+1}@${clinicName.replace(/\s+/g, '').toLowerCase()}.com`,
    role: roles[i % roles.length],
    status: statuses[i % statuses.length],
    createdAt: subDays(new Date(), Math.floor(Math.random() * 365)).toISOString(),
  }));
};

const ClinicDetailPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const clinicId = params.clinicId as string;
  
  const [clinic, setClinic] = useState<ClinicTenant | null>(null);
  const [clinicUsers, setClinicUsers] = useState<ClinicUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userToManage, setUserToManage] = useState<ClinicUser | null>(null);
  const [userActionType, setUserActionType] = useState<'toggleStatus' | 'changeRole' | 'resetPassword' | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole | null>(null);


  useEffect(() => {
    if (clinicId) {
      setIsLoading(true);
      getClinicById(clinicId).then(foundClinic => {
        setClinic(foundClinic || null);
        if (foundClinic) {
          setClinicUsers(generateMockClinicUsers(foundClinic.name, foundClinic.users));
        }
        setIsLoading(false);
      });
    }
  }, [clinicId]);
  
  const formatDateSafe = (dateString?: string, dateFormat: string = 'PPP') => {
    if (!dateString) return 'N/A';
    try { return format(parseISO(dateString), dateFormat, { locale: es }); }
    catch (e) { return 'Fecha Inválida'; }
  };
  
  const getStatusBadgeVariant = (status: ClinicTenant['status'] | UserStatus) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Trialing': return 'secondary';
      case 'Suspended': return 'outline';
      case 'Expired':
      case 'Inactive': return 'destructive';
      default: return 'default';
    }
  };

  const handleUserActionConfirm = () => {
    if (!userToManage || !userActionType) return;
    let message = "";
    if (userActionType === 'toggleStatus') {
        const newStatus = userToManage.status === "Active" ? "Inactive" : "Active";
        setClinicUsers(prev => prev.map(u => u.id === userToManage.id ? {...u, status: newStatus} : u));
        message = `Estado del usuario ${userToManage.name} cambiado a ${newStatus}.`;
    } else if (userActionType === 'changeRole' && selectedNewRole) {
        setClinicUsers(prev => prev.map(u => u.id === userToManage.id ? {...u, role: selectedNewRole} : u));
        message = `Rol del usuario ${userToManage.name} cambiado a ${selectedNewRole}.`;
    } else if (userActionType === 'resetPassword') {
        message = `Se ha enviado un enlace para restablecer contraseña a ${userToManage.email}.`;
    }
    toast({ title: "Acción de Usuario Realizada", description: message });
    setUserToManage(null);
    setUserActionType(null);
    setSelectedNewRole(null);
  };

  const openUserActionDialog = (user: ClinicUser, type: 'toggleStatus' | 'changeRole' | 'resetPassword') => {
    setUserToManage(user);
    setUserActionType(type);
    if (type === 'changeRole') setSelectedNewRole(user.role); // Pre-fill current role
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-56 mb-6" />
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2"><Skeleton className="h-8 w-3/4 md:w-96" /><Skeleton className="h-5 w-1/2 md:w-64" /></div>
            <Skeleton className="h-10 w-32" />
          </CardHeader>
          <CardContent className="p-6 grid md:grid-cols-2 gap-6">
            <div className="space-y-4">{[...Array(5)].map((_, i) => ( <div key={i} className="space-y-1"><Skeleton className="h-5 w-1/3" /><Skeleton className="h-5 w-2/3" /></div>))}</div>
            <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          </CardContent>
          <CardContent className="p-6 border-t"><Skeleton className="h-40 w-full" /></CardContent>
          <CardFooter className="border-t p-6"><Skeleton className="h-4 w-1/3" /></CardFooter>
        </Card>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-10">
        <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Clínica no encontrada</h2>
        <p className="text-muted-foreground mb-6">No pudimos encontrar la clínica que estás buscando.</p>
        <Link href="/superadmin/clinics" passHref><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Volver al Listado</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link href="/superadmin/clinics" passHref><Button variant="outline" className="flex items-center gap-2 self-start sm:self-center"><ArrowLeft className="h-4 w-4" />Volver al Listado</Button></Link>
        <Link href={`/superadmin/clinics/${clinic.id}/edit`} passHref><Button variant="default" className="flex items-center gap-2 self-end sm:self-center"><Edit className="h-4 w-4" /> Editar Clínica</Button></Link>
      </div>

      <Card className="shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="bg-muted/30 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div><CardTitle className="text-3xl font-headline text-primary flex items-center gap-3"><Store className="h-8 w-8" />{clinic.name}</CardTitle><CardDescription className="text-md">Admin: {clinic.adminEmail}</CardDescription></div>
            <Badge variant={getStatusBadgeVariant(clinic.status)} className="text-sm px-3 py-1 self-start sm:self-center">{clinic.status}</Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <section><h3 className="text-xl font-semibold text-primary mb-3">Información General</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm"><div><strong className="block text-muted-foreground">ID Clínica:</strong> {clinic.id}</div><div><strong className="block text-muted-foreground">Plan Actual:</strong> {clinic.plan}</div><div><strong className="block text-muted-foreground">Creada el:</strong> {formatDateSafe(clinic.createdAt)}</div><div><strong className="block text-muted-foreground">Usuarios Activos:</strong> {clinic.users}</div><div><strong className="block text-muted-foreground">Sucursales:</strong> {clinic.branches}</div>{clinic.status === 'Trialing' && clinic.trialEndDate && <div><strong className="block text-muted-foreground">Fin de Prueba:</strong> {formatDateSafe(clinic.trialEndDate)}</div>}{clinic.status === 'Active' && clinic.nextBillingDate && <div><strong className="block text-muted-foreground">Próx. Facturación:</strong> {formatDateSafe(clinic.nextBillingDate)}</div>}</div></section>
          <Separator />
          <section><h3 className="text-xl font-semibold text-primary mb-3">Métricas Clave</h3><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"><Card className="bg-background/50"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pacientes Totales</CardTitle><Users className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{(clinic.users || 1) * 50 + Math.floor(Math.random()*20) }</div></CardContent></Card><Card className="bg-background/50"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ingresos Mes Actual</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">${((clinic.users || 1) * 1200 + Math.floor(Math.random()*500)).toLocaleString()}</div></CardContent></Card><Card className="bg-background/50"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Citas Este Mes</CardTitle><CalendarDays className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{(clinic.users || 1) * 25 + Math.floor(Math.random()*10)}</div></CardContent></Card></div></section>
          
          <Separator />
          <section><h3 className="text-xl font-semibold text-primary mb-3 flex items-center gap-2"><Users className="h-5 w-5"/>Usuarios de esta Clínica ({clinicUsers.length})</h3>
            {clinicUsers.length > 0 ? (
                <div className="overflow-x-auto border rounded-md">
                    <Table>
                        <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead className="hidden sm:table-cell">Email</TableHead><TableHead>Rol</TableHead><TableHead className="text-center">Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {clinicUsers.map(user => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell className="text-center"><Badge variant={getStatusBadgeVariant(user.status)}>{user.status}</Badge></TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Gestionar Usuario</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => openUserActionDialog(user, 'toggleStatus')}>
                                                {user.status === "Active" ? <ToggleLeft className="mr-2 h-4 w-4 text-destructive"/> : <ToggleRight className="mr-2 h-4 w-4 text-green-500"/>}
                                                {user.status === "Active" ? "Desactivar" : "Activar"}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openUserActionDialog(user, 'changeRole')}><UserCog className="mr-2 h-4 w-4"/>Cambiar Rol</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openUserActionDialog(user, 'resetPassword')}><KeyRound className="mr-2 h-4 w-4"/>Restablecer Contraseña</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
            ) : <p className="text-sm text-muted-foreground">Esta clínica aún no tiene usuarios registrados aparte del administrador inicial.</p>}
          </section>
           
          <Separator />
          <section><h3 className="text-xl font-semibold text-primary mb-3">Acciones Rápidas</h3><div className="flex flex-wrap gap-3"><Button variant="outline" onClick={()=> alert("Funcionalidad 'Ver Facturas' no implementada.")}>Ver Historial de Facturas</Button><Button variant="outline" onClick={()=> alert("Funcionalidad 'Enviar Mensaje Admin' no implementada.")}>Enviar Mensaje al Admin</Button>{(clinic.status === 'Suspended' || clinic.status === 'Expired') && <Button variant="secondary" onClick={()=> alert("Funcionalidad 'Reactivar Manualmente' no implementada.")}>Reactivar Cuenta Manualmente</Button>}</div></section>
        </CardContent>
        <CardFooter className="p-6 border-t bg-muted/20"><p className="text-xs text-muted-foreground">Última actualización de datos: {format(new Date(), 'dd MMM, yyyy HH:mm', { locale: es })}.</p></CardFooter>
      </Card>

        <AlertDialog open={userToManage !== null && userActionType !== null} onOpenChange={(open) => { if (!open) {setUserToManage(null); setUserActionType(null); setSelectedNewRole(null);}}}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {userActionType === 'toggleStatus' && `Confirmar ${userToManage?.status === 'Active' ? 'Desactivación' : 'Activación'} de Usuario`}
                        {userActionType === 'changeRole' && `Cambiar Rol para ${userToManage?.name}`}
                        {userActionType === 'resetPassword' && `Restablecer Contraseña para ${userToManage?.name}`}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {userActionType === 'toggleStatus' && `El usuario "${userToManage?.name}" será ${userToManage?.status === 'Active' ? 'desactivado.' : 'activado.'}`}
                        {userActionType === 'changeRole' && `Seleccione el nuevo rol para ${userToManage?.name}.`}
                        {userActionType === 'resetPassword' && `Se enviará un enlace para restablecer la contraseña al correo ${userToManage?.email}.`}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {userActionType === 'changeRole' && userToManage && (
                    <div className="py-2">
                        <Label htmlFor="newRoleSelect">Nuevo Rol</Label>
                        <Select value={selectedNewRole || userToManage.role} onValueChange={(value) => setSelectedNewRole(value as UserRole)}>
                            <SelectTrigger id="newRoleSelect"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {(["Admin", "Optometrist", "Salesperson"] as UserRole[]).map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => {setUserToManage(null); setUserActionType(null); setSelectedNewRole(null);}}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleUserActionConfirm} disabled={userActionType === 'changeRole' && !selectedNewRole}>Confirmar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </div>
  );
};

export default ClinicDetailPage;
