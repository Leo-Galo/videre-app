
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, Edit, Trash2, PlusCircle, TrendingDown, Loader2, Sparkles, CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Expense, ExpenseCategory } from '@/types/finance';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KpiCard } from '@/components/dashboard/kpi-card';
import { getExpenses, getExpenseCategories, addExpense, updateExpense, deleteExpense } from '@/services/expense-service';
import type { ExpenseFormValues } from '@/types/expense-schema';
import { expenseFormSchema } from '@/types/expense-schema';
import { getSuppliers } from '@/services/supplier-service';
import type { Supplier } from '@/types/supplier';

export default function ExpensesPage() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  useEffect(() => {
    const plan = localStorage.getItem('subscriptionPlan');
    setIsPremiumUser(plan?.toLowerCase() === 'premium');

    async function loadData() {
        const [fetchedExpenses, fetchedCategories, fetchedSuppliers] = await Promise.all([
          getExpenses(), 
          getExpenseCategories(),
          getSuppliers()
        ]);
        setExpenses(fetchedExpenses);
        setCategories(fetchedCategories);
        setSuppliers(fetchedSuppliers);
        setIsLoadingPage(false);
    }
    loadData();
  }, []);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: { description: '', amount: 0, category: 'Otro', date: new Date(), notes: '', supplierName: '', documentNumber: '' },
  });

  const handleOpenForm = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      form.reset({
        ...expense,
        date: parseISO(expense.date),
        supplierName: expense.supplierName || '',
        documentNumber: expense.documentNumber || '',
      });
    } else {
      setEditingExpense(null);
      form.reset({ description: '', amount: 0, category: 'Otro', date: new Date(), notes: '', supplierName: '', documentNumber: '' });
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (values: ExpenseFormValues) => {
    setIsSaving(true);

    let updatedExpense;
    if (editingExpense) {
      updatedExpense = await updateExpense(editingExpense.id, values);
      toast({ title: "Gasto Actualizado", description: `Gasto "${values.description}" guardado.` });
    } else {
      updatedExpense = await addExpense(values);
      toast({ title: "Gasto Registrado", description: `Gasto "${values.description}" añadido.` });
    }
    
    if (updatedExpense) {
        const updatedExpenses = await getExpenses();
        setExpenses(updatedExpenses);
    }

    setIsFormOpen(false);
    setIsSaving(false);
  };

  const handleDeleteConfirm = async () => {
    if (expenseToDelete) {
      const success = await deleteExpense(expenseToDelete.id);
      if (success) {
        setExpenses(prev => prev.filter(e => e.id !== expenseToDelete.id));
        toast({ title: "Gasto Eliminado", description: `Gasto "${expenseToDelete.description}" eliminado.` });
      } else {
        toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el gasto." });
      }
      setExpenseToDelete(null);
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e =>
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [expenses, searchTerm]);
  
  const formatCurrency = (amount: number) => `¢${new Intl.NumberFormat('es-CR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;

  if (isLoadingPage) {
    return <div className="space-y-6"><Skeleton className="h-24 w-full" /><Skeleton className="h-80 w-full" /></div>;
  }

  if (!isPremiumUser) {
    return (
      <Card className="shadow-lg rounded-xl border-dashed border-primary/50 bg-primary/5">
        <CardHeader className="text-center">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-3" />
          <CardTitle className="text-2xl">Control de Gastos y Rentabilidad</CardTitle>
          <CardDescription className="text-lg">Esta es una funcionalidad Premium.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            Registra tus gastos operativos, analiza la rentabilidad real de tu óptica y toma decisiones financieras más inteligentes.
          </p>
          <Button asChild size="lg"><Link href="/dashboard/subscription">Actualizar a Premium</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            <TrendingDown className="h-7 w-7" /> Control de Gastos
          </h1>
          <p className="text-muted-foreground">Registra y administra los gastos operativos de tu óptica.</p>
        </div>
        <Button onClick={() => handleOpenForm()}><PlusCircle className="mr-2 h-5 w-5" /> Registrar Gasto</Button>
      </div>

      <Card className="shadow-md rounded-xl">
        <CardHeader>
          <CardTitle>Listado de Gastos Registrados</CardTitle>
          <div className="mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar por descripción, categoría o proveedor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-full md:w-1/2 lg:w-1/3" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Monto (CRC)</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(parseISO(expense.date), 'dd MMM, yyyy', {locale:es})}</TableCell>
                    <TableCell className="font-medium">
                      {expense.description}
                      {expense.documentNumber && (
                        <p className="text-xs text-muted-foreground">Doc: {expense.documentNumber}</p>
                      )}
                    </TableCell>
                    <TableCell><Badge variant="outline">{expense.category}</Badge></TableCell>
                    <TableCell>{expense.supplierName || 'N/A'}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(expense.amount)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleOpenForm(expense)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive hover:!text-destructive" onClick={() => setExpenseToDelete(expense)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
         <CardFooter className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">Mostrando {filteredExpenses.length} de {expenses.length} gastos.</p>
        </CardFooter>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!isSaving) setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Editar Gasto" : "Registrar Nuevo Gasto"}</DialogTitle>
            <DialogDescription>Completa los detalles del gasto.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
               <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción *</FormLabel><FormControl><Input placeholder="Ej: Pago de electricidad" {...field} disabled={isSaving} /></FormControl><FormMessage /></FormItem>)}/>
               <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Monto (CRC) *</FormLabel><FormControl><Input type="number" step="any" placeholder="Ej: 50000" {...field} disabled={isSaving} /></FormControl><FormMessage /></FormItem>)}/>
               <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Categoría *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger></FormControl><SelectContent>{categories.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="supplierName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proveedor (Opcional)</FormLabel>
                        <FormControl>
                          <>
                            <Input
                              placeholder="Escribe o selecciona"
                              {...field}
                              disabled={isSaving}
                              list="suppliers-datalist-expenses"
                            />
                            <datalist id="suppliers-datalist-expenses">
                              {suppliers.map(sup => (
                                <option key={sup.id} value={sup.name} />
                              ))}
                            </datalist>
                          </>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="documentNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nº Documento/Factura</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: F-1234, REC-567" {...field} disabled={isSaving} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               </div>
               <FormField control={form.control} name="date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Fecha del Gasto *</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={isSaving}>{field.value ? format(field.value, "PPP", {locale:es}) : <span>Seleccione fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus locale={es} /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
               <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notas (Opcional)</FormLabel><FormControl><Input placeholder="Ej: Corresponde a Julio 2024" {...field} disabled={isSaving} /></FormControl><FormMessage /></FormItem>)}/>
              <DialogFooter className="pt-4"><DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button></DialogClose><Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingExpense ? "Guardar Cambios" : "Registrar Gasto"}</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={expenseToDelete !== null} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle><AlertDialogDescription>¿Estás seguro de que quieres eliminar el gasto "{expenseToDelete?.description}"? Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel onClick={() => setExpenseToDelete(null)}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirm} className={cn(buttonVariants({ variant: "destructive" }))}>Eliminar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
