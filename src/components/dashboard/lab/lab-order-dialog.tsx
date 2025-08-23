
"use client";

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FlaskConical, Loader2 } from 'lucide-react';
import type { Patient, Prescription } from '@/types/patient';
import type { LabOrder } from '@/types/lab-order';
import { useToast } from '@/hooks/use-toast';
import { getPatientById } from '@/services/patient-service';
import { addLabOrder } from '@/services/lab-order-service';
import { labOrderFormSchema, type LabOrderFormValues } from '@/types/lab-order-schema';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Order } from '@/types/pos';

interface LabOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  patients: Patient[];
  onOrderCreated: (newOrder: LabOrder) => void;
  order?: Order | null; // For pre-filling from a sale
}

export function LabOrderDialog({ isOpen, onOpenChange, patients, onOrderCreated, order }: LabOrderDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [availablePrescriptions, setAvailablePrescriptions] = useState<Prescription[]>([]);

  const form = useForm<LabOrderFormValues>({
    resolver: zodResolver(labOrderFormSchema),
    defaultValues: { patientId: '', prescriptionId: '', labName: '', notes: '' },
  });
  
  const selectedPatientId = form.watch("patientId");

  useEffect(() => {
    if (selectedPatientId) {
      getPatientById(selectedPatientId).then(patient => {
        const prescs = patient?.clinicalHistory?.flatMap(h => h.prescriptions || []) || [];
        setAvailablePrescriptions(prescs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        form.setValue('prescriptionId', ''); // Reset prescription on patient change
      });
    } else {
      setAvailablePrescriptions([]);
    }
  }, [selectedPatientId, form]);

  useEffect(() => {
    if (!isOpen) {
      form.reset({ patientId: '', prescriptionId: '', labName: '', notes: '' });
      setAvailablePrescriptions([]);
    } else if (order && order.customer) {
        form.reset({
            patientId: order.customer.id,
            prescriptionId: '', // User still needs to select it
            labName: '',
            notes: `Trabajo para la orden #${order.orderNumber}`
        });
    }
  }, [isOpen, order, form]);

  const handleSubmit = async (values: LabOrderFormValues) => {
    setIsLoading(true);
    const patient = patients.find(p => p.id === values.patientId);
    const prescription = availablePrescriptions.find(p => p.id === values.prescriptionId);

    if (!patient || !prescription) {
        toast({ variant: 'destructive', title: 'Error', description: 'Paciente o prescripción no válidos.' });
        setIsLoading(false);
        return;
    }
    
    let frameDetails = '';
    if (prescription.frameBrand || prescription.frameModel || prescription.frameNotes) {
        frameDetails = `
--- ARMAZÓN ---
Marca: ${prescription.frameBrand || 'N/A'}
Modelo: ${prescription.frameModel || 'N/A'}
Medidas: ${prescription.frameMeasurements || 'N/A'}
Color: ${prescription.frameColor || 'N/A'}
Notas: ${prescription.frameNotes || 'Ninguna'}
`;
    }

    // Create a concise summary for the order
    const prescriptionSummary = `
--- PRESCRIPCIÓN ---
Lente: ${prescription.lensType || 'N/A'} / Material: ${prescription.lensMaterial || 'N/A'}
Tratamientos: ${prescription.lensCoatings?.join(', ') || 'Ninguno'}

OD: Esf ${prescription.sphericalOD || '-'} / Cil ${prescription.cylinderOD || '-'} / Eje ${prescription.axisOD || '-'} / Add ${prescription.addOD || '-'}
OS: Esf ${prescription.sphericalOS || '-'} / Cil ${prescription.cylinderOS || '-'} / Eje ${prescription.axisOS || '-'} / Add ${prescription.addOS || '-'}
DP: ${prescription.pd || 'N/A'}
${frameDetails}
`.trim();

    const newOrder = await addLabOrder(
        patient.id, 
        `${patient.firstName} ${patient.lastName}`, 
        prescription.id, 
        prescriptionSummary,
        { labName: values.labName, notes: values.notes },
        order?.id // Pass the sales order ID if it exists
    );
    
    onOrderCreated(newOrder);
    toast({ title: 'Orden Creada', description: `Orden de laboratorio ${newOrder.orderNumber} creada.` });
    setIsLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" /> Crear Nueva Orden de Laboratorio
          </DialogTitle>
          <DialogDescription>
            Selecciona el paciente, la prescripción y los detalles del trabajo a enviar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paciente *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || !!order}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un paciente" /></SelectTrigger></FormControl>
                    <SelectContent>{patients.map(p => (<SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>))}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prescriptionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prescripción a Utilizar *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || !selectedPatientId || availablePrescriptions.length === 0}>
                    <FormControl><SelectTrigger><SelectValue placeholder={!selectedPatientId ? "Seleccione un paciente primero" : "Seleccione una prescripción"} /></SelectTrigger></FormControl>
                    <SelectContent>
                        {availablePrescriptions.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                                Prescripción del {format(parseISO(p.date), 'dd MMM, yyyy', {locale:es})} ({p.lensType || 'General'})
                            </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="labName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Laboratorio *</FormLabel>
                  <FormControl><Input placeholder="Ej: Laboratorio Óptico Central" {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instrucciones Especiales (Opcional)</FormLabel>
                  <FormControl><Textarea rows={3} placeholder="Detalles específicos para el laboratorio, tipo de bisel, etc." {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="outline" disabled={isLoading}>Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isLoading || !form.formState.isValid}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Orden
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
