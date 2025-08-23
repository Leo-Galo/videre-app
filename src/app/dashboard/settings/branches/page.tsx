
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MoreHorizontal, Search, Edit, Trash2, PlusCircle, Building, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import Link from 'next/link'; 
import { branchFormSchema, type BranchFormValues } from '@/types/branch-schema';
import { getBranches as fetchBranches, addBranch, updateBranch, deleteBranch } from '@/services/inventory-service';

interface Branch {
  id: string;
  name: string;
  address?: string; 
  phone?: string; 
}

export default function ManageBranchesPage() {
  const { toast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: { name: '', address: '', phone: '' },
  });

  useEffect(() => {
    const role = localStorage.getItem('mockUserRole');
    const plan = localStorage.getItem('subscriptionPlan');
    setUserRole(role);
    setCurrentPlan(plan);

    async function loadData() {
        const data = await fetchBranches();
        setBranches(data);
        setIsLoadingPage(false);
    }
    loadData();
  }, []);

  const isAdmin = userRole === "Admin";
  const canManageBranches = isAdmin && (currentPlan?.toLowerCase() === 'pro' || currentPlan?.toLowerCase() === 'premium');
  const maxBranches = currentPlan?.toLowerCase() === 'pro' ? 2 : currentPlan?.toLowerCase() === 'premium' ? 5 : 1;

  const handleOpenForm = (branch?: Branch) => {
    if (!canManageBranches) {
        toast({ variant: "destructive", title: "Acceso Denegado", description: "Tu plan actual no permite gestionar múltiples sucursales." });
        return;
    }
    if (branch) {
      setEditingBranch(branch);
      form.reset(branch);
    } else {
      if (branches.length >= maxBranches) {
        toast({ variant: "warning", title: "Límite Alcanzado", description: `Tu plan (${currentPlan}) permite hasta ${maxBranches} sucursal(es). Considera actualizar tu plan.` });
        return;
      }
      setEditingBranch(null);
      form.reset({ name: '', address: '', phone: '' });
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (values: BranchFormValues) => {
    setIsSaving(true);
    let success = false;
    if (editingBranch) {
        const updated = await updateBranch(editingBranch.id, values);
        if (updated) {
            toast({ title: "Sucursal Actualizada", description: `Sucursal "${values.name}" guardada.` });
            success = true;
        }
    } else {
      if (branches.length >= maxBranches) {
        toast({ variant: "warning", title: "Límite Alcanzado", description: `No puedes añadir más sucursales con tu plan actual (${currentPlan}).` });
        setIsSaving(false);
        return;
      }
      const newBranch = await addBranch(values);
       if (newBranch) {
            toast({ title: "Sucursal Añadida", description: `Sucursal "${values.name}" creada.` });
            success = true;
       }
    }

    if(success) {
        const updatedBranches = await fetchBranches();
        setBranches(updatedBranches);
    } else {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron guardar los cambios.'});
    }

    setIsFormOpen(false);
    setEditingBranch(null);
    setIsSaving(false);
  };

  const handleDeleteConfirm = async () => {
    if (branchToDelete) {
      const success = await deleteBranch(branchToDelete.id);
      if (success) {
        const updatedBranches = await fetchBranches();
        setBranches(updatedBranches);
        toast({ title: "Sucursal Eliminada", description: `Sucursal "${branchToDelete.name}" eliminada.` });
      } else {
         toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la sucursal.'});
      }
      setBranchToDelete(null);
    }
  };

  const filteredBranches = useMemo(() => {
    return branches.filter(b =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.address || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [branches, searchTerm]);
  
  if (isLoadingPage) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3 mb-2" /> <Skeleton className="h-4 w-2/3 mb-6" />
        <Card className="shadow-md rounded-xl"><CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader><CardContent><Skeleton className="h-80 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (currentPlan && currentPlan?.toLowerCase() === 'basic' && !isLoadingPage) {
    return (
        <Card className="shadow-lg rounded-xl border-dashed border-primary/50 bg-primary/5">
            <CardHeader className="text-center">
                <Building className="h-12 w-12 text-primary mx-auto mb-3" />
                <CardTitle className="text-2xl">Gestión de Múltiples Sucursales</CardTitle>
                <CardDescription className="text-lg">
                    Esta funcionalidad está disponible en los planes Pro y Premium.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                    Actualiza tu plan para añadir y administrar múltiples sucursales para tu óptica, optimizando tu inventario y operaciones.
                </p>
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                    <Link href="/dashboard/subscription">Ver Planes y Actualizar</Link>
                </Button>
            </CardContent>
        </Card>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            <Building className="h-7 w-7" /> Gestionar Sucursales de la Clínica
          </h1>
          <p className="text-muted-foreground">
            Administra las diferentes ubicaciones de tu óptica. Tu plan ({currentPlan}) permite hasta {maxBranches} sucursal(es).
          </p>
        </div>
        <Button onClick={() => handleOpenForm()} disabled={branches.length >= maxBranches || !isAdmin}>
          <PlusCircle className="mr-2 h-5 w-5" /> Añadir Nueva Sucursal
        </Button>
      </div>

      <Card className="shadow-md rounded-xl">
        <CardHeader>
          <CardTitle>Listado de Sucursales ({branches.length}/{maxBranches})</CardTitle>
          <div className="mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar por nombre o dirección..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-full md:w-1/2 lg:w-1/3" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBranches.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Sucursal</TableHead>
                    <TableHead className="hidden md:table-cell">Dirección (Simulada)</TableHead>
                    <TableHead className="hidden sm:table-cell">Teléfono (Simulado)</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBranches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell className="font-medium">{branch.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{branch.address || 'N/A'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{branch.phone || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleOpenForm(branch)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive hover:!text-destructive" 
                              onClick={() => setBranchToDelete(branch)}
                              disabled={branches.length <= 1} 
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
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
            <div className="text-center py-10 text-muted-foreground"><p>No se encontraron sucursales. Puedes añadir una nueva.</p></div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!isSaving) setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBranch ? "Editar Sucursal" : "Añadir Nueva Sucursal"}</DialogTitle>
            <DialogDescription>Completa los detalles de la sucursal.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nombre de la Sucursal*</FormLabel><FormControl><Input placeholder="Ej: Sucursal Centro" {...field} disabled={isSaving} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Dirección (Opcional)</FormLabel><FormControl><Input placeholder="Ej: Calle 5, Avenida Central" {...field} disabled={isSaving} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Teléfono (Opcional)</FormLabel><FormControl><Input type="tel" placeholder="Ej: 2200-0000" {...field} disabled={isSaving} /></FormControl><FormMessage /></FormItem>
              )}/>
              <DialogFooter className="pt-4">
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isSaving || !form.formState.isValid}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingBranch ? "Guardar Cambios" : "Crear Sucursal"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={branchToDelete !== null} onOpenChange={(open) => !open && setBranchToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
            <AlertDialogDescription>
                ¿Estás seguro de que quieres eliminar la sucursal "{branchToDelete?.name}"? 
                Asegúrate de que no haya inventario o datos críticos asociados antes de proceder (simulación). Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBranchToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className={cn(buttonVariants({ variant: "destructive" }))}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
