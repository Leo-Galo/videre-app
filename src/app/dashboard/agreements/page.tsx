
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, Edit, Trash2, PlusCircle, Handshake, Loader2, Sparkles, Download, Upload, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Agreement } from '@/types/agreement';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { agreementFormSchema, type AgreementFormValues } from '@/types/agreement-schema';
import { getAgreements, addAgreement, updateAgreement, deleteAgreement } from '@/services/agreement-service';


export default function AgreementsPage() {
  const { toast } = useToast();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<Agreement | null>(null);
  const [agreementToDelete, setAgreementToDelete] = useState<Agreement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [fileToImport, setFileToImport] = useState<File | null>(null);

  useEffect(() => {
    const plan = localStorage.getItem('subscriptionPlan');
    const role = localStorage.getItem('mockUserRole');
    setIsPremiumUser(plan?.toLowerCase() === 'premium');
    setUserRole(role);
    async function loadData(){
        const data = await getAgreements();
        setAgreements(data);
        setIsLoadingPage(false);
    }
    loadData();
  }, []);
  
  const isAdmin = userRole === 'Admin';

  const form = useForm<AgreementFormValues>({
    resolver: zodResolver(agreementFormSchema),
    defaultValues: { companyName: '', discountType: 'percentage', discountValue: 0, status: 'Active' },
  });

  const handleOpenForm = (agreement?: Agreement) => {
    if (agreement) {
      setEditingAgreement(agreement);
      form.reset(agreement);
    } else {
      setEditingAgreement(null);
      form.reset({ companyName: '', discountType: 'percentage', discountValue: 0, status: 'Active', contactName: '', contactEmail: '', contactPhone: '', notes: '' });
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (values: AgreementFormValues) => {
    setIsSaving(true);
    let updatedAgreements;
    if (editingAgreement) {
      updatedAgreements = await updateAgreement(editingAgreement.id, values);
      toast({ title: "Convenio Actualizado", description: `Convenio con "${values.companyName}" guardado.` });
    } else {
      updatedAgreements = await addAgreement(values);
      toast({ title: "Convenio Creado", description: `Convenio con "${values.companyName}" añadido.` });
    }
    const data = await getAgreements();
    setAgreements(data);
    setIsFormOpen(false);
    setIsSaving(false);
  };

  const handleDeleteConfirm = async () => {
    if (agreementToDelete) {
      await deleteAgreement(agreementToDelete.id);
      const data = await getAgreements();
      setAgreements(data);
      toast({ title: "Convenio Eliminado", description: `Convenio "${agreementToDelete.companyName}" eliminado.` });
      setAgreementToDelete(null);
    }
  };
  
  const escapeCsvField = (field: string | number | undefined | null): string => {
    if (field === undefined || field === null) return '';
    const stringField = String(field).trim();
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n') || stringField.includes('\r')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  const handleDownloadTemplate = () => {
    const headers = "CompanyName,ContactName,ContactEmail,ContactPhone,DiscountType(percentage/fixed),DiscountValue,Status(Active/Inactive),Notes\n";
    const exampleRow = "Empresa Ejemplo S.A.,Ana Mora,ana@empresa.com,88887777,percentage,15,Active,Descuento en todos los productos para empleados\n";
    const csvContent = "\uFEFF" + headers + exampleRow;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "plantilla_importacion_convenios.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Plantilla de Importación de Convenios Descargada" });
  };
  
  const handleImportClick = () => { importInputRef.current?.click(); };
  
  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.type !== 'text/csv') {
            toast({ variant: "destructive", title: "Archivo Inválido", description: "Solo se permiten archivos CSV para importar convenios." });
            event.target.value = ""; return;
        }
        setFileToImport(file);
        setIsImportConfirmOpen(true);
        event.target.value = "";
    }
  };

  const processImportFile = async () => {
    if (!fileToImport) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvData = e.target?.result as string;
      const rows = csvData.split('\n').slice(1); // Skip header
      let successCount = 0;
      for (const row of rows) {
        if (!row.trim()) continue;
        const columns = row.split(',');
        if (columns.length >= 7) {
            const discountType = columns[4]?.trim().toLowerCase() as 'percentage' | 'fixed';
            const status = columns[6]?.trim() as 'Active' | 'Inactive';
            const agreementData: AgreementFormValues = {
                companyName: columns[0]?.trim() || `Convenio Importado ${Date.now()}`,
                contactName: columns[1]?.trim() || '',
                contactEmail: columns[2]?.trim() || '',
                contactPhone: columns[3]?.trim() || '',
                discountType: (discountType === 'percentage' || discountType === 'fixed') ? discountType : 'percentage',
                discountValue: parseFloat(columns[5]) || 0,
                status: (status === 'Active' || status === 'Inactive') ? status : 'Inactive',
                notes: columns[7]?.trim() || '',
            };
            const added = await addAgreement(agreementData);
            if(added) successCount++;
        }
      }
      const data = await getAgreements();
      setAgreements(data);
      toast({ title: "Importación Exitosa", description: `${successCount} convenios importados.` });
    };
    reader.readAsText(fileToImport);
    setFileToImport(null);
  };

  const filteredAgreements = useMemo(() => {
    return agreements.filter(a =>
      a.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.contactName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [agreements, searchTerm]);
  
  const formatCurrencyCRC = (amount: number) => `¢${new Intl.NumberFormat('es-CR', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)}`;
  const getStatusBadgeVariant = (status: Agreement['status']) => status === 'Active' ? 'default' : 'outline';

  if (isLoadingPage) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3 mb-2" /> <Skeleton className="h-4 w-2/3 mb-6" />
        <Card className="shadow-md rounded-xl"><CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader><CardContent><Skeleton className="h-80 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!isPremiumUser) {
    return (
      <Card className="shadow-lg rounded-xl border-dashed border-primary/50 bg-primary/5">
        <CardHeader className="text-center">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-3" />
          <CardTitle className="text-2xl">Gestión de Convenios Empresariales</CardTitle>
          <CardDescription className="text-lg">Esta es una funcionalidad Premium.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            Crea y administra alianzas y convenios con empresas y asociaciones para ofrecer beneficios exclusivos.
            Actualiza a Premium para potenciar tus ventas y relaciones corporativas.
          </p>
          <Button asChild size="lg"><Link href="/dashboard/subscription">Actualizar a Premium</Link></Button>
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
            <Handshake className="h-7 w-7" /> Gestión de Convenios
          </h1>
          <p className="text-muted-foreground">Crea y administra alianzas con empresas y asociaciones.</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleDownloadTemplate} disabled={!isAdmin}><Download className="mr-2 h-4 w-4" /> Plantilla</Button>
                </TooltipTrigger>
                {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
            </Tooltip>
            <input type="file" accept=".csv" ref={importInputRef} onChange={handleFileSelected} className="hidden" />
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleImportClick} disabled={!isAdmin}><Upload className="mr-2 h-4 w-4" /> Importar</Button>
                </TooltipTrigger>
                {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
            </Tooltip>
            <Button onClick={() => handleOpenForm()}><PlusCircle className="mr-2 h-5 w-5" /> Crear Convenio</Button>
        </div>
      </div>

      <Card className="shadow-md rounded-xl">
        <CardHeader>
          <CardTitle>Listado de Convenios</CardTitle>
          <div className="mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar por nombre de empresa o contacto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-full md:w-1/2 lg:w-1/3" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa / Asociación</TableHead>
                  <TableHead className="hidden md:table-cell">Contacto</TableHead>
                  <TableHead className="text-center">Beneficio</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgreements.map((agreement) => (
                  <TableRow key={agreement.id}>
                    <TableCell className="font-medium">{agreement.companyName}</TableCell>
                    <TableCell className="hidden md:table-cell">{agreement.contactName || 'N/A'}<br/><span className="text-xs text-muted-foreground">{agreement.contactEmail}</span></TableCell>
                    <TableCell className="text-center">{agreement.discountType === 'percentage' ? `${agreement.discountValue}%` : formatCurrencyCRC(agreement.discountValue)}</TableCell>
                    <TableCell className="text-center"><Badge variant={getStatusBadgeVariant(agreement.status)}>{agreement.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleOpenForm(agreement)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive hover:!text-destructive" onClick={() => setAgreementToDelete(agreement)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
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

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!isSaving) setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAgreement ? "Editar Convenio" : "Crear Nuevo Convenio"}</DialogTitle>
            <DialogDescription>Completa los detalles del convenio.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
              <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Nombre Empresa/Asociación *</FormLabel><FormControl><Input placeholder="Nombre de la entidad" {...field} disabled={isSaving} /></FormControl><FormMessage /></FormItem>)}/>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="contactName" render={({ field }) => (<FormItem><FormLabel>Nombre Contacto</FormLabel><FormControl><Input placeholder="Ej: Ana Mora" {...field} disabled={isSaving} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="contactPhone" render={({ field }) => (<FormItem><FormLabel>Teléfono Contacto</FormLabel><FormControl><Input placeholder="Ej: 8888-8888" {...field} disabled={isSaving} /></FormControl><FormMessage /></FormItem>)}/>
              </div>
              <FormField control={form.control} name="contactEmail" render={({ field }) => (<FormItem><FormLabel>Email Contacto</FormLabel><FormControl><Input type="email" placeholder="contacto@empresa.com" {...field} disabled={isSaving} /></FormControl><FormMessage /></FormItem>)}/>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="discountType" render={({ field }) => (<FormItem><FormLabel>Tipo de Beneficio *</FormLabel><RadioGroup onValueChange={field.onChange} value={field.value} className="flex pt-2 gap-4" disabled={isSaving}><FormItem className="flex items-center space-x-2"><RadioGroupItem value="percentage" id="percentage" /><Label htmlFor="percentage" className="font-normal">Porcentaje</Label></FormItem><FormItem className="flex items-center space-x-2"><RadioGroupItem value="fixed" id="fixed" /><Label htmlFor="fixed" className="font-normal">Monto Fijo (¢)</Label></FormItem></RadioGroup><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="discountValue" render={({ field }) => (<FormItem><FormLabel>Valor del Beneficio *</FormLabel><FormControl><Input type="number" placeholder={form.getValues("discountType") === "percentage" ? "Ej: 15 (para 15%)" : "Ej: 5000 (para ¢5000)"} {...field} disabled={isSaving} /></FormControl><FormMessage /></FormItem>)}/>
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notas y Condiciones</FormLabel><FormControl><Textarea placeholder="Ej: Aplica solo en aros seleccionados, no aplica con otras promociones..." {...field} disabled={isSaving} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Estado *</FormLabel><RadioGroup onValueChange={field.onChange} value={field.value} className="flex pt-2 gap-4" disabled={isSaving}><FormItem className="flex items-center space-x-2"><RadioGroupItem value="Active" id="status-active" /><Label htmlFor="status-active" className="font-normal">Activo</Label></FormItem><FormItem className="flex items-center space-x-2"><RadioGroupItem value="Inactive" id="status-inactive" /><Label htmlFor="status-inactive" className="font-normal">Inactivo</Label></FormItem></RadioGroup><FormMessage /></FormItem>)}/>
              <DialogFooter className="pt-4"><DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button></DialogClose><Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingAgreement ? "Guardar Cambios" : "Crear Convenio"}</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={agreementToDelete !== null} onOpenChange={(open) => !open && setAgreementToDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle><AlertDialogDescription>¿Estás seguro de que quieres eliminar el convenio con "{agreementToDelete?.companyName}"? Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setAgreementToDelete(null)}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirm} className={cn(buttonVariants({ variant: "destructive" }))}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={isImportConfirmOpen} onOpenChange={(open) => { if (!open) setFileToImport(null); setIsImportConfirmOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                ¡Atención! ¿Confirmas la importación?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de importar convenios desde el archivo "{fileToImport?.name}". Esta acción puede tener consecuencias irreversibles.
              <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                <li>Asegúrate de que el archivo CSV utiliza la <strong>plantilla descargada</strong>.</li>
                <li>La importación <strong>añadirá nuevos convenios</strong>, no actualizará existentes.</li>
                <li>Verifica que no estás importando <strong>datos duplicados</strong>.</li>
              </ul>
              ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFileToImport(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={processImportFile}>Sí, continuar con la importación</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
}
