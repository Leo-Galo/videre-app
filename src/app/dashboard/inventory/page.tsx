
"use client";

import type { NextPage } from 'next';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"; // Added
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Search, MoreHorizontal, Eye, Edit, Replace, Trash2, PackageSearch, Download, Upload, Filter, PackageCheck, PackageX, Repeat, Building, FileText, Printer, FileDown, PackageMinus, CalendarClock, AlertTriangle, Layers } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useRef } from 'react';
import type { Product } from '@/types/pos';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { InventoryAdjustmentDialog } from '@/components/dashboard/inventory/inventory-adjustment-dialog';
import { QuickStockAdjustmentDialog } from '@/components/dashboard/inventory/quick-stock-adjustment-dialog';
import { InventoryTransferDialog, type TransferFormValues as InventoryTransferFormValues } from '@/components/dashboard/inventory/inventory-transfer-dialog';
import { DamageLossAdjustmentDialog } from '@/components/dashboard/inventory/damage-loss-adjustment-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, parseISO, differenceInDays, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { getProducts, getBranches } from '@/services/inventory-service';
import { Input } from '@/components/ui/input';

type StockStatusFilter = "all" | "low" | "out" | "expiring_soon" | "expired";

const InventoryPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkAdjustmentDialogOpen, setIsBulkAdjustmentDialogOpen] = useState(false);
  const [isQuickAdjustmentDialogOpen, setIsQuickAdjustmentDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isDamageLossDialogOpen, setIsDamageLossDialogOpen] = useState(false);
  const [productToAdjustQuickly, setProductToAdjustQuickly] = useState<Product | null>(null);
  const [productForDamageLoss, setProductForDamageLoss] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatusFilter>("all");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const productImportInputRef = useRef<HTMLInputElement>(null);
  const [isProductImportConfirmOpen, setIsProductImportConfirmOpen] = useState(false);
  const [productFileToImport, setProductFileToImport] = useState<File | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('mockUserRole');
    setUserRole(role);

    async function loadData() {
        setIsLoading(true);
        const [fetchedProducts, fetchedBranches] = await Promise.all([getProducts(), getBranches()]);
        setProducts(fetchedProducts);
        setBranches(fetchedBranches);
        setIsLoading(false);
    }

    loadData();
  }, []);

  const isAdmin = userRole === "Admin";

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const searchMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchTerm.toLowerCase());

      if (!searchMatch) return false;

      const branchMatch = selectedBranchId === "all" || product.branchId === selectedBranchId;
      if (!branchMatch) return false;

      if (stockStatusFilter === "all") return true;

      const numericThreshold = typeof product.lowStockThreshold === 'number' ? product.lowStockThreshold : (typeof product.lowStockThreshold === 'string' && product.lowStockThreshold !== '' ? parseInt(product.lowStockThreshold, 10) : 5);

      if (stockStatusFilter === "low") {
        return product.stock > 0 && product.stock <= numericThreshold;
      }
      if (stockStatusFilter === "out") {
        return product.stock === 0;
      }
      if (stockStatusFilter === "expiring_soon" && product.expiryDate) {
        const daysToExpiry = differenceInDays(parseISO(product.expiryDate), new Date());
        return daysToExpiry >= 0 && daysToExpiry <= 90; // Example: expiring in next 90 days
      }
      if (stockStatusFilter === "expired" && product.expiryDate) {
        return isPast(parseISO(product.expiryDate));
      }
      return true;
    });
  }, [products, searchTerm, stockStatusFilter, selectedBranchId]);

  const getStockBadgeVariant = (stock: number, threshold?: number | '') => {
    if (stock === 0) return "destructive";
    const numericThreshold = typeof threshold === 'number' ? threshold : (typeof threshold === 'string' && threshold !== '' ? parseInt(threshold, 10) : 5);
    if (stock <= numericThreshold) return "secondary";
    return "default";
  };
  
  const escapeCsvField = (field: string | number | undefined | null): string => {
    if (field === undefined || field === null) return '';
    const stringField = String(field).trim();
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n') || stringField.includes('\r')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  const handleDownloadTemplate = () => {
    const headers = "SKU,NombreProducto,StockSistema,StockFisico,Sucursal\n";
    const csvRows = products.map(p =>
      [
        escapeCsvField(p.sku),
        escapeCsvField(p.name),
        escapeCsvField(p.stock),
        escapeCsvField(null), 
        escapeCsvField(p.branchName)
      ].join(",")
    );
    const csvContent = headers + csvRows.join("\n");
    const bom = "\uFEFF"; 

    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "plantilla_conteo_inventario.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
     toast({ title: "Plantilla Descargada", description: "plantilla_conteo_inventario.csv ha sido descargada."});
  };

  const handleDeleteProduct = () => {
    if (productToDelete) {
      setProducts(prevProducts => prevProducts.filter(p => p.id !== productToDelete.id));
      toast({
        title: "Producto Eliminado (Simulado)",
        description: `El producto "${productToDelete.name}" ha sido eliminado.`,
      });
      setProductToDelete(null);
    }
  };

  const handleQuickAdjustStock = (productId: string, newStock: number, reason: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (isAdmin) {
        setProducts(prev => prev.map(p => p.id === productId ? {...p, stock: newStock} : p));
        toast({
          title: "Stock Ajustado por Admin",
          description: `Stock para "${product.name}" ajustado a ${newStock}. Motivo: ${reason}.`
        });
    } else {
        console.log(`AUDIT REQUEST: Quick Stock Adjustment by ${userRole} - ProductID: ${productId}, New Stock: ${newStock}, Reason: ${reason}`);
        toast({
          title: "Solicitud de Ajuste Enviada",
          description: `La solicitud para ajustar el stock de "${product.name}" ha sido enviada para aprobación del administrador.`
        });
    }
  };

  const handleOpenDamageLossDialog = (product: Product) => {
    setProductForDamageLoss(product);
    setIsDamageLossDialogOpen(true);
  };

  const handleConfirmDamageLossAdjustment = (productId: string, quantityToRemove: number, reason: string, notes: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (isAdmin) {
        setProducts(prev => prev.map(p => p.id === productId ? {...p, stock: p.stock - quantityToRemove} : p));
        toast({
          title: "Baja de Inventario Registrada por Admin",
          description: `Se dieron de baja ${quantityToRemove} unidades de "${product.name}". Motivo: ${reason}.`
        });
        console.log(`AUDIT (APPROVED BY ADMIN): Damage/Loss - Product ID: ${productId}, Quantity: ${quantityToRemove}, Reason: ${reason}, Notes: ${notes}`);
    } else {
        console.log(`AUDIT REQUEST: Damage/Loss by ${userRole} - Product ID: ${productId}, Quantity: ${quantityToRemove}, Reason: ${reason}, Notes: ${notes}`);
        toast({
          title: "Solicitud de Baja Enviada",
          description: `La solicitud para dar de baja ${quantityToRemove} unidades de "${product.name}" ha sido enviada para aprobación del administrador.`
        });
    }
  };

  const handleProcessTransfer = (transferData: InventoryTransferFormValues) => {
    let tempProductsState = [...products];
    const targetBranch = branches.find(b => b.id === transferData.toBranchId);

    transferData.items.forEach(item => {
      const originProductIndex = tempProductsState.findIndex(p => p.id === item.productId && p.branchId === transferData.fromBranchId);
      if (originProductIndex !== -1) {
        tempProductsState[originProductIndex].stock -= item.quantity;
      }
      const destProductOriginalDetails = tempProductsState.find(p => p.sku === tempProductsState[originProductIndex]?.sku && p.branchId !== transferData.fromBranchId) || tempProductsState[originProductIndex];
      const destProductIndex = tempProductsState.findIndex(p => p.sku === destProductOriginalDetails.sku && p.branchId === transferData.toBranchId);

      if (destProductIndex !== -1) {
        tempProductsState[destProductIndex].stock += item.quantity;
      } else {
        const newProductInDest: Product = {
          ...destProductOriginalDetails,
          id: `prod-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          branchId: transferData.toBranchId,
          branchName: targetBranch?.name || 'Desconocida',
          stock: item.quantity,
        };
        tempProductsState.push(newProductInDest);
      }
    });

    setProducts(tempProductsState);

    toast({
      title: "Traslado Procesado",
      description: `El stock ha sido actualizado en la vista. Motivo: ${transferData.notes || 'Traslado Interno'}.`,
    });
  };

  const handleGenerateCsvReport = () => {
    setIsGeneratingReport(true);
    setTimeout(() => {
      setIsGeneratingReport(false);
      toast({
        title: "Exportación CSV",
        description: `Se ha generado un archivo CSV con ${filteredProducts.length} productos.`,
      });
    }, 1500);
  };

  const handlePrintView = () => {
    toast({
      title: "Imprimiendo Vista Actual",
      description: "Se está preparando la vista actual del inventario para impresión. En una app real, se abriría el diálogo de impresión del navegador.",
    });
  };

  const handleSaveAsPdf = () => {
    toast({
      title: "Guardando como PDF",
      description: `Se generaría un PDF con ${filteredProducts.length} productos. En una app real, se descargaría el archivo.`,
    });
  };

  const formatCurrencyCRC = (amount: number) => {
    return `¢${new Intl.NumberFormat('es-CR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
  };
  
  const formatDateSafe = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return format(parseISO(dateString), 'dd/MM/yy', { locale: es });
    } catch (e) { return null; }
  };

  const handleDownloadProductImportTemplate = () => {
    const headers = "SKU,Name,Category,Description,Price,CostPrice,Stock,Supplier,LowStockThreshold,BranchName,ExpiryDate(YYYY-MM-DD),ImageURL,DataAIHint\n";
    const exampleRow = "SKU-EJEMPLO,Armazón de Prueba,Armazones Oftálmicos,Descripción detallada,50000,25000,10,Proveedor Ejemplo,5,Sucursal Central,2026-12-31,https://placehold.co/64x64.png,eyeglass modern\n";
    const csvContent = "\uFEFF" + headers + exampleRow;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "plantilla_importacion_productos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Plantilla de Importación Descargada" });
  };

  const handleImportProductsClick = () => {
    productImportInputRef.current?.click();
  };

  const handleProductFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv') {
        toast({ variant: "destructive", title: "Archivo Inválido", description: "Solo se permiten archivos CSV." });
        event.target.value = ""; // Reset file input
        return;
      }
      setProductFileToImport(file);
      setIsProductImportConfirmOpen(true);
      event.target.value = ""; // Reset file input immediately after storing file
    }
  };

  const processProductImportFile = () => {
    if (!productFileToImport) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvData = e.target?.result as string;
      const rows = csvData.split('\n').map(row => row.trim()).filter(row => row);
      if (rows.length < 2) {
        toast({ variant: "destructive", title: "Error en CSV", description: "El archivo CSV está vacío o solo tiene encabezados." });
        return;
      }
      
      const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
      const expectedHeaders = ["sku", "name", "category", "description", "price", "costprice", "stock", "supplier", "lowstockthreshold", "branchname", "expirydate", "imageurl", "dataaihint"];
      const missingHeaders = expectedHeaders.filter(eh => !headers.includes(eh));
      if (missingHeaders.length > 0 && !expectedHeaders.every(eh => headers.includes(eh))) { 
          const requiredForImport = ["firstname", "lastname"];
          const criticalMissing = requiredForImport.filter(rh => !headers.includes(rh));
          if (criticalMissing.length > 0) {
            toast({variant: "destructive", title: "Error en Encabezados CSV", description: `Faltan encabezados requeridos: ${criticalMissing.join(', ')}. Por favor, usa la plantilla.`});
            return;
          }
      }
      
      const importedProducts: Product[] = [];
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(',');
        const productData: any = {};
        headers.forEach((header, index) => {
          productData[header.replace(/\s+/g, '').toLowerCase()] = values[index]?.trim() || '';
        });

        const branch = branches.find(b => b.name.toLowerCase() === (productData.branchname || '').toLowerCase());

        importedProducts.push({
          id: `imported-${Date.now()}-${i}`,
          sku: productData.sku,
          name: productData.name,
          category: productData.category,
          description: productData.description,
          price: parseFloat(productData.price) || 0,
          costPrice: parseFloat(productData.costprice) || undefined,
          stock: parseInt(productData.stock, 10) || 0,
          supplier: productData.supplier,
          lowStockThreshold: parseInt(productData.lowstockthreshold, 10) || undefined,
          branchId: branch?.id,
          branchName: productData.branchname,
          expiryDate: productData.expirydate || undefined,
          imageUrl: productData.imageurl || 'https://placehold.co/64x64.png',
          dataAiHint: productData.dataaihint,
          ivaRate: 0.13, // Default IVA rate
        });
      }
      
      setProducts(prev => [...prev, ...importedProducts]);
      toast({ title: "Importación Completa", description: `${importedProducts.length} productos procesados del CSV.` });
    };
    reader.onerror = () => {
      toast({ variant: "destructive", title: "Error de Lectura", description: "No se pudo leer el archivo." });
    };
    reader.readAsText(productFileToImport);
    setProductFileToImport(null);
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-64 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-10 w-44" />
            </div>
          </CardHeader>
          <CardContent>
             <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
              <Skeleton className="h-10 w-full md:w-1/3 lg:w-1/4" />
              <Skeleton className="h-10 w-full md:w-1/2 lg:w-1/3" />
              <div className="flex space-x-2">
                <Skeleton className="h-9 w-20" /> <Skeleton className="h-9 w-20" /> <Skeleton className="h-9 w-20" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {[...Array(9)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-20" /></TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-20 mt-1" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell className="hidden xl:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell className="hidden xl:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
             <CardFooter className="pt-6 mt-4 border-t flex-wrap gap-2 justify-end">
                <Skeleton className="h-9 w-44" />
                <Skeleton className="h-9 w-36" />
                <Skeleton className="h-9 w-44" />
            </CardFooter>
          </CardContent>
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
            <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
              <PackageSearch className="h-6 w-6" /> Gestión de Inventario
            </CardTitle>
            <CardDescription>Visualiza y administra el stock de tus productos por sucursal.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/dashboard/inventory/new" passHref legacyBehavior>
                  <a className={cn(!isAdmin && "pointer-events-none")}>
                    <Button className="flex items-center gap-2" disabled={!isAdmin}>
                      <PlusCircle className="h-5 w-5" /> Añadir Producto
                    </Button>
                  </a>
                </Link>
              </TooltipTrigger>
              {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
           <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-center flex-wrap">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Building className="h-5 w-5 text-muted-foreground"/>
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Todas las sucursales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Sucursales</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-full md:w-auto md:flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre, SKU o categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Button variant={stockStatusFilter === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setStockStatusFilter('all')}>Todos</Button>
                <Button variant={stockStatusFilter === 'low' ? 'secondary' : 'ghost'} size="sm" onClick={() => setStockStatusFilter('low')} className="flex items-center gap-1">
                    <PackageCheck className="h-4 w-4 text-yellow-500"/> Stock Bajo
                </Button>
                <Button variant={stockStatusFilter === 'out' ? 'secondary' : 'ghost'} size="sm" onClick={() => setStockStatusFilter('out')} className="flex items-center gap-1">
                    <PackageX className="h-4 w-4 text-red-500"/> Agotados
                </Button>
                <Button variant={stockStatusFilter === 'expiring_soon' ? 'secondary' : 'ghost'} size="sm" onClick={() => setStockStatusFilter('expiring_soon')} className="flex items-center gap-1">
                    <CalendarClock className="h-4 w-4 text-orange-500"/> Vence Pronto
                </Button>
                 <Button variant={stockStatusFilter === 'expired' ? 'secondary' : 'ghost'} size="sm" onClick={() => setStockStatusFilter('expired')} className="flex items-center gap-1">
                    <CalendarClock className="h-4 w-4 text-red-600"/> Vencidos
                </Button>
            </div>
          </div>
          {filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Imagen</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">SKU</TableHead>
                    <TableHead className="hidden lg:table-cell">Categoría</TableHead>
                    <TableHead className="hidden xl:table-cell">Sucursal</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">F. Caducidad</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const formattedExpiryDate = formatDateSafe(product.expiryDate);
                    const isProductExpired = product.expiryDate && isPast(parseISO(product.expiryDate));
                    return (
                    <TableRow key={product.id} className={isProductExpired ? 'bg-destructive/10 hover:bg-destructive/20' : ''}>
                      <TableCell>
                        <div className="w-12 h-12 relative rounded-md overflow-hidden border bg-muted/30">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill={true}
                            style={{objectFit: 'contain'}}
                            data-ai-hint={product.dataAiHint || 'product image'}
                            sizes="(max-width: 768px) 10vw, (max-width: 1200px) 5vw, 3vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <PackageSearch size={20} />
                          </div>
                        )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground hidden sm:block">{product.description?.substring(0,50) || ''}...</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{product.sku || 'N/A'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{product.category}</TableCell>
                      <TableCell className="hidden xl:table-cell">{product.branchName || 'N/A'}</TableCell>
                       <TableCell className={`text-center hidden sm:table-cell text-xs ${isProductExpired ? 'text-red-600 font-bold' : ''}`}>
                        {formattedExpiryDate || 'N/A'}
                        {isProductExpired && ' (Vencido)'}
                       </TableCell>
                      <TableCell className="text-right">{formatCurrencyCRC(product.price)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStockBadgeVariant(product.stock, product.lowStockThreshold)}>
                          {product.stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/inventory/${product.id}`} className="flex items-center gap-2 cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                              </Link>
                            </DropdownMenuItem>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link href={`/dashboard/inventory/${product.id}/edit`} passHref legacyBehavior>
                                  <DropdownMenuItem asChild disabled={!isAdmin} onSelect={(e) => !isAdmin && e.preventDefault()}>
                                    <a className={cn("flex items-center gap-2 cursor-pointer", !isAdmin && "text-muted-foreground cursor-not-allowed")}>
                                      <Edit className="mr-2 h-4 w-4" /> Editar Producto
                                    </a>
                                  </DropdownMenuItem>
                                </Link>
                              </TooltipTrigger>
                              {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
                            </Tooltip>
                             <DropdownMenuItem onClick={() => { setProductToAdjustQuickly(product); setIsQuickAdjustmentDialogOpen(true); }}>
                              <Replace className="mr-2 h-4 w-4" /> {isAdmin ? 'Ajuste Rápido de Stock' : 'Solicitar Ajuste'}
                            </DropdownMenuItem>
                             <DropdownMenuItem onSelect={() => handleOpenDamageLossDialog(product)}>
                                <PackageMinus className="mr-2 h-4 w-4"/> {isAdmin ? 'Registrar Baja/Pérdida' : 'Solicitar Baja'}
                            </DropdownMenuItem>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuItem
                                        onSelect={(e) => { if (!isAdmin) e.preventDefault(); else setIsTransferDialogOpen(true);}}
                                        disabled={!isAdmin}
                                        className={cn(!isAdmin && "text-muted-foreground cursor-not-allowed")}
                                    >
                                        <Repeat className="mr-2 h-4 w-4" /> Iniciar Traslado
                                    </DropdownMenuItem>
                                </TooltipTrigger>
                                {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
                             </Tooltip>
                            <DropdownMenuSeparator />
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuItem
                                        className={cn("text-destructive hover:!text-destructive focus:text-destructive focus:bg-destructive/10", !isAdmin && "text-muted-foreground hover:!text-muted-foreground focus:text-muted-foreground focus:bg-transparent cursor-not-allowed")}
                                        onSelect={(e) => { if (!isAdmin) e.preventDefault(); else setProductToDelete(product);}}
                                        disabled={!isAdmin}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                    </DropdownMenuItem>
                                </TooltipTrigger>
                                {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
                            </Tooltip>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );})}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <PackageSearch size={48} className="mx-auto mb-2" />
              <p>No se encontraron productos con los criterios de búsqueda, sucursal o filtro aplicado.</p>
              {products.length === 0 && !searchTerm && stockStatusFilter === 'all' && selectedBranchId === 'all' && <p>Aún no has añadido ningún producto a tu inventario.</p>}
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-6 mt-4 border-t flex flex-col sm:flex-row flex-wrap gap-2 justify-between items-center">
            <div className="flex flex-wrap gap-2 self-start">
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" onClick={() => setIsBulkAdjustmentDialogOpen(true)} disabled={!isAdmin} className="flex items-center gap-2">
                            <Upload className="h-4 w-4" /> Ajuste Masivo (Conteo)
                        </Button>
                    </TooltipTrigger>
                    {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" onClick={handleDownloadProductImportTemplate} disabled={!isAdmin} className="flex items-center gap-2">
                            <Download className="h-4 w-4" /> Plantilla (Import.)
                        </Button>
                    </TooltipTrigger>
                    {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
                </Tooltip>
                <input type="file" accept=".csv" ref={productImportInputRef} onChange={handleProductFileSelected} className="hidden"/>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" onClick={handleImportProductsClick} disabled={!isAdmin} className="flex items-center gap-2">
                            <Upload className="h-4 w-4" /> Importar Productos (CSV)
                        </Button>
                    </TooltipTrigger>
                    {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador</p></TooltipContent>}
                </Tooltip>
            </div>
            <div className="flex flex-wrap gap-2 self-end">
                <Button variant="outline" onClick={handleGenerateCsvReport} disabled={isGeneratingReport}>
                    <FileDown className="mr-2 h-4 w-4" /> Exportar CSV
                </Button>
                <Button variant="outline" onClick={handlePrintView}>
                    <Printer className="mr-2 h-4 w-4" /> Imprimir Vista
                </Button>
            </div>
        </CardFooter>
      </Card>
      
      <InventoryAdjustmentDialog
        isOpen={isBulkAdjustmentDialogOpen}
        onOpenChange={setIsBulkAdjustmentDialogOpen}
        currentProducts={products}
      />
      <QuickStockAdjustmentDialog
        isOpen={isQuickAdjustmentDialogOpen}
        onOpenChange={setIsQuickAdjustmentDialogOpen}
        product={productToAdjustQuickly}
        onStockAdjusted={handleQuickAdjustStock}
        isAdmin={isAdmin}
      />
      <InventoryTransferDialog
        isOpen={isTransferDialogOpen}
        onOpenChange={setIsTransferDialogOpen}
        allProducts={products} 
        branches={branches}
        onTransferProcessed={handleProcessTransfer}
      />
      <DamageLossAdjustmentDialog
        isOpen={isDamageLossDialogOpen}
        onOpenChange={setIsDamageLossDialogOpen}
        product={productForDamageLoss}
        onAdjust={handleConfirmDamageLossAdjustment}
        isAdmin={isAdmin}
      />
       <AlertDialog open={productToDelete !== null} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el producto "{productToDelete?.name}" de tus registros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className={cn(buttonVariants({ variant: "destructive" }))}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
       <AlertDialog open={isProductImportConfirmOpen} onOpenChange={(open) => { if (!open) setProductFileToImport(null); setIsProductImportConfirmOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
             <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                ¡Atención! ¿Confirmas la importación?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de importar productos desde el archivo "{productFileToImport?.name}". Esta acción puede tener consecuencias irreversibles.
              <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                <li>Asegúrate de que el archivo CSV utiliza la <strong>plantilla descargada</strong>.</li>
                <li>La importación <strong>añadirá nuevos productos</strong>, no actualizará existentes.</li>
                <li>Verifica los SKUs para no importar <strong>productos duplicados</strong>.</li>
              </ul>
              ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductFileToImport(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={processProductImportFile}>Sí, continuar con la importación</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
};

export default InventoryPage;
