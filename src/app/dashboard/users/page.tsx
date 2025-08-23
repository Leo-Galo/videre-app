
"use client";

import type { NextPage } from 'next';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle, Search, MoreHorizontal, Edit, ToggleLeft, ToggleRight, KeyRound, UserCog } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import type { ClinicUser, UserRole, UserStatus } from '@/types/user';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ChangePasswordDialog } from '@/components/dashboard/users/change-password-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getUsers, toggleUserStatus } from '@/services/user-service';

const UsersPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<ClinicUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userToToggleStatus, setUserToToggleStatus] = useState<ClinicUser | null>(null);
  const [userToChangePassword, setUserToChangePassword] = useState<ClinicUser | null>(null);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('mockUserRole');
    setCurrentUserRole(role);

    async function loadUsers() {
        setIsLoading(true);
        const fetchedUsers = await getUsers();
        setUsers(fetchedUsers);
        setIsLoading(false);
    }

    loadUsers();
  }, []);

  const isAdmin = currentUserRole === "Admin";

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      return (
        (user.name && user.name.toLowerCase().includes(lowerSearchTerm)) ||
        (user.email && user.email.toLowerCase().includes(lowerSearchTerm)) ||
        (user.role && user.role.toLowerCase().includes(lowerSearchTerm))
      );
    });
  }, [users, searchTerm]);

  const getStatusBadgeVariant = (status: UserStatus) => {
    return status === "Active" ? "default" : "destructive";
  };

  const handleToggleUserStatus = async () => {
    if (userToToggleStatus) {
      const originalStatus = userToToggleStatus.status;
      const newStatus = originalStatus === "Active" ? "Inactive" : "Active";
      
      // Optimistic UI update
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userToToggleStatus.id ? { ...u, status: newStatus } : u
        )
      );
      
      const success = await toggleUserStatus(userToToggleStatus.id, newStatus);
      
      if (success) {
          toast({
            title: "Estado de Usuario Actualizado",
            description: `El usuario "${userToToggleStatus.name}" ha sido ${newStatus === "Active" ? "activado" : "inactivado"}.`,
          });
      } else {
          // Revert UI if backend call fails
          setUsers(prevUsers =>
            prevUsers.map(u =>
              u.id === userToToggleStatus.id ? { ...u, status: originalStatus } : u
            )
          );
          toast({
              variant: "destructive",
              title: "Error",
              description: "No se pudo actualizar el estado del usuario.",
          });
      }
      
      setUserToToggleStatus(null);
    }
  };
  
  const openChangePasswordDialog = (user: ClinicUser) => {
    setUserToChangePassword(user);
    setIsChangePasswordDialogOpen(true);
  };

  const handlePasswordChanged = (userId: string) => {
    toast({
      title: "Contraseña Cambiada",
      description: `La contraseña para el usuario ${users.find(u=>u.id === userId)?.name} ha sido cambiada.`
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-64 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
            <Skeleton className="h-10 w-36" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full md:w-1/2 lg:w-1/3 mb-4" />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {[...Array(5)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-20" /></TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-6 w-20" /></TableCell>
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
              <UserCog className="h-6 w-6" /> Gestión de Usuarios de la Clínica
            </CardTitle>
            <CardDescription>Administra los accesos y roles de los usuarios de tu óptica.</CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/dashboard/users/new" passHref legacyBehavior>
                <a className={cn(!isAdmin && "pointer-events-none")}>
                  <Button className="flex items-center gap-2" disabled={!isAdmin}>
                    <PlusCircle className="h-5 w-5" /> Añadir Nuevo Usuario
                  </Button>
                </a>
              </Link>
            </TooltipTrigger>
            {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
          </Tooltip>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative w-full sm:w-auto sm:flex-grow md:flex-grow-0 md:w-1/2 lg:w-1/3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre, correo o rol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
          </div>
          {filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Correo Electrónico</TableHead>
                    <TableHead className="hidden md:table-cell">Rol</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="hidden md:table-cell">{user.role}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusBadgeVariant(user.status)}>
                          {user.status === "Active" ? "Activo" : "Inactivo"}
                        </Badge>
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
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href={`/dashboard/users/${user.id}/edit`} passHref legacyBehavior>
                                      <DropdownMenuItem asChild disabled={!isAdmin} onSelect={(e) => !isAdmin && e.preventDefault()}>
                                        <a className={cn("flex items-center gap-2 cursor-pointer", !isAdmin && "text-muted-foreground cursor-not-allowed")}>
                                          <Edit className="mr-2 h-4 w-4" /> Editar Usuario
                                        </a>
                                      </DropdownMenuItem>
                                    </Link>
                                </TooltipTrigger>
                                {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
                             </Tooltip>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuItem onClick={() => isAdmin && setUserToToggleStatus(user)} disabled={!isAdmin} className={cn(!isAdmin && "text-muted-foreground cursor-not-allowed")}>
                                      {user.status === "Active" ? <ToggleLeft className="mr-2 h-4 w-4 text-destructive" /> : <ToggleRight className="mr-2 h-4 w-4 text-green-600" />}
                                      {user.status === "Active" ? "Inactivar" : "Activar"} Usuario
                                    </DropdownMenuItem>
                                </TooltipTrigger>
                                {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
                             </Tooltip>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                     <DropdownMenuItem onClick={() => isAdmin && openChangePasswordDialog(user)} disabled={!isAdmin} className={cn(!isAdmin && "text-muted-foreground cursor-not-allowed")}>
                                      <KeyRound className="mr-2 h-4 w-4" /> Cambiar Contraseña
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
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <UserCog size={48} className="mx-auto mb-2" />
              <p>No se encontraron usuarios con los criterios de búsqueda.</p>
              {users.length === 0 && !searchTerm && <p>Aún no has añadido ningún usuario a tu clínica.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={userToToggleStatus !== null} onOpenChange={(open) => !open && setUserToToggleStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Estás seguro de {userToToggleStatus?.status === "Active" ? "inactivar" : "activar"} este usuario?
            </AlertDialogTitle>
            <AlertDialogDescription>
              El usuario "{userToToggleStatus?.name}" será {userToToggleStatus?.status === "Active" ? "inactivado y no podrá acceder al sistema" : "activado y podrá acceder al sistema"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToToggleStatus(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleUserStatus}
              className={cn(buttonVariants({ variant: userToToggleStatus?.status === "Active" ? "destructive" : "default" }))}
            >
              Confirmar {userToToggleStatus?.status === "Active" ? "Inactivación" : "Activación"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {userToChangePassword && (
        <ChangePasswordDialog
            isOpen={isChangePasswordDialogOpen}
            onOpenChange={setIsChangePasswordDialogOpen}
            user={userToChangePassword}
            onPasswordChanged={handlePasswordChanged}
        />
      )}

    </div>
    </TooltipProvider>
  );
};

export default UsersPage;
