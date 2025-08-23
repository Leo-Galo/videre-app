
"use client";

import type { NextPage } from 'next';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"; // Added
import { PlusCircle, Eye, Edit, Trash2, UserSearch, MoreHorizontal, FileText, Printer, FileDown, Download, Upload, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo, useRef } from 'react';
import type { Patient } from '@/types/patient'; 
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getPatients, deletePatient } from '@/services/patient-service';

const PatientsPage: NextPage = () => {
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const patientImportInputRef = useRef<HTMLInputElement>(null);
  const [isPatientImportConfirmOpen, setIsPatientImportConfirmOpen] = useState(false); // Added
  const [patientFileToImport, setPatientFileToImport] = useState<File | null>(null); // Added

  useEffect(() => {
    const role = localStorage.getItem('mockUserRole');
    setUserRole(role);
    
    async function loadPatients() {
        setIsLoading(true);
        const fetchedPatients = await getPatients();
        setPatients(fetchedPatients);
        setIsLoading(false);
    }
    loadPatients();
  }, []);

  const isAdmin = userRole === "Admin";

  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
            `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(lowerSearchTerm) ||
            patient.personalId?.toLowerCase().includes(lowerSearchTerm) ||
            patient.email?.toLowerCase().includes(lowerSearchTerm) ||
            patient.phone?.replace(/[\s-]+/g, '').includes(lowerSearchTerm.replace(/[\s-]+/g, ''))
        );
    });
  }, [patients, searchTerm]);


  const handleDeletePatient = async () => {
    if (patientToDelete) {
      const success = await deletePatient(patientToDelete.id);
      if (success) {
        const newPatients = await getPatients(true); // Force refresh cache
        setPatients(newPatients);
        toast({
            title: "Paciente Eliminado",
            description: `El paciente "${patientToDelete.firstName} ${patientToDelete.lastName}" ha sido eliminado.`,
        });
      } else {
         toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo eliminar el paciente.",
        });
      }
      setPatientToDelete(null);
    }
  };

  const handleGenerateCsvReport = () => {
    setIsGeneratingReport(true);
    setTimeout(() => {
      setIsGeneratingReport(false);
      toast({
        title: "Exportación CSV",
        description: `Se ha generado un archivo CSV con ${filteredPatients.length} pacientes.`,
      });
    }, 1500);
  };

  const handlePrintView = () => {
    toast({
      title: "Imprimiendo Vista Actual",
      description: "Se está preparando la vista actual de pacientes para impresión.",
    });
  };

  const handleSaveAsPdf = () => {
    toast({
      title: "Guardando como PDF",
      description: `Se generaría un PDF con ${filteredPatients.length} pacientes.`,
    });
  };
  
  const escapeCsvField = (field: string | number | undefined | null): string => {
    if (field === undefined || field === null) return '';
    const stringField = String(field).trim();
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n') || stringField.includes('\r')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  const handleDownloadPatientImportTemplate = () => {
    const headers = "FirstName,LastName,PersonalID,IdentificationType,DateOfBirth(YYYY-MM-DD),Phone,Email,Address,Occupation,ReferredBy,InsuranceProvider,InsurancePolicyNumber,EmergencyContactName,EmergencyContactPhone,Notes,SphericalOD,CylindricalOD,AxisOD,AdditionOD,SphericalOS,CylindricalOS,AxisOS,AdditionOS,PD\n";
    const exampleRow = "Juan,Perez,109870654,Cédula Física,1990-05-15,88887777,juan.perez@email.com,Calle Ejemplo 123,Ingeniero,Maria Rojas,INS,POL123,Ana Perez,87654321,Notas sobre Juan,-1.00,-0.50,180,,,-1.25,-0.25,005,,62\n";
    const csvContent = "\uFEFF" + headers + exampleRow;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "plantilla_importacion_pacientes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Plantilla de Importación de Pacientes Descargada" });
  };

  const handleImportPatientsClick = () => {
    patientImportInputRef.current?.click();
  };

  const handlePatientFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv') {
        toast({ variant: "destructive", title: "Archivo Inválido", description: "Solo se permiten archivos CSV." });
        event.target.value = "";
        return;
      }
      setPatientFileToImport(file);
      setIsPatientImportConfirmOpen(true);
      event.target.value = ""; 
    }
  };

  const processPatientImportFile = () => {
    if (!patientFileToImport) return;
    // TODO: Implement actual CSV parsing and patient creation via service
    toast({ title: "Importación Simulada", description: `Se procesarían los pacientes del archivo ${patientFileToImport.name}` });
    setPatientFileToImport(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
         <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-56 mb-2" />
              <Skeleton className="h-4 w-72" />
            </div>
             <div className="flex flex-wrap gap-2">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-36" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full md:w-1/2 lg:w-1/3 mb-4" />
             <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {[...Array(5)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-24" /></TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="pt-6 mt-4 border-t flex-wrap gap-2 justify-end">
            <Skeleton className="h-9 w-44" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-44" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <Card className="shadow-lg rounded-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-headline text-primary">Gestión de Pacientes</CardTitle>
            <CardDescription>Administra la información y el historial clínico de tus pacientes.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={handleDownloadPatientImportTemplate} disabled={!isAdmin} className="flex items-center gap-2">
                    <Download className="h-4 w-4" /> Plantilla
                </Button>
              </TooltipTrigger>
              {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
            </Tooltip>
             <input type="file" accept=".csv" ref={patientImportInputRef} onChange={handlePatientFileSelected} className="hidden"/>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={handleImportPatientsClick} disabled={!isAdmin} className="flex items-center gap-2">
                    <Upload className="h-4 w-4" /> Importar
                </Button>
              </TooltipTrigger>
              {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
            </Tooltip>
            <Link href="/dashboard/patients/new" passHref>
                <Button className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Nuevo Paciente
                </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre, cédula, correo o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full md:w-1/2 lg:w-1/3"
              />
            </div>
          </div>
          {filteredPatients.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead className="hidden md:table-cell">Cédula</TableHead>
                    <TableHead className="hidden lg:table-cell">Correo Electrónico</TableHead>
                    <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{`${patient.firstName} ${patient.lastName}`}</TableCell>
                      <TableCell className="hidden md:table-cell">{patient.personalId || 'N/A'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{patient.email || 'N/A'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{patient.phone || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/patients/${patient.id}`} className="flex items-center gap-2 cursor-pointer">
                                <Eye className="h-4 w-4" /> Ver Detalles
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                               <Link href={`/dashboard/patients/${patient.id}/edit`} className="flex items-center gap-2 cursor-pointer">
                                <Edit className="h-4 w-4" /> Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setPatientToDelete(patient)}
                              className="flex items-center gap-2 text-destructive hover:!text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" /> Eliminar
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
            <div className="text-center py-10 text-muted-foreground">
              <p>No se encontraron pacientes con los criterios de búsqueda.</p>
            </div>
          )}
        </CardContent>
        {filteredPatients.length > 0 && (
            <CardFooter className="pt-6 mt-4 border-t flex flex-col sm:flex-row flex-wrap gap-2 justify-end items-center">
                <span className="text-sm text-muted-foreground mr-auto">
                    Mostrando {filteredPatients.length} de {patients.length} pacientes.
                </span>
                <Button variant="outline" onClick={handleGenerateCsvReport} disabled={isGeneratingReport}>
                    <FileDown className="mr-2 h-4 w-4" /> Exportar CSV
                </Button>
                <Button variant="outline" onClick={handlePrintView}>
                    <Printer className="mr-2 h-4 w-4" /> Imprimir Vista
                </Button>
                <Button variant="outline" onClick={handleSaveAsPdf}>
                    <FileDown className="mr-2 h-4 w-4" /> Guardar como PDF
                </Button>
            </CardFooter>
        )}
      </Card>
      <AlertDialog open={patientToDelete !== null} onOpenChange={(open) => !open && setPatientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este paciente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al paciente "{patientToDelete?.firstName} ${patientToDelete?.lastName}" de tus registros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPatientToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePatient} className={cn(buttonVariants({ variant: "destructive" }))}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isPatientImportConfirmOpen} onOpenChange={(open) => { if (!open) setPatientFileToImport(null); setIsPatientImportConfirmOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                ¡Atención! ¿Confirmas la importación?
            </AlertDialogTitle>
            <AlertDialogDescription>
                Estás a punto de importar pacientes desde el archivo "{patientFileToImport?.name}". Esta acción puede tener consecuencias irreversibles.
                <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                    <li>Asegúrate de que el archivo CSV utiliza la <strong>plantilla descargada</strong> para evitar errores de formato.</li>
                    <li>La importación <strong>añadirá nuevos registros</strong>; no actualizará los existentes.</li>
                    <li>Verifica que no estás importando <strong>datos duplicados</strong> para evitar la creación de pacientes repetidos.</li>
                </ul>
                ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPatientFileToImport(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={processPatientImportFile}>Sí, continuar con la importación</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
};

export default PatientsPage;
