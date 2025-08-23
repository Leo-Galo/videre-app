
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, Eye, Archive, CheckCircle2, MailQuestion, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { format, parseISO, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import type { ContactInquiry } from '@/types/superadmin';

const mockInquiries: ContactInquiry[] = [];

const getStatusDisplayName = (status: ContactInquiry['status']) => {
    switch (status) {
      case 'New': return 'Nuevo';
      case 'InProgress': return 'En Progreso';
      case 'Resolved': return 'Resuelto';
      case 'Archived': return 'Archivado';
      default: return status;
    }
};

export default function SuperAdminContactInquiriesPage() {
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);

  useEffect(() => {
    // SIMULATED: Fetching inquiries
    setTimeout(() => {
      setInquiries(mockInquiries);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredInquiries = useMemo(() => {
    return inquiries.filter(inq =>
      inq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inq.clinicName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inquiries, searchTerm]);

  const handleUpdateStatus = (inquiryId: string, newStatus: ContactInquiry['status']) => {
    setInquiries(prev => prev.map(inq => inq.id === inquiryId ? { ...inq, status: newStatus } : inq));
    toast({ title: "Estado Actualizado", description: `El estado de la consulta ha sido cambiado a ${getStatusDisplayName(newStatus)}.` });
  };
  
  const getStatusBadgeVariant = (status: ContactInquiry['status']) => {
    switch (status) {
      case 'New': return 'destructive'; // To highlight new ones
      case 'InProgress': return 'secondary';
      case 'Resolved': return 'default';
      case 'Archived': return 'outline';
      default: return 'default';
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
          <MailQuestion className="h-7 w-7" /> Consultas y Contactos Recibidos
        </h1>
         <Button variant="outline" asChild>
          <Link href="/superadmin">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel SA
          </Link>
        </Button>
      </div>
      <CardDescription>
        Aquí se listan las consultas y mensajes recibidos a través de los formularios de contacto o canales de soporte de Videre.
      </CardDescription>

      <Card className="shadow-md rounded-xl">
        <CardHeader>
          <CardTitle>Listado de Consultas</CardTitle>
          <div className="mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre, email, asunto, clínica o estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full md:w-1/2 lg:w-2/3"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInquiries.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recibido</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">Clínica</TableHead>
                    <TableHead>Asunto</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInquiries.map((inq) => (
                    <TableRow key={inq.id}>
                      <TableCell className="text-xs">{formatDateSafe(inq.receivedAt)}</TableCell>
                      <TableCell className="font-medium">{inq.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{inq.clinicName || 'N/A'}</TableCell>
                      <TableCell>{inq.subject}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusBadgeVariant(inq.status)}>{getStatusDisplayName(inq.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 mr-1" onClick={() => setSelectedInquiry(inq)}>
                                <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Gestionar</DropdownMenuLabel>
                              {inq.status !== 'InProgress' && <DropdownMenuItem onClick={() => handleUpdateStatus(inq.id, 'InProgress')}>Marcar Como En Progreso</DropdownMenuItem>}
                              {inq.status !== 'Resolved' && <DropdownMenuItem onClick={() => handleUpdateStatus(inq.id, 'Resolved')}><CheckCircle2 className="mr-2 h-4 w-4 text-green-500"/>Marcar Como Resuelta</DropdownMenuItem>}
                              {inq.status !== 'Archived' && <DropdownMenuItem onClick={() => handleUpdateStatus(inq.id, 'Archived')}><Archive className="mr-2 h-4 w-4"/>Archivar Consulta</DropdownMenuItem>}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground"><p>No se encontraron consultas.</p></div>
          )}
        </CardContent>
      </Card>

      {selectedInquiry && (
         <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Detalle de Consulta: {selectedInquiry.subject}</DialogTitle>
                <DialogDescription>
                    De: {selectedInquiry.name} ({selectedInquiry.email})
                    {selectedInquiry.phone && ` | Tel: ${selectedInquiry.phone}`}
                    {selectedInquiry.clinicName && ` | Clínica: ${selectedInquiry.clinicName}`}
                    <br/>Recibido: {formatDateSafe(selectedInquiry.receivedAt)} | Estado: <Badge variant={getStatusBadgeVariant(selectedInquiry.status)}>{getStatusDisplayName(selectedInquiry.status)}</Badge>
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[50vh] overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{selectedInquiry.fullMessage}</p>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cerrar</Button></DialogClose>
                 <Button onClick={() => alert(`Responder a ${selectedInquiry.email} (simulado)`)}>Responder (Sim.)</Button>
            </DialogFooter>
        </DialogContent>
      )}
    </div>
  );
}
