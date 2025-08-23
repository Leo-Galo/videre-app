
"use client";

import type { NextPage } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ClinicTenant } from '@/types/superadmin';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Save, AlertTriangle, Edit } from 'lucide-react'; 
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { updateClinic, getClinicById } from '@/services/superadmin/clinic-service';
import { editClinicFormSchema, type EditClinicFormValues } from '@/types/superadmin-schemas';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';


const EditClinicPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const clinicId = params.clinicId as string;
  
  const [clinic, setClinic] = useState<ClinicTenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<EditClinicFormValues>({
    resolver: zodResolver(editClinicFormSchema),
    defaultValues: { name: '', plan: 'Basic', status: 'Active' }
  });

  useEffect(() => {
    if (clinicId) {
      setIsLoading(true);
      getClinicById(clinicId).then(foundClinic => {
        setClinic(foundClinic || null);
        if (foundClinic) {
          form.reset({
            name: foundClinic.name,
            plan: foundClinic.plan,
            status: foundClinic.status,
            adminEmail: foundClinic.adminEmail,
            nextBillingDate: foundClinic.nextBillingDate ? new Date(foundClinic.nextBillingDate) : undefined,
            trialEndDate: foundClinic.trialEndDate ? new Date(foundClinic.trialEndDate) : undefined,
          });
        }
        setIsLoading(false);
      });
    }
  }, [clinicId, form]);

  const handleSaveChanges = async (values: EditClinicFormValues) => {
    if (!clinic) return;
    setIsSaving(true);
    
    const updatedClinic = await updateClinic(clinic.id, values);

    if (updatedClinic) {
      toast({
        title: "Clínica Actualizada",
        description: `La clínica "${values.name}" ha sido actualizada exitosamente.`,
      });
      router.push(`/superadmin/clinics/${clinic.id}`); 
    } else {
       toast({
        variant: "destructive",
        title: "Error al Actualizar",
        description: "No se pudo actualizar la clínica.",
      });
    }

    setIsSaving(false);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-56 mb-4" />
        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <Skeleton className="h-7 w-1/2 mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[...Array(3)].map((_,i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-5 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ))}
             <div className="flex justify-end space-x-3 pt-8 mt-8 border-t">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
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
        <Link href="/superadmin/clinics" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Listado
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link href={`/superadmin/clinics/${clinic.id}`} passHref>
          <Button variant="outline" className="flex items-center gap-2 self-start sm:self-center">
            <ArrowLeft className="h-4 w-4" />
            Volver a Detalles
          </Button>
        </Link>
      </div>
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
            <Edit className="h-6 w-6" />
            Editar Clínica: {clinic.name}
          </CardTitle>
          <CardDescription>Modifica la información y el estado de la clínica. Los cambios aquí son directos y para uso administrativo.</CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveChanges)}>
                <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nombre de la Clínica *</FormLabel>
                        <FormControl><Input placeholder="Nombre de la clínica" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="adminEmail"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email del Administrador</FormLabel>
                        <FormControl><Input type="email" {...field} disabled /></FormControl>
                        <FormDescription className="text-xs">El email del administrador no se puede cambiar desde aquí.</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="plan"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Plan Asignado *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un plan" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {(["Basic", "Pro", "Premium"] as const).map(planName => (
                                <SelectItem key={planName} value={planName}>{planName}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Estado de la Clínica *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {(["Active", "Suspended", "Trialing", "Expired", "Cancelled"] as const).map(statusName => (
                                <SelectItem key={statusName} value={statusName}>{statusName}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="nextBillingDate"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Próxima Fecha de Cobro</FormLabel>
                             <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="trialEndDate"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Fin del Período de Prueba</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP", { locale: es }) : <span>No aplica</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                </CardContent>
                <CardFooter className="border-t p-6 flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                    </Button>
                </CardFooter>
            </form>
        </Form>
      </Card>
    </div>
  );
};

export default EditClinicPage;
