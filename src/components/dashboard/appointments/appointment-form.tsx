
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { Appointment, AppointmentType, AppointmentStatus } from "@/types/appointment";
import type { Patient } from "@/types/patient";
import type { ClinicUser } from "@/types/user";
import { CalendarIcon, Clock, Loader2 } from "lucide-react";
import { format, parseISO, setHours, setMinutes, addMinutes, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getPatients } from "@/services/patient-service";
import { getOptometrists, getAppointmentTypes } from "@/services/appointment-service";


const UNASSIGNED_OPTOMETRIST_VALUE = "[NONE_OPT]";

const appointmentFormSchema = z.object({
  patientId: z.string().min(1, { message: "Debe seleccionar un paciente." }),
  optometristId: z.string().optional(),
  date: z.date({ required_error: "La fecha es requerida." }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Formato de hora inválido (HH:mm)." }),
  type: z.string().min(1, "El tipo de cita es requerido."),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().optional(),
  status: z.enum(["scheduled", "pending_confirmation"] as [AppointmentStatus, ...AppointmentStatus[]]).default("scheduled"),
});

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

interface AppointmentFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  appointment?: Appointment; // For editing
  initialDate?: Date;
  onSuccess: (appointment: Appointment) => void;
  allAppointments: Appointment[]; 
}

const mockAppointmentDurations: Record<string, number> = {
  "Examen Visual General": 45,
  "Examen Lentes de Contacto": 60,
  "Seguimiento": 30,
  "Adaptación Lentes Progresivos": 60,
  "Consulta Especializada": 50,
  "Retiro/Ajuste de Lentes": 20,
  "Otro": 30,
};

export function AppointmentForm({ isOpen, onOpenChange, appointment, initialDate, onSuccess, allAppointments }: AppointmentFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [optometrists, setOptometrists] = useState<ClinicUser[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  
  useEffect(() => {
    async function loadDropdownData() {
        const [pats, optoms, types] = await Promise.all([
            getPatients(),
            getOptometrists(),
            getAppointmentTypes()
        ]);
        setPatients(pats);
        setOptometrists(optoms);
        setAppointmentTypes(types);
    }
    if (isOpen) {
        loadDropdownData();
    }
  }, [isOpen]);

  const defaultValues: Partial<AppointmentFormValues> = {
    patientId: appointment?.patientId || "",
    optometristId: appointment?.optometristId || "", // Empty string shows placeholder
    date: appointment ? parseISO(appointment.dateTime) : initialDate || new Date(),
    time: appointment ? format(parseISO(appointment.dateTime), "HH:mm") : "09:00",
    type: appointment?.type || "Examen Visual General",
    durationMinutes: appointment?.durationMinutes || mockAppointmentDurations["Examen Visual General"],
    notes: appointment?.notes || "",
    status: appointment?.status || "scheduled",
  };

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues,
  });
  
  const appointmentType = form.watch("type");

  useEffect(() => {
    if (appointmentType) {
      form.setValue("durationMinutes", mockAppointmentDurations[appointmentType] || 30);
    }
  }, [appointmentType, form]);

  useEffect(() => {
    if (isOpen) {
      form.reset({
        patientId: appointment?.patientId || "",
        optometristId: appointment?.optometristId || "", // Defaults to placeholder if no optometrist
        date: appointment ? parseISO(appointment.dateTime) : initialDate || new Date(),
        time: appointment ? format(parseISO(appointment.dateTime), "HH:mm") : "09:00",
        type: appointment?.type || "Examen Visual General",
        durationMinutes: appointment?.durationMinutes || mockAppointmentDurations[appointment?.type || "Examen Visual General"],
        notes: appointment?.notes || "",
        status: appointment?.status || "scheduled",
      });
    }
  }, [isOpen, appointment, initialDate, form]);


  async function onSubmit(data: AppointmentFormValues) {
    setIsLoading(true);
    
    const [hours, minutes] = data.time.split(":").map(Number);
    const combinedDateTime = setMinutes(setHours(data.date, hours), minutes);

    const selectedPatient = patients.find(p => p.id === data.patientId);
    
    const finalOptometristId = data.optometristId === UNASSIGNED_OPTOMETRIST_VALUE ? undefined : data.optometristId;
    const selectedOptometrist = finalOptometristId 
      ? optometrists.find(o => o.id === finalOptometristId) 
      : undefined;

    const newOrUpdatedAppointment: Appointment = {
      id: appointment?.id || `appt-${Date.now()}`,
      patientId: data.patientId,
      patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : 'Desconocido',
      optometristId: finalOptometristId,
      optometristName: selectedOptometrist?.name || (finalOptometristId === undefined ? 'No Asignado' : 'Optómetra Desconocido'),
      dateTime: combinedDateTime.toISOString(),
      durationMinutes: data.durationMinutes || mockAppointmentDurations[data.type as AppointmentType],
      type: data.type as AppointmentType,
      notes: data.notes,
      status: data.status,
      createdAt: appointment?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (finalOptometristId) {
      const newAppointmentStart = combinedDateTime;
      const newAppointmentEnd = addMinutes(newAppointmentStart, newOrUpdatedAppointment.durationMinutes || 30);

      const existingAppointmentsForOptometristOnDate = allAppointments
        .filter(appt =>
          appt.optometristId === finalOptometristId &&
          isSameDay(parseISO(appt.dateTime), data.date) &&
          appt.id !== newOrUpdatedAppointment.id 
        );

      for (const existingAppt of existingAppointmentsForOptometristOnDate) {
        const existingStart = parseISO(existingAppt.dateTime);
        const existingEnd = addMinutes(existingStart, existingAppt.durationMinutes || 30);

        if (newAppointmentStart < existingEnd && newAppointmentEnd > existingStart) {
          toast({
            variant: "destructive",
            title: "Conflicto de Horario",
            description: `El optómetra ${selectedOptometrist?.name || ''} ya tiene una cita de ${format(existingStart, "HH:mm")} a ${format(existingEnd, "HH:mm")} que se solapa con este horario. Por favor, elija otro horario o optómetra.`,
            duration: 7000,
          });
          setIsLoading(false);
          return; 
        }
      }
    }

    await new Promise(resolve => setTimeout(resolve, 700)); 

    onSuccess(newOrUpdatedAppointment);
    setIsLoading(false);
    onOpenChange(false); 
    toast({
      title: appointment ? "Cita Actualizada" : "Cita Programada",
      description: `La cita para ${newOrUpdatedAppointment.patientName} ha sido ${appointment ? 'actualizada' : 'programada'} para el ${format(combinedDateTime, "PPP 'a las' HH:mm", { locale: es })}.`,
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isLoading) onOpenChange(open); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{appointment ? "Editar Cita" : "Programar Nueva Cita"}</DialogTitle>
          <DialogDescription>
            Complete los detalles de la cita.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paciente *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Seleccione un paciente" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="optometristId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Optómetra (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={isLoading}> {/* Ensure value is not undefined for Select */}
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Seleccione un optómetra" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED_OPTOMETRIST_VALUE}>No Asignar Aún</SelectItem>
                      {optometrists.map(o => (
                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            disabled={isLoading}
                          >
                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Cita *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Seleccione tipo de cita" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {appointmentTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duración Estimada (minutos)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} disabled={isLoading || !appointmentType} value={field.value || ''} />
                  </FormControl>
                   <FormDescription className="text-xs">Se actualiza según el tipo de cita. Puede ajustarlo.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Información adicional sobre la cita..." {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado Inicial</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Estado de la cita" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="scheduled">Programada</SelectItem>
                      <SelectItem value="pending_confirmation">Pendiente Confirmación</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {appointment ? "Actualizar Cita" : "Guardar Cita"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
