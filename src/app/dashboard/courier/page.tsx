
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, PlusCircle, Bike, Send, PackageCheck, Ban, Loader2, Trash2, CheckCircle2, Link as LinkIcon, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CourierJob, CourierJobStatus, CourierItem, LinkedDocumentType } from '@/types/courier';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { courierJobFormSchema, type CourierJobFormValues } from '@/types/courier-schema';
import { getCourierJobs, addCourierJob, updateCourierJobStatus } from '@/services/courier-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getPatients } from '@/services/patient-service';
import { getSuppliers } from '@/services/supplier-service';
import { getBranches } from '@/services/inventory-service';
import type { Patient } from '@/types/patient';
import type { Supplier } from '@/types/supplier';


const linkedDocumentTypes: LinkedDocumentType[] = ['Factura', 'Orden de Laboratorio', 'Traslado'];

export default function CourierPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<CourierJob[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CourierJobStatus | 'All'>('All');
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string; address?: string; phone?: string; }[]>([]);

  const form = useForm<CourierJobFormValues>({
    resolver: zodResolver(courierJobFormSchema),
    defaultValues: {
      destinationType: 'Cliente',
      destinationName: '',
      items: [{ description: '', quantity: 1, sku: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const destinationType = form.watch('destinationType');

  useEffect(() => {
    async function loadData() {
      setIsLoadingPage(true);
      const [fetchedJobs, fetchedPatients, fetchedSuppliers, fetchedBranches] = await Promise.all([
        getCourierJobs(),
        getPatients(),
        getSuppliers(),
        getBranches()
      ]);
      setJobs(fetchedJobs);
      setPatients(fetchedPatients);
      setSuppliers(fetchedSuppliers);
      setBranches(fetchedBranches);
      setIsLoadingPage(false);
    }
    loadData();
  }, []);
  
  // Reset destination fields when type changes
  useEffect(() => {
    form.setValue('destinationName', '');
    form.setValue('destinationAddress', '');
    form.setValue('recipientName', '');
    form.setValue('recipientPhone', '');
  }, [destinationType, form]);

  const destinationOptions = useMemo(() => {
    switch (destinationType) {
      case 'Cliente':
        return patients.map(p => ({ 
            id: p.id, 
            name: `${p.firstName} ${p.lastName}`, 
            address: p.address, 
            phone: p.phone, 
            contactName: `${p.firstName} ${p.lastName}` 
        }));
      case 'Proveedor':
        return suppliers.map(s => ({ 
            id: s.id, 
            name: s.name, 
            address: s.address, 
            phone: s.phone, 
            contactName: s.contactName 
        }));
      case 'Sucursal':
        return branches.map(b => ({ 
            id: b.id, 
            name: b.name, 
            address: b.address, 
            phone: b.phone, 
            contactName: b.name 
        }));
      default:
        return [];
    }
  }, [destinationType, patients, suppliers, branches]);

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    form.setValue('destinationName', value);

    const selectedOption = destinationOptions.find(opt => opt.name === value);
    if (selectedOption) {
      form.setValue('destinationAddress', selectedOption.address || '', { shouldValidate: true });
      form.setValue('recipientName', selectedOption.contactName || '', { shouldValidate: true });
      form.setValue('recipientPhone', selectedOption.phone || '', { shouldValidate: true });
    }
  };
  
  const handleFormSubmit = async (values: CourierJobFormValues) => {
    setIsSaving(true);
    const newJob = await addCourierJob(values);
    setJobs(prev => [newJob, ...prev]);
    toast({ title: "Envío Creado", description: `El envío ${newJob.internalTrackingId} ha sido registrado.` });
    setIsFormOpen(false);
    setIsSaving(false);
    form.reset({
      destinationType: 'Cliente',
      destinationName: '',
      items: [{ description: '', quantity: 1, sku: '' }],
    });
  };

  const handleStatusChange = async (jobId: string, status: CourierJobStatus) => {
    const updatedJob = await updateCourierJobStatus(jobId, status);
    if(updatedJob) {
      setJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
      toast({ title: "Estado Actualizado", description: `El envío ${updatedJob.internalTrackingId} ahora está ${status}.`});
    }
  };

  const handlePrintJob = (job: CourierJob) => {
    toast({
      title: "Imprimiendo Guía de Envío (Simulado)",
      description: `Se está preparando la guía para el envío ${job.internalTrackingId}.`
    });
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job =>
      (job.internalTrackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
       job.destinationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (job.externalTrackingNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
       (job.linkedDocumentId || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === 'All' || job.status === statusFilter)
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [jobs, searchTerm, statusFilter]);

  const getStatusBadgeVariant = (status: CourierJobStatus) => {
    switch (status) {
      case 'Entregado': return 'default';
      case 'Enviado': case 'En Tránsito': return 'secondary';
      case 'Pendiente': return 'outline';
      case 'Cancelado': case 'Problema': return 'destructive';
      default: return 'default';
    }
  };

  const formatDateSafe = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try { return format(parseISO(dateString), "dd MMM, yy HH:mm", { locale: es }); }
    catch { return 'Fecha Inválida'; }
  };
  
  if (isLoadingPage) {
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
            <Bike className="h-7 w-7" /> Gestión de Mensajería
          </h1>
          <p className="text-muted-foreground">Administra y da seguimiento a todos tus envíos.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}><PlusCircle className="mr-2 h-5 w-5" /> Nuevo Envío</Button>
      </div>

      <Card className="shadow-md rounded-xl">
        <CardHeader>
          <CardTitle>Listado de Envíos</CardTitle>
          <div className="mt-2 flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar por ID, destino o documento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-full" />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">Todos los Estados</SelectItem>
                    {(['Pendiente', 'Enviado', 'En Tránsito', 'Entregado', 'Cancelado', 'Problema'] as CourierJobStatus[]).map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Envío</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Contenido</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.internalTrackingId}</TableCell>
                    <TableCell>{formatDateSafe(job.createdAt)}</TableCell>
                    <TableCell>{job.destinationName} <Badge variant="outline" className="ml-1">{job.destinationType}</Badge></TableCell>
                    <TableCell className="text-xs max-w-xs">
                        <div className="flex flex-col gap-1">
                            <span className="truncate" title={job.items.map(i => `${i.description} (x${i.quantity})`).join(', ')}>
                                {job.items.map(i => `${i.description} (x${i.quantity})`).join(', ')}
                            </span>
                            {job.linkedDocumentId && (
                                <Badge variant="secondary" className="w-fit">
                                    <LinkIcon className="h-3 w-3 mr-1"/>
                                    {job.linkedDocumentType}: {job.linkedDocumentId}
                                </Badge>
                            )}
                        </div>
                    </TableCell>
                    <TableCell className="text-center"><Badge variant={getStatusBadgeVariant(job.status)}>{job.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handlePrintJob(job)}><Printer className="mr-2 h-4 w-4"/> Imprimir Guía</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'Enviado')}><Send className="mr-2 h-4 w-4"/>Marcar como Enviado</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'En Tránsito')}><Bike className="mr-2 h-4 w-4"/>Marcar En Tránsito</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'Entregado')}><CheckCircle2 className="mr-2 h-4 w-4"/>Marcar como Entregado</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'Cancelado')} className="text-destructive"><Ban className="mr-2 h-4 w-4"/>Cancelar Envío</DropdownMenuItem>
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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Envío</DialogTitle>
            <DialogDescription>Complete los detalles del paquete a enviar.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="destinationType" render={({ field }) => (
                  <FormItem><FormLabel>Tipo de Destino*</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{(['Cliente', 'Sucursal', 'Proveedor', 'Otro'] as const).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )}/>
                <FormField
                  control={form.control}
                  name="destinationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Destino*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Escriba o seleccione un destino"
                          {...field}
                          onChange={handleDestinationChange}
                          list="destination-options-list"
                          autoComplete="off"
                        />
                      </FormControl>
                      <datalist id="destination-options-list">
                        {destinationOptions.map(opt => (
                          <option key={opt.id} value={opt.name} />
                        ))}
                      </datalist>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField control={form.control} name="destinationAddress" render={({ field }) => (
                  <FormItem><FormLabel>Dirección de Envío</FormLabel><FormControl><Textarea placeholder="Dirección completa..." {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                )}/>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="recipientName" render={({ field }) => (
                    <FormItem><FormLabel>Nombre Recibe</FormLabel><FormControl><Input placeholder="Persona de contacto" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="recipientPhone" render={({ field }) => (
                    <FormItem><FormLabel>Teléfono Recibe</FormLabel><FormControl><Input placeholder="8888-8888" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
              </div>
              <div>
                <FormLabel>Ítems / Trabajos en el Paquete*</FormLabel>
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2 mt-2 p-2 border rounded-md">
                        <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field: descField }) => (
                                <FormItem className="sm:col-span-2">
                                <FormLabel className="sr-only">Descripción</FormLabel>
                                <FormControl>
                                    <Input placeholder={`Descripción del ítem #${index + 1}`} {...descField} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name={`items.${index}.sku`}
                            render={({ field: skuField }) => (
                                <FormItem>
                                <FormLabel className="sr-only">SKU</FormLabel>
                                <FormControl>
                                    <Input placeholder="SKU (Opcional)" {...skuField} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field: qtyField }) => (
                                <FormItem>
                                <FormLabel className="sr-only">Cantidad</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="Cant." {...qtyField} min="1" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={fields.length <= 1}
                            className="mt-1"
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => append({ description: '', quantity: 1, sku: '' })}
                >
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Ítem/Trabajo
                </Button>
              </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="courierService" render={({ field }) => (
                    <FormItem><FormLabel>Servicio Mensajería</FormLabel><FormControl><Input placeholder="Ej: Mensajero Interno" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="externalTrackingNumber" render={({ field }) => (
                    <FormItem><FormLabel>Nº Rastreo Externo</FormLabel><FormControl><Input placeholder="Opcional" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
              </div>
              <div className="p-3 border rounded-md space-y-3">
                <FormLabel className="text-sm font-medium">Vincular Documento (Opcional)</FormLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="linkedDocumentType" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">Tipo de Documento</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione un tipo"/></SelectTrigger></FormControl><SelectContent>{linkedDocumentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="linkedDocumentId" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">ID/Nº del Documento</FormLabel><FormControl><Input placeholder="Ej: FACT-00123" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                </div>
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notas Adicionales</FormLabel><FormControl><Textarea placeholder="Instrucciones especiales para el mensajero..." {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                )}/>
              <DialogFooter className="pt-4"><DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button></DialogClose><Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Crear Envío</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
