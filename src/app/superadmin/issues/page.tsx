
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, Eye, CheckCircle2, Settings2, AlertTriangle, ArrowLeft, MessageSquareWarning, UserCheck, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { format, parseISO, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SupportIssue, IssueStatus, IssuePriority } from '@/types/superadmin';
import { getIssues, updateIssue } from '@/services/superadmin/issue-service';

const issueStatuses: IssueStatus[] = ['Open', 'InProgress', 'Resolved', 'Closed', 'PendingClient'];
const issuePriorities: IssuePriority[] = ['Low', 'Medium', 'High', 'Critical'];

const getStatusDisplayName = (status: IssueStatus): string => {
    switch (status) {
        case 'Open': return 'Abierta';
        case 'InProgress': return 'En Progreso';
        case 'Resolved': return 'Resuelta';
        case 'Closed': return 'Cerrada';
        case 'PendingClient': return 'Pend. Cliente';
        default: return status;
    }
};

const getPriorityDisplayName = (priority: IssuePriority): string => {
    switch (priority) {
        case 'Low': return 'Baja';
        case 'Medium': return 'Media';
        case 'High': return 'Alta';
        case 'Critical': return 'Crítica';
        default: return priority;
    }
};


export default function SuperAdminIssuesPage() {
  const { toast } = useToast();
  const [issues, setIssues] = useState<SupportIssue[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<SupportIssue | null>(null);
  const [newStatus, setNewStatus] = useState<IssueStatus | ''>('');
  const [newPriority, setNewPriority] = useState<IssuePriority | ''>('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    async function loadData() {
        const data = await getIssues();
        setIssues(data);
        setIsLoading(false);
    }
    loadData();
  }, []);

  const filteredIssues = useMemo(() => {
    return issues.filter(issue =>
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (issue.reportedByClinicName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.priority.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [issues, searchTerm]);

  const handleOpenManageDialog = (issue: SupportIssue) => {
    setSelectedIssue(issue);
    setNewStatus(issue.status);
    setNewPriority(issue.priority);
    setResolutionNotes(issue.resolutionNotes || '');
  };
  
  const handleSaveChanges = async () => {
    if (!selectedIssue || !newStatus || !newPriority) return;
    
    const success = await updateIssue(selectedIssue.id, {
        status: newStatus,
        priority: newPriority,
        resolutionNotes,
    });
    
    if(success) {
        const updatedIssues = await getIssues();
        setIssues(updatedIssues);
        toast({ title: "Incidencia Actualizada", description: `La incidencia "${selectedIssue.title}" ha sido actualizada.`});
    } else {
        toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar la incidencia."});
    }
    setSelectedIssue(null); // This will close the dialog via the open prop
  };

  const getStatusBadgeVariant = (status: IssueStatus) => {
    switch (status) {
      case 'Open': return 'destructive';
      case 'InProgress': return 'secondary';
      case 'Resolved':
      case 'Closed': return 'default';
      case 'PendingClient': return 'outline';
      default: return 'default';
    }
  };
  
  const getPriorityBadgeVariant = (priority: IssuePriority) => {
    switch (priority) {
      case 'Critical': return 'destructive';
      case 'High': return 'secondary'; // orange-like
      case 'Medium': return 'outline'; // blue-ish
      case 'Low': return 'default'; // green-ish
      default: return 'default';
    }
  };
  
   const getPriorityTextClass = (priority: IssuePriority) => {
    switch (priority) {
      case 'Critical': return 'text-red-600 font-bold';
      case 'High': return 'text-orange-600 font-semibold';
      case 'Medium': return 'text-blue-600';
      case 'Low': return 'text-green-600';
      default: return '';
    }
  };


  const formatDateSafe = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try { return format(parseISO(dateString), 'dd MMM, yyyy HH:mm', { locale: es }); }
    catch (e) { return 'Fecha Inválida'; }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3 mb-2" /> <Skeleton className="h-4 w-2/3 mb-6" />
        <Card className="shadow-md rounded-xl"><CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader><CardContent><Skeleton className="h-80 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <MessageSquareWarning className="h-7 w-7" /> Gestión de Incidencias y Soporte
        </h1>
         <Button variant="outline" asChild>
          <Link href="/superadmin">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel SA
          </Link>
        </Button>
      </div>
      <CardDescription>
        Monitorea y gestiona los problemas reportados por las clínicas y errores críticos del sistema.
      </CardDescription>

      <Card className="shadow-md rounded-xl">
        <CardHeader>
          <CardTitle>Listado de Incidencias</CardTitle>
          <div className="mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por título, clínica, estado o prioridad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full md:w-1/2 lg:w-2/3"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredIssues.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Creada</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead className="hidden md:table-cell">Reportado Por</TableHead>
                    <TableHead className="text-center">Prioridad</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell className="text-xs">{formatDateSafe(issue.createdAt)}</TableCell>
                      <TableCell className="font-medium">{issue.title}</TableCell>
                      <TableCell className="hidden md:table-cell">{issue.reportedByClinicName || (issue.reportedByUserEmail || 'Sistema')}</TableCell>
                      <TableCell className="text-center"><Badge variant={getPriorityBadgeVariant(issue.priority)} className={getPriorityTextClass(issue.priority)}>{getPriorityDisplayName(issue.priority)}</Badge></TableCell>
                      <TableCell className="text-center"><Badge variant={getStatusBadgeVariant(issue.status)}>{getStatusDisplayName(issue.status)}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={() => handleOpenManageDialog(issue)}>
                            <Settings2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground"><p>No hay incidencias con los criterios de búsqueda.</p></div>
          )}
        </CardContent>
      </Card>

      <Dialog open={selectedIssue !== null} onOpenChange={(isOpen) => { if (!isOpen) setSelectedIssue(null); }}>
        {selectedIssue && (
          <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                      {selectedIssue.priority === 'Critical' && <ShieldAlert className="h-6 w-6 text-red-500" />}
                      {selectedIssue.priority === 'High' && <MessageSquareWarning className="h-6 w-6 text-orange-500" />}
                      Gestionar Incidencia: #{selectedIssue.id.slice(-6)}
                  </DialogTitle>
                  <DialogDescription>
                      <strong>Título:</strong> {selectedIssue.title} <br/>
                      <strong>Reportado por:</strong> {selectedIssue.reportedByClinicName || (selectedIssue.reportedByUserEmail || 'Sistema')} <br/>
                      <strong>Fecha:</strong> {formatDateSafe(selectedIssue.createdAt)} | <strong>Últ. Act:</strong> {formatDateSafe(selectedIssue.updatedAt)}
                  </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                  <div>
                      <h4 className="font-semibold mb-1 text-sm">Descripción Completa:</h4>
                      <p className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap max-h-32 overflow-y-auto">{selectedIssue.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <Label htmlFor="issue-status-select" className="text-xs">Estado</Label>
                          <Select value={newStatus || ''} onValueChange={(value) => setNewStatus(value as IssueStatus)}>
                              <SelectTrigger id="issue-status-select"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  {issueStatuses.map(s => <SelectItem key={s} value={s}>{getStatusDisplayName(s)}</SelectItem>)}
                              </SelectContent>
                          </Select>
                      </div>
                      <div>
                          <Label htmlFor="issue-priority-select" className="text-xs">Prioridad</Label>
                          <Select value={newPriority || ''} onValueChange={(value) => setNewPriority(value as IssuePriority)}>
                              <SelectTrigger id="issue-priority-select"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  {issuePriorities.map(p => <SelectItem key={p} value={p}>{getPriorityDisplayName(p)}</SelectItem>)}
                              </SelectContent>
                          </Select>
                      </div>
                  </div>
                  <div>
                      <Label htmlFor="resolution-notes" className="text-xs">Notas de Resolución / Internas</Label>
                      <Textarea id="resolution-notes" value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} rows={3} placeholder="Detalles de la solución, pasos tomados, próximos pasos..." />
                  </div>
              </div>
              <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setSelectedIssue(null)}>Cancelar</Button>
                  <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
              </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
