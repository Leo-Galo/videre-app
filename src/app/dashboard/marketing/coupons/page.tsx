
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as UiFormDescription } from '@/components/ui/form';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, Edit, Trash2, PlusCircle, Tag, CalendarIcon, DollarSign, Percent, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Coupon } from '@/types/marketing';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label'; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { couponFormSchema, type CouponFormValues } from '@/types/coupon-schema';
import { getCoupons, addCoupon, updateCoupon, deleteCoupon } from '@/services/coupon-service';


export default function MarketingCouponsPage() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const plan = localStorage.getItem('subscriptionPlan');
    const role = localStorage.getItem('mockUserRole');
    setUserRole(role);
    setIsPremiumUser(plan?.toLowerCase() === 'premium');

    async function loadData() {
        const fetchedCoupons = await getCoupons();
        setCoupons(fetchedCoupons);
        setIsLoadingPage(false);
    }
    loadData();
  }, []);
  
  const isAdmin = userRole === "Admin";

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: { code: '', type: 'percentage', value: 0, isActive: true, minPurchaseAmountCRC: 0 },
  });
  
  const handleOpenForm = (coupon?: Coupon) => {
    if (!isAdmin) {
      toast({ variant: "destructive", title: "Permiso Denegado", description: "Solo los Administradores pueden gestionar cupones." });
      return;
    }
    if (coupon) {
      setEditingCoupon(coupon);
      form.reset({
        ...coupon,
        startDate: coupon.startDate ? parseISO(coupon.startDate) : undefined,
        endDate: coupon.endDate ? parseISO(coupon.endDate) : undefined,
        minPurchaseAmountCRC: coupon.minPurchaseAmountCRC || 0,
      });
    } else {
      setEditingCoupon(null);
      form.reset({ code: '', type: 'percentage', value: 0, isActive: true, description: '', startDate: undefined, endDate: undefined, minPurchaseAmountCRC: 0 });
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (values: CouponFormValues) => {
    setIsSaving(true);
    let success = false;
    if (editingCoupon) {
      const updatedCoupon = await updateCoupon(editingCoupon.id, values);
      if (updatedCoupon) {
        success = true;
        toast({ title: "Cupón Actualizado", description: `Cupón "${values.code}" guardado.` });
      }
    } else {
      const newCoupon = await addCoupon(values);
      if (newCoupon) {
        success = true;
        toast({ title: "Cupón Creado", description: `Cupón "${values.code}" añadido.` });
      }
    }
    
    if (success) {
      const updatedCoupons = await getCoupons();
      setCoupons(updatedCoupons);
      setIsFormOpen(false);
    } else {
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el cupón." });
    }

    setIsSaving(false);
  };

  const handleDeleteConfirm = async () => {
    if (couponToDelete) {
      const success = await deleteCoupon(couponToDelete.id);
      if(success) {
        setCoupons(prev => prev.filter(c => c.id !== couponToDelete.id));
        toast({ title: "Cupón Eliminado", description: `Cupón "${couponToDelete.code}" eliminado.` });
      } else {
        toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el cupón." });
      }
      setCouponToDelete(null);
    }
  };

  const filteredCoupons = useMemo(() => {
    return coupons.filter(c =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [coupons, searchTerm]);

  const formatDateRange = (start?: string, end?: string) => {
    if (!start && !end) return "Siempre activo";
    const s = start && isValid(parseISO(start)) ? format(parseISO(start), "dd/MM/yy", {locale:es}) : "Desde inicio";
    const e = end && isValid(parseISO(end)) ? format(parseISO(end), "dd/MM/yy", {locale:es}) : "Sin vencimiento";
    return `${s} - ${e}`;
  };
  
  if (isLoadingPage) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3 mb-2" /> <Skeleton className="h-4 w-2/3 mb-6" />
        <Card className="shadow-md rounded-xl">
          <CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader>
          <CardContent><Skeleton className="h-80 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  if (!isPremiumUser) {
    return (
      <Card className="shadow-lg rounded-xl border-dashed border-primary/50 bg-primary/5">
        <CardHeader className="text-center">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-3" />
          <CardTitle className="text-2xl">Gestión Avanzada de Cupones y Descuentos</CardTitle>
          <CardDescription className="text-lg">
            Esta es una funcionalidad Premium.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            Crea y administra códigos de descuento, establece fechas de validez, montos mínimos de compra y más para potenciar tus campañas de marketing.
          </p>
          <Button asChild size="lg">
            <Link href="/dashboard/subscription">Actualizar a Premium</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            <Tag className="h-7 w-7" /> Gestión de Cupones y Descuentos
          </h1>
          <p className="text-muted-foreground">
            Crea, edita y administra los cupones de descuento para tus campañas de marketing.
          </p>
        </div>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button onClick={() => handleOpenForm()} disabled={!isAdmin}>
                    <PlusCircle className="mr-2 h-5 w-5" /> Crear Nuevo Cupón
                </Button>
            </TooltipTrigger>
            {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
        </Tooltip>
      </div>

      <Card className="shadow-md rounded-xl">
        <CardHeader>
          <CardTitle>Listado de Cupones</CardTitle>
          <div className="mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar por código o descripción..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-full md:w-1/2 lg:w-1/3" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCoupons.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="hidden md:table-cell">Vigencia</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-medium">{coupon.code}</TableCell>
                      <TableCell className="max-w-xs truncate" title={coupon.description}>{coupon.description || '-'}</TableCell>
                      <TableCell className="text-center capitalize">{coupon.type === 'percentage' ? 'Porcentaje' : 'Monto Fijo'}</TableCell>
                      <TableCell className="text-right">
                        {coupon.type === 'percentage' ? `${coupon.value}%` : `¢${coupon.value.toLocaleString('es-CR')}`}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{formatDateRange(coupon.startDate, coupon.endDate)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={coupon.isActive ? 'default' : 'outline'}>{coupon.isActive ? 'Activo' : 'Inactivo'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuItem onClick={() => handleOpenForm(coupon)} disabled={!isAdmin} className={cn(!isAdmin && "text-muted-foreground cursor-not-allowed")}>
                                        <Edit className="mr-2 h-4 w-4" /> Editar
                                    </DropdownMenuItem>
                                </TooltipTrigger>
                                {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
                            </Tooltip>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuItem 
                                        className={cn("text-destructive hover:!text-destructive", !isAdmin && "text-muted-foreground hover:!text-muted-foreground cursor-not-allowed")} 
                                        onClick={() => isAdmin && setCouponToDelete(coupon)}
                                        disabled={!isAdmin}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar
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
            <div className="text-center py-10 text-muted-foreground"><p>No se encontraron cupones. Puedes añadir uno nuevo.</p></div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!isSaving) setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-lg md:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? "Editar Cupón" : "Crear Nuevo Cupón"}</DialogTitle>
            <DialogDescription>Completa los detalles del cupón de descuento.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem><FormLabel>Código del Cupón *</FormLabel><FormControl><Input placeholder="EJ: VERANO15" {...field} disabled={isSaving} /></FormControl><UiFormDescription className="text-xs">Solo mayúsculas y números, sin espacios.</UiFormDescription><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Descripción (Opcional)</FormLabel><FormControl><Input placeholder="Ej: Descuento especial de verano" {...field} disabled={isSaving} /></FormControl><FormMessage /></FormItem>
              )}/>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem><FormLabel>Tipo de Descuento *</FormLabel>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex pt-2 gap-4" disabled={isSaving}>
                      <FormItem className="flex items-center space-x-2"><RadioGroupItem value="percentage" id="percentage" /><Label htmlFor="percentage" className="font-normal">Porcentaje</Label></FormItem>
                      <FormItem className="flex items-center space-x-2"><RadioGroupItem value="fixed" id="fixed" /><Label htmlFor="fixed" className="font-normal">Monto Fijo (¢)</Label></FormItem>
                    </RadioGroup>
                  <FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="value" render={({ field }) => (
                  <FormItem><FormLabel>Valor del Descuento *</FormLabel><FormControl><Input type="number" placeholder={form.getValues("type") === "percentage" ? "Ej: 15 (para 15%)" : "Ej: 5000 (para ¢5000)"} {...field} disabled={isSaving} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Fecha de Inicio (Opcional)</FormLabel>
                    <Popover><PopoverTrigger asChild>
                        <FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={isSaving}>
                            {field.value ? format(field.value, "PPP", {locale:es}) : <span>Seleccione fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button></FormControl>
                    </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} /></PopoverContent></Popover>
                  <FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="endDate" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Fecha de Fin (Opcional)</FormLabel>
                  <Popover><PopoverTrigger asChild>
                      <FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={isSaving}>
                          {field.value ? format(field.value, "PPP", {locale:es}) : <span>Seleccione fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button></FormControl>
                  </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => form.getValues("startDate") ? date < form.getValues("startDate")! : false} initialFocus locale={es} /></PopoverContent></Popover>
                  <FormMessage /></FormItem>
                )}/>
              </div>
              <FormField control={form.control} name="minPurchaseAmountCRC" render={({ field }) => (
                <FormItem><FormLabel>Monto Mínimo de Compra (¢, Opcional)</FormLabel><FormControl><Input type="number" placeholder="Ej: 25000" {...field} disabled={isSaving} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5">
                    <FormLabel>Activar Cupón</FormLabel>
                    <UiFormDescription className="text-xs">Permite que este cupón sea utilizable.</UiFormDescription>
                </div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSaving} /></FormControl></FormItem>
              )}/>
              <DialogFooter className="pt-4">
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCoupon ? "Guardar Cambios" : "Crear Cupón"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={couponToDelete !== null} onOpenChange={(open) => !open && setCouponToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
            <AlertDialogDescription>¿Estás seguro de que quieres eliminar el cupón "{couponToDelete?.code}"? Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCouponToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className={cn(buttonVariants({ variant: "destructive" }))}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
}
