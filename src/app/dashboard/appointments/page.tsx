
"use client";

import type { NextPage } from 'next';
import { useState, useEffect, useMemo, useRef } from 'react'; 
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, MoreVertical, CalendarDays, Clock, User, Briefcase, StickyNote, AlertTriangle, CheckCircle2, Hourglass, Send, Filter, Download, Upload } from 'lucide-react'; 
import { AppointmentForm, type AppointmentFormValues } from '@/components/dashboard/appointments/appointment-form';
import type { Appointment, AppointmentStatus, AppointmentType } from '@/types/appointment';
import type { ClinicUser } from '@/types/user'; 
import { format, parseISO, isSameDay, setHours, setMinutes, addMinutes, startOfDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"; // Added
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; 
import { getAppointments, addOrUpdateAppointment, deleteAppointment, getOptometrists, getAppointmentTypes } from '@/services/appointment-service';


const appointmentStatusesFilterOptions: (AppointmentStatus | "all")[] = ["all", "scheduled", "completed", "cancelled", "pending_confirmation"];

const getStatusDisplayName = (status: AppointmentStatus): string => {
    switch (status) {
      case 'scheduled': return 'Programada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      case 'pending_confirmation': return 'Pend. Confirmación';
      default: return status;
    }
};


const AppointmentsPage: NextPage = () => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [optometrists, setOptometrists] = useState<ClinicUser[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>(undefined);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);

  const [selectedOptometristFilter, setSelectedOptometristFilter] = useState<string>("all");
  const [selectedAppointmentTypeFilter, setSelectedAppointmentTypeFilter] = useState<AppointmentType | "all">("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [userRole, setUserRole] = useState<string | null>(null);
  const appointmentImportInputRef = useRef<HTMLInputElement>(null);
  const [isAppointmentImportConfirmOpen, setIsAppointmentImportConfirmOpen] = useState(false); // Added
  const [appointmentFileToImport, setAppointmentFileToImport] = useState<File | null>(null); // Added


  useEffect(() => {
    const role = localStorage.getItem('mockUserRole');
    setUserRole(role);
    
    async function loadData() {
        setIsLoading(true);
        const [appts, optoms, types] = await Promise.all([
            getAppointments(),
            getOptometrists(),
            getAppointmentTypes()
        ]);
        setAppointments(appts);
        setOptometrists(optoms);
        setAppointmentTypes(types);
        setIsLoading(false);
    }

    loadData();
  }, []);

  const isAdmin = userRole === "Admin";

  const dailyAppointments = useMemo(() => {
    if (!selectedDate) return [];
    return appointments
      .filter(appt => {
        const isSameDaySelected = isSameDay(parseISO(appt.dateTime), selectedDate);
        if (!isSameDaySelected) return false;

        if (selectedOptometristFilter !== "all" && appt.optometristId !== selectedOptometristFilter) {
          return false;
        }
        if (selectedAppointmentTypeFilter !== "all" && appt.type !== selectedAppointmentTypeFilter) {
          return false;
        }
        if (selectedStatusFilter !== "all" && appt.status !== selectedStatusFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => parseISO(a.dateTime).getTime() - parseISO(b.dateTime).getTime());
  }, [selectedDate, appointments, selectedOptometristFilter, selectedAppointmentTypeFilter, selectedStatusFilter]);

  const daysWithAppointments = useMemo(() => {
    const dates = appointments.map(appt => startOfDay(parseISO(appt.dateTime)));
    return Array.from(new Set(dates.map(date => date.getTime()))).map(time => new Date(time));
  }, [appointments]);


  const handleAddOrUpdateAppointment = async (appointmentData: Appointment) => {
    const updatedAppointment = await addOrUpdateAppointment(appointmentData);
    if(updatedAppointment){
        const updatedAppointments = await getAppointments();
        setAppointments(updatedAppointments);
    }
  };

  const handleOpenForm = (appointment?: Appointment) => {
    setEditingAppointment(appointment);
    setIsFormOpen(true);
  };
  
  const handleDeleteAppointment = async () => {
    if (appointmentToDelete) {
      await deleteAppointment(appointmentToDelete.id);
      const updatedAppointments = await getAppointments();
      setAppointments(updatedAppointments);
      toast({
        title: "Cita Eliminada",
        description: `La cita para ${appointmentToDelete.patientName} ha sido eliminada.`,
      });
      setAppointmentToDelete(null);
    }
  };
  
  const handleMarkAs = async (appointment: Appointment, status: AppointmentStatus, cancellationReason?: string) => {
    const updatedAppointment = { 
      ...appointment, 
      status, 
      updatedAt: new Date().toISOString(),
      cancellationReason: status === 'cancelled' ? (cancellationReason || appointment.cancellationReason || 'Cancelada por el usuario') : undefined
    };
    await addOrUpdateAppointment(updatedAppointment);
    const updatedAppointments = await getAppointments();
    setAppointments(updatedAppointments);
    let statusText = "actualizado";
    if (status === 'completed') statusText = "completada";
    else if (status === 'cancelled') statusText = "cancelada";
    else if (status === 'scheduled' && appointment.status === 'pending_confirmation') statusText = "confirmada";
    else if (status === 'scheduled') statusText = "re-programada";

    toast({
      title: "Estado de Cita Actualizado",
      description: `La cita de ${appointment.patientName} ha sido ${statusText}.`,
    });
  };

  const handleSendReminder = (appointment: Appointment) => {
    toast({
      title: "Recordatorio Enviado",
      description: `Se ha enviado un recordatorio de cita a ${appointment.patientName}.`,
    });
  }

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'scheduled': return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600"><CheckCircle2 className="mr-1 h-3 w-3"/>Programada</Badge>;
      case 'completed': return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="mr-1 h-3 w-3"/>Completada</Badge>;
      case 'cancelled': return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3"/>Cancelada</Badge>;
      case 'pending_confirmation': return <Badge variant="secondary" className="bg-yellow-500 text-yellow-950 hover:bg-yellow-500/80"><Hourglass className="mr-1 h-3 w-3"/>Pend. Conf.</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDownloadAppointmentImportTemplate = () => {
    const headers = "ID_Cita_Sistema_Anterior,Nombre_Paciente,ID_Paciente_Videre,Email_Paciente,Telefono_Paciente,Nombre_Optometra,ID_Optometra_Videre,Fecha_Cita (YYYY-MM-DD),Hora_Cita (HH:MM),Duracion_Minutos,Tipo_Cita,Estado_Cita,Notas_Cita,Motivo_Cancelacion,Fecha_Creacion_Original (YYYY-MM-DD HH:MM:SS)\n";
    const exampleRow = "OLD_APP_001,Juan Perez,PAT001,juan@example.com,88887777,Dr. Alan Grant,OPT001,2024-09-15,10:30,45,Examen Visual General,scheduled,Primera visita anual,,2024-07-01 09:00:00\n";
    const csvContent = "\uFEFF" + headers + exampleRow;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "plantilla_importacion_citas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Plantilla de Importación de Citas Descargada" });
  };

  const handleImportAppointmentsClick = () => {
    appointmentImportInputRef.current?.click();
  };

  const handleAppointmentFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.type !== 'text/csv') {
            toast({ variant: "destructive", title: "Archivo Inválido", description: "Solo se permiten archivos CSV para importar citas." });
            event.target.value = "";
            return;
        }
        setAppointmentFileToImport(file);
        setIsAppointmentImportConfirmOpen(true);
        event.target.value = "";
    }
  };
  
  const processAppointmentImportFile = async () => {
    if (!appointmentFileToImport) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvData = e.target?.result as string;
      const rows = csvData.split('\n').slice(1); 
      for (const row of rows) {
        if (!row.trim()) continue;
        const columns = row.split(',');
        if (columns.length >= 11 && columns[1] && columns[7] && columns[8] && columns[9] && columns[10]) {
          try {
            const [hours, minutes] = columns[8].split(':').map(Number);
            const dateTime = setMinutes(setHours(parseISO(columns[7]), hours), minutes).toISOString();
            const newAppointment: Appointment = {
              id: `imported-appt-${Date.now()}-${Math.random()}`,
              patientName: columns[1],
              patientId: columns[2] || `unknown-pat-${Math.random()}`,
              optometristName: columns[5] || undefined,
              optometristId: columns[6] || undefined,
              dateTime: dateTime,
              durationMinutes: parseInt(columns[9], 10) || 30,
              type: columns[10] as AppointmentType,
              status: (columns[11] as AppointmentStatus) || 'scheduled',
              notes: columns[12] || undefined,
              cancellationReason: columns[13] || undefined,
              createdAt: columns[14] ? parseISO(columns[14]).toISOString() : new Date().toISOString(),
            };
            await addOrUpdateAppointment(newAppointment);
          } catch (error) {
            console.warn(`Error parsing row for appointment import:`, error);
          }
        }
      }
      const updatedAppointments = await getAppointments();
      setAppointments(updatedAppointments);
      toast({ title: "Importación de Citas Exitosa", description: `${rows.filter(r => r.trim()).length} citas procesadas del CSV.` });
    };
    reader.readAsText(appointmentFileToImport);
    setAppointmentFileToImport(null);
  };


  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-1 rounded-lg" />
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-1/4 mb-4" />
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <Skeleton className="h-10 w-full sm:w-[180px]" />
                <Skeleton className="h-10 w-full sm:w-[180px]" />
                <Skeleton className="h-10 w-full sm:w-[180px]" />
            </div>
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="p-4 md:p-6 space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary">Gestión de Citas</h1>
          <p className="text-muted-foreground">Organiza y visualiza las citas de tu óptica.</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                  <Button variant="outline" onClick={handleDownloadAppointmentImportTemplate} disabled={!isAdmin} className="flex items-center gap-2">
                      <Download className="h-4 w-4" /> Plantilla
                  </Button>
              </TooltipTrigger>
              {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
            </Tooltip>
            <input type="file" accept=".csv" ref={appointmentImportInputRef} onChange={handleAppointmentFileSelected} className="hidden"/>
            <Tooltip>
              <TooltipTrigger asChild>
                  <Button variant="outline" onClick={handleImportAppointmentsClick} disabled={!isAdmin} className="flex items-center gap-2">
                      <Upload className="h-4 w-4" /> Importar
                  </Button>
              </TooltipTrigger>
              {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
            </Tooltip>
            <Button onClick={() => handleOpenForm()} className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" /> Programar Nueva Cita
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
        <Card className="lg:col-span-1 shadow-lg rounded-xl flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl">Calendario</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md"
              locale={es}
              modifiers={{ hasAppointments: daysWithAppointments }}
              modifiersStyles={{ hasAppointments: { fontWeight: 'bold', textDecoration: 'underline', textUnderlineOffset: '2px'} }}
              footer={<p className="text-xs text-muted-foreground p-2 text-center">{selectedDate ? `Viendo citas para: ${format(selectedDate, 'PPP', { locale: es })}` : 'Seleccione un día.'}</p>}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg rounded-xl flex flex-col min-h-0">
          <CardHeader>
            <CardTitle className="text-xl">Citas del Día</CardTitle>
            <CardDescription>{selectedDate ? format(selectedDate, 'eeee, dd \'de\' MMMM \'de\' yyyy', { locale: es }) : 'Ninguna fecha seleccionada'}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 mb-4 border-b pb-4">
                <div className="flex-1 min-w-[150px]">
                    <Label htmlFor="optometrist-filter" className="text-xs text-muted-foreground">Optómetra</Label>
                    <Select value={selectedOptometristFilter} onValueChange={setSelectedOptometristFilter}>
                        <SelectTrigger id="optometrist-filter" className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los Optómetras</SelectItem>
                            {optometrists.map(optom => (<SelectItem key={optom.id} value={optom.id}>{optom.name}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-1 min-w-[150px]">
                     <Label htmlFor="type-filter" className="text-xs text-muted-foreground">Tipo Cita</Label>
                    <Select value={selectedAppointmentTypeFilter} onValueChange={(value) => setSelectedAppointmentTypeFilter(value as AppointmentType | "all")}>
                        <SelectTrigger id="type-filter" className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los Tipos</SelectItem>
                            {appointmentTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-1 min-w-[150px]">
                    <Label htmlFor="status-filter" className="text-xs text-muted-foreground">Estado</Label>
                    <Select value={selectedStatusFilter} onValueChange={(value) => setSelectedStatusFilter(value as AppointmentStatus | "all")}>
                        <SelectTrigger id="status-filter" className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                        <SelectContent>
                            {appointmentStatusesFilterOptions.map(status => (
                                <SelectItem key={status} value={status}>
                                    {status === "all" ? "Todos los Estados" : getStatusDisplayName(status as AppointmentStatus)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {dailyAppointments.length > 0 ? (
              dailyAppointments.map(appt => (
                <div key={appt.id} className="p-3 border rounded-lg hover:shadow-md transition-shadow bg-card flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="flex-grow space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{format(parseISO(appt.dateTime), 'HH:mm')} - {format(addMinutes(parseISO(appt.dateTime), appt.durationMinutes || 30), 'HH:mm')}</span>
                      {getStatusBadge(appt.status)}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{appt.patientName}</span>
                    </div>
                     <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{appt.type}</span>
                    </div>
                    {appt.optometristName && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>Opt.: {appt.optometristName}</span>
                      </div>
                    )}
                    {appt.notes && (
                      <div className="flex items-start gap-2 text-xs text-muted-foreground pt-1">
                        <StickyNote className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <p className="truncate" title={appt.notes}>Notas: {appt.notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 self-start sm:self-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {appt.status === 'scheduled' && (
                          <>
                            <DropdownMenuItem onClick={() => handleMarkAs(appt, 'completed')}><CheckCircle2 className="mr-2 h-4 w-4 text-green-600"/> Marcar como Completada</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMarkAs(appt, 'cancelled', 'Cancelada por usuario desde dashboard')} className="text-orange-600 hover:!text-orange-600 focus:text-orange-600"><AlertTriangle className="mr-2 h-4 w-4"/> Marcar como Cancelada</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendReminder(appt)}><Send className="mr-2 h-4 w-4"/> Enviar Recordatorio</DropdownMenuItem>
                          </>
                        )}
                        {appt.status === 'pending_confirmation' && (
                          <>
                            <DropdownMenuItem onClick={() => handleMarkAs(appt, 'scheduled')}><CheckCircle2 className="mr-2 h-4 w-4 text-blue-500"/> Confirmar Cita</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMarkAs(appt, 'cancelled', 'Cancelada por usuario (pendiente conf.)')} className="text-orange-600 hover:!text-orange-600 focus:text-orange-600"><AlertTriangle className="mr-2 h-4 w-4"/> Cancelar Cita</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendReminder(appt)}><Send className="mr-2 h-4 w-4"/> Enviar Recordatorio</DropdownMenuItem>
                          </>
                        )}
                        {(appt.status === 'completed' || appt.status === 'cancelled') && (
                            <DropdownMenuItem onClick={() => handleMarkAs(appt, 'scheduled')}><CalendarDays className="mr-2 h-4 w-4 text-blue-500"/> Re-Programar (Marcar como Programada)</DropdownMenuItem>
                        )}
                         <DropdownMenuItem onClick={() => handleOpenForm(appt)}><Edit className="mr-2 h-4 w-4"/> Editar Cita</DropdownMenuItem>
                         <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setAppointmentToDelete(appt)} className="text-destructive hover:!text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4"/> Eliminar Cita
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No hay citas programadas para esta fecha con los filtros aplicados.</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <AppointmentForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        appointment={editingAppointment}
        initialDate={selectedDate}
        onSuccess={handleAddOrUpdateAppointment}
        allAppointments={appointments} 
      />

      <AlertDialog open={appointmentToDelete !== null} onOpenChange={(open) => !open && setAppointmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar esta cita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la cita de "{appointmentToDelete?.patientName}" para el {appointmentToDelete && format(parseISO(appointmentToDelete.dateTime), "PPP 'a las' HH:mm", { locale: es })}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAppointmentToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAppointment} className={cn(buttonVariants({ variant: "destructive" }))}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isAppointmentImportConfirmOpen} onOpenChange={(open) => { if (!open) setAppointmentFileToImport(null); setIsAppointmentImportConfirmOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              ¡Atención! ¿Confirmas la importación?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de importar citas desde el archivo "{appointmentFileToImport?.name}". Esta acción puede tener consecuencias irreversibles.
               <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                <li>Asegúrate de que el archivo CSV utiliza la <strong>plantilla descargada</strong>.</li>
                <li>La importación <strong>añadirá nuevas citas</strong>, no actualizará existentes.</li>
                <li>Verifica que los IDs de pacientes y optómetras coincidan con los de Videre.</li>
              </ul>
              ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAppointmentFileToImport(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={processAppointmentImportFile}>Sí, continuar con la importación</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
    </TooltipProvider>
  );
};

export default AppointmentsPage;
