
"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HardDriveDownload, AlertTriangle, CheckCircle2, DatabaseBackup, CalendarClock, RotateCw, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays, addHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getBackupHistory, createManualBackup } from '@/services/superadmin/backup-service';
import type { BackupRecord } from '@/types/superadmin';

const getStatusDisplayName = (status: BackupRecord['status']) => {
    switch(status) {
        case 'Completed': return 'Completado';
        case 'Failed': return 'Fallido';
        case 'InProgress': return 'En Progreso';
        default: return status;
    }
};

const getTypeDisplayName = (type: BackupRecord['type']) => {
    switch(type) {
        case 'Manual': return 'Manual';
        case 'Scheduled': return 'Programado';
        default: return type;
    }
};

export default function SuperAdminBackupsPage() {
  const { toast } = useToast();
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [scheduledTime, setScheduledTime] = useState("03:00");
  const [scheduledFrequency, setScheduledFrequency] = useState("daily");

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const history = await getBackupHistory();
      setBackups(history);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleCreateManualBackup = async () => {
    setIsCreatingBackup(true);
    setBackupProgress(0);

    const tempInProgressBackup: BackupRecord = {
      id: `bkp-in-progress-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'InProgress',
      size: 'Calculando...',
      type: 'Manual',
      initiatedBy: 'SuperAdmin',
    };
    setBackups(prev => [tempInProgressBackup, ...prev]);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setBackupProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        
        createManualBackup().then(finalBackup => {
          setBackups(prev => prev.map(b => b.id === tempInProgressBackup.id ? finalBackup : b));
          toast({ title: "Backup Manual Creado", description: "El backup manual se ha completado exitosamente." });
          setIsCreatingBackup(false);
          setBackupProgress(0);
        });
      }
    }, 200);
  };
  
  const handleSaveSchedule = () => {
    toast({ title: "Programación Guardada", description: `Los backups se ejecutarán ${scheduledFrequency === 'daily' ? 'diariamente' : 'semanalmente'} a las ${scheduledTime} (simulado).` });
  };

  const getStatusBadgeVariant = (status: BackupRecord['status']) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'InProgress': return 'secondary';
      case 'Failed': return 'destructive';
      default: return 'outline';
    }
  };

  const formatDateSafe = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try { return format(new Date(dateString), 'dd MMM, yyyy HH:mm', { locale: es }); }
    catch (e) { return 'Fecha Inválida'; }
  };

  if (isLoading && !isCreatingBackup) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-4 w-2/3 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
        </div>
        <Card className="shadow-md rounded-xl">
          <CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader>
          <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <HardDriveDownload className="h-8 w-8" /> Gestión de Backups de Base de Datos
        </h1>
        <p className="text-muted-foreground">
          Administra y programa las copias de seguridad de la base de datos de Videre SaaS.
        </p>
        <Alert variant="default" className="mt-4 bg-primary/5 border-primary/20">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <AlertTitle>Infraestructura Real</AlertTitle>
            <AlertDescription>
                Esta sección es una interfaz para visualizar y disparar acciones de backend. La creación y gestión real de backups se maneja a nivel de infraestructura (ej. con servicios de Firebase/Google Cloud).
            </AlertDescription>
        </Alert>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DatabaseBackup className="h-5 w-5 text-primary"/>Backup Manual Inmediato</CardTitle>
            <CardDescription>Crea una copia de seguridad de la base de datos principal ahora mismo.</CardDescription>
          </CardHeader>
          <CardContent>
            {isCreatingBackup ? (
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Creando backup... ({backupProgress}%)</p>
                    <Progress value={backupProgress} className="w-full h-3" />
                </div>
            ) : (
                <Button onClick={handleCreateManualBackup} disabled={isCreatingBackup}>
                    <RotateCw className={`mr-2 h-4 w-4 ${isCreatingBackup ? 'animate-spin' : ''}`} />
                    {isCreatingBackup ? 'Creando Backup...' : 'Iniciar Backup Manual'}
                </Button>
            )}
            <p className="text-xs text-muted-foreground mt-2">Nota: Esta operación puede tardar y consumir recursos. Úsala con precaución.</p>
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary"/>Programación de Backups</CardTitle>
            <CardDescription>Configura la frecuencia y hora para los backups automáticos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="backup-frequency" className="text-sm font-medium mb-1 block">Frecuencia</label>
                    <Select value={scheduledFrequency} onValueChange={setScheduledFrequency}>
                        <SelectTrigger id="backup-frequency"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">Diariamente</SelectItem>
                            <SelectItem value="weekly">Semanalmente</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label htmlFor="backup-time" className="text-sm font-medium mb-1 block">Hora (CR)</label>
                     <Select value={scheduledTime} onValueChange={setScheduledTime}>
                        <SelectTrigger id="backup-time"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`).map(time => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Button onClick={handleSaveSchedule}>Guardar Programación</Button>
            <p className="text-xs text-muted-foreground mt-1">
                Próximo backup automático estimado: {format(addHours(new Date(new Date().setHours(parseInt(scheduledTime.split(':')[0]),0,0,0)), scheduledFrequency === 'daily' ? 24: 24*7), "dd MMM, yyyy 'a las' HH:mm", {locale: es})}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md rounded-xl">
        <CardHeader>
          <CardTitle>Historial de Backups Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {backups.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                    <TableHead className="hidden md:table-cell">Tamaño</TableHead>
                    <TableHead className="hidden lg:table-cell">Iniciado Por</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.slice(0, 5).map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">{formatDateSafe(backup.timestamp)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(backup.status)}>{getStatusDisplayName(backup.status)}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{getTypeDisplayName(backup.type)}</TableCell>
                      <TableCell className="hidden md:table-cell">{backup.size}</TableCell>
                      <TableCell className="hidden lg:table-cell">{backup.initiatedBy || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        {backup.status === 'Completed' && (
                            <Button variant="outline" size="sm" onClick={() => toast({title: "Simulando descarga...", description: `Se iniciaría la descarga del backup ${backup.id}`})}>
                                <Download className="mr-1.5 h-3.5 w-3.5"/> Descargar
                            </Button>
                        )}
                        {backup.status === 'Failed' && (
                            <Button variant="secondary" size="sm" onClick={() => toast({title: "Simulando reintento...", description: `Se reintentaría el backup ${backup.id}`})}>
                                <RotateCw className="mr-1.5 h-3.5 w-3.5"/> Reintentar
                            </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No hay historial de backups disponible.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
