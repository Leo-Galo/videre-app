
"use client";

import type { NextPage } from 'next';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle, Search, MoreHorizontal, Eye, Edit, Trash2, Landmark, Sparkles, Download, Upload, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo, useRef } from 'react';
import type { Supplier } from '@/types/supplier';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getSuppliers, deleteSupplier, addSupplier } from '@/services/supplier-service';

const SuppliersPage: NextPage = () => {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isSupplierImportConfirmOpen, setIsSupplierImportConfirmOpen] = useState(false);
  const [supplierFileToImport, setSupplierFileToImport] = useState<File | null>(null);
  const supplierImportInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const plan = localStorage.getItem('subscriptionPlan');
    setUserPlan(plan ? plan.toLowerCase() : 'basic');
    const role = localStorage.getItem('mockUserRole');
    setUserRole(role);
    
    async function loadSuppliers() {
        setIsLoading(true);
        const fetchedSuppliers = await getSuppliers();
        setSuppliers(fetchedSuppliers);
        setIsLoading(false);
    }

    loadSuppliers();
  }, []);

  const isAdmin = userRole === "Admin";
  const canAccessPage = userPlan === 'pro' || userPlan === 'premium';

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.contactName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suppliers, searchTerm]);

  const handleDeleteSupplier = async () => {
    if (supplierToDelete) {
      const success = await deleteSupplier(supplierToDelete.id);
      if(success) {
        setSuppliers(prev => prev.filter(s => s.id !== supplierToDelete.id));
        toast({
          title: "Proveedor Eliminado",
          description: `El proveedor "${supplierToDelete.name}" ha sido eliminado.`,
        });
      } else {
        toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el proveedor." });
      }
      setSupplierToDelete(null);
    }
  };

  const handleDownloadSupplierImportTemplate = () => {
    const headers = "Name,ContactName,Email,Phone,Address,Notes\n";
    const exampleRow = "OptiGlobal S.A.,Juan Solis,juan@optiglobal.com,2222-3333,Zona Franca,Entrega los lunes\n";
    const csvContent = "\uFEFF" + headers + exampleRow;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "plantilla_importacion_proveedores.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Plantilla de Importación de Proveedores Descargada" });
  };

  const handleImportSuppliersClick = () => {
    supplierImportInputRef.current?.click();
  };

  const handleSupplierFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv') {
        toast({ variant: "destructive", title: "Archivo Inválido", description: "Solo se permiten archivos CSV." });
        event.target.value = "";
        return;
      }
      setSupplierFileToImport(file);
      setIsSupplierImportConfirmOpen(true);
      event.target.value = "";
    }
  };

  const processSupplierImportFile = async () => {
    if (!supplierFileToImport) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvData = e.target?.result as string;
      const rows = csvData.split('\n').slice(1);
      const importedSuppliers: Omit<Supplier, 'id' | 'createdAt'>[] = [];
      rows.forEach((row, index) => {
        const columns = row.split(',');
        if (columns.length >= 1 && columns[0]?.trim()) {
          importedSuppliers.push({
            name: columns[0]?.trim() || `Proveedor Importado ${index + 1}`,
            contactName: columns[1]?.trim() || undefined,
            email: columns[2]?.trim() || undefined,
            phone: columns[3]?.trim() || undefined,
            address: columns[4]?.trim() || undefined,
            notes: columns[5]?.trim() || undefined,
          });
        }
      });
      
      let successCount = 0;
      for (const supData of importedSuppliers) {
        const newSupplier = await addSupplier(supData);
        if (newSupplier) successCount++;
      }

      const fetchedSuppliers = await getSuppliers(true); // Force refresh
      setSuppliers(fetchedSuppliers);

      toast({ title: "Importación de Proveedores Completa", description: `${successCount} de ${importedSuppliers.length} proveedores procesados.` });
    };
    reader.readAsText(supplierFileToImport);
    setSupplierFileToImport(null);
  };

  if (isLoading) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  if (!canAccessPage) {
    return (
      <Card className="shadow-lg rounded-xl border-dashed border-primary/50 bg-primary/5">
        <CardHeader className="text-center">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-3" />
          <CardTitle className="text-2xl">Gestión de Proveedores</CardTitle>
          <CardDescription className="text-lg">Esta es una funcionalidad de los planes Pro y Premium.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            Administra tus proveedores y sus contactos para agilizar tus compras. Actualiza a Pro para acceder al listado, o a Premium para control total de movimientos.
          </p>
          <Button asChild size="lg"><Link href="/dashboard/subscription">Actualizar a Pro/Premium</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
                <Landmark className="h-6 w-6" /> Gestión de Proveedores
              </CardTitle>
              <CardDescription>Administra la información de contacto y el historial de tus proveedores.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={handleDownloadSupplierImportTemplate} disabled={!isAdmin} className="flex items-center gap-2">
                    <Download className="h-4 w-4" /> Plantilla
                  </Button>
                </TooltipTrigger>
                {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
              </Tooltip>
              <input type="file" accept=".csv" ref={supplierImportInputRef} onChange={handleSupplierFileSelected} className="hidden" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={handleImportSuppliersClick} disabled={!isAdmin} className="flex items-center gap-2">
                    <Upload className="h-4 w-4" /> Importar
                  </Button>
                </TooltipTrigger>
                {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
              </Tooltip>
              <Link href="/dashboard/suppliers/new" passHref>
                <Button className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5" /> Añadir Proveedor
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative w-full md:w-1/2 lg:w-1/3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nombre, contacto o correo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Proveedor</TableHead>
                    <TableHead className="hidden md:table-cell">Contacto Principal</TableHead>
                    <TableHead className="hidden lg:table-cell">Correo</TableHead>
                    <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{supplier.contactName || 'N/A'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{supplier.email || 'N/A'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{supplier.phone || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/suppliers/${supplier.id}`}><Eye className="mr-2 h-4 w-4" /> Ver Detalles</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/suppliers/${supplier.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Editar</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setSupplierToDelete(supplier)}
                              className="text-destructive hover:!text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
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
        
        <AlertDialog open={supplierToDelete !== null} onOpenChange={(open) => !open && setSupplierToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que quieres eliminar al proveedor "{supplierToDelete?.name}"? Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSupplier} className={cn(buttonVariants({ variant: "destructive" }))}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isSupplierImportConfirmOpen} onOpenChange={(open) => { if (!open) setSupplierFileToImport(null); setIsSupplierImportConfirmOpen(open); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-yellow-500" />
                  ¡Atención! ¿Confirmas la importación?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Estás a punto de importar proveedores desde el archivo "{supplierFileToImport?.name}". Esta acción puede tener consecuencias irreversibles.
                <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                  <li>Asegúrate de que el archivo CSV utiliza la <strong>plantilla descargada</strong>.</li>
                  <li>La importación <strong>añadirá nuevos proveedores</strong>, no actualizará existentes.</li>
                  <li>Verifica que no estás importando <strong>datos duplicados</strong>.</li>
                </ul>
                ¿Deseas continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSupplierFileToImport(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={processSupplierImportFile}>Sí, continuar con la importación</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </TooltipProvider>
  );
};

export default SuppliersPage;
