
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, Users, ExternalLink, MailPlus, FileDown } from 'lucide-react'; // Added FileDown
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ClinicTenant } from '@/types/superadmin';

// Mock data for clinics (re-using for consistency)
const initialClinicData: ClinicTenant[] = [];

// Mock data for contact inquiries (re-using for consistency)
interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  receivedAt: string; 
  status: 'New' | 'InProgress' | 'Resolved' | 'Archived';
}
const mockInquiries: ContactInquiry[] = [];

interface VidereMarketingContact {
  id: string; 
  name: string;
  email: string;
  source: 'Clínica Registrada' | 'Consulta de Contacto';
  date: string; 
  plan?: string; 
  status?: ClinicTenant['status'] | ContactInquiry['status']; 
  detailsLink?: string; 
}

export default function SuperAdminMarketingDatabasePage() {
  const { toast } = useToast();
  const [marketingContacts, setMarketingContacts] = useState<VidereMarketingContact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const combinedContacts: VidereMarketingContact[] = [];

    initialClinicData.forEach(clinic => {
      combinedContacts.push({
        id: `clinic-${clinic.id}`,
        name: clinic.name,
        email: clinic.adminEmail,
        source: 'Clínica Registrada',
        date: clinic.createdAt,
        plan: clinic.plan,
        status: clinic.status,
        detailsLink: `/superadmin/clinics/${clinic.id}`
      });
    });

    mockInquiries.forEach(inquiry => {
      combinedContacts.push({
        id: `inquiry-${inquiry.id}`,
        name: inquiry.name,
        email: inquiry.email,
        source: 'Consulta de Contacto',
        date: inquiry.receivedAt,
        status: inquiry.status,
        detailsLink: `/superadmin/contact-inquiries` 
      });
    });
    
    combinedContacts.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

    setTimeout(() => {
      setMarketingContacts(combinedContacts);
      setIsLoading(false);
    }, 1200);
  }, []);

  const filteredContacts = useMemo(() => {
    return marketingContacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.plan || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [marketingContacts, searchTerm]);

  const handleSimulateAddToCampaign = (contactName: string) => {
    toast({
      title: "Añadido a Campaña",
      description: `"${contactName}" sería añadido a una campaña de marketing seleccionada.`,
    });
  };

  const handleExportData = () => {
    // TODO: Implement actual CSV generation (e.g., using a library like papaparse or a backend service)
    if (filteredContacts.length === 0) {
      toast({ variant: "destructive", title: "Sin Datos", description: "No hay contactos para exportar con los filtros actuales." });
      return;
    }
    console.log("Exporting Marketing Database (simulated):", filteredContacts);
    toast({
      title: "Exportación CSV Iniciada",
      description: `Se generará un archivo con ${filteredContacts.length} contactos.`,
    });
  };
  
  const formatDateSafe = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try { return format(parseISO(dateString), 'dd MMM, yyyy', { locale: es }); }
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
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <Users className="h-7 w-7" /> Base de Datos de Marketing (Videre)
        </h1>
        <p className="text-muted-foreground">
          Contactos consolidados de clínicas registradas y consultas recibidas para uso de marketing de la plataforma.
        </p>
      </div>

      <Card className="shadow-md rounded-xl">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Listado de Contactos Globales ({filteredContacts.length})</CardTitle>
            <div className="mt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nombre, email, origen o plan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full md:w-72 lg:w-96"
                />
              </div>
            </div>
          </div>
          <Button onClick={handleExportData} variant="outline" className="self-start sm:self-auto">
            <FileDown className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          {filteredContacts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden sm:table-cell">Origen</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="hidden md:table-cell">Plan/Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell>{contact.email}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={contact.source === 'Clínica Registrada' ? 'secondary' : 'outline'}>
                          {contact.source}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateSafe(contact.date)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {contact.plan && <span className="mr-2">Plan: {contact.plan}</span>}
                        {contact.status && <Badge variant="outline">{contact.status as string}</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            {contact.detailsLink && (
                              <DropdownMenuItem asChild>
                                <Link href={contact.detailsLink} className="flex items-center gap-2 cursor-pointer"><ExternalLink className="mr-2 h-4 w-4" /> Ver Detalles</Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleSimulateAddToCampaign(contact.name)}>
                              <MailPlus className="mr-2 h-4 w-4 text-blue-500"/> Añadir a Campaña
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground"><p>No se encontraron contactos con los filtros aplicados.</p></div>
          )}
        </CardContent>
        {filteredContacts.length > 0 && (
            <CardFooter className="border-t pt-4">
                <p className="text-xs text-muted-foreground">Mostrando {filteredContacts.length} de {marketingContacts.length} contactos totales.</p>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
