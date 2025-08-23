
"use client";

import type { NextPage } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import type { Supplier, SupplierMovement, SupplierMovementItem } from '@/types/supplier';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Edit, Landmark, Phone, Mail, MapPin, StickyNote, PackagePlus, ArrowRightLeft, ShoppingBag, TrendingUp, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { SupplierReceiptDialog } from '@/components/dashboard/suppliers/supplier-receipt-dialog';
import type { Product } from '@/types/pos';
import { getProducts } from '@/services/inventory-service';
import { getSupplierById, addSupplierMovement } from '@/services/supplier-service';

const SupplierDetailPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const supplierId = params.supplierId as string;
  
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [movements, setMovements] = useState<SupplierMovement[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);


  useEffect(() => {
    if (supplierId) {
      setIsLoading(true);
      const plan = localStorage.getItem('subscriptionPlan');
      setUserPlan(plan ? plan.toLowerCase() : 'basic');
      
      Promise.all([
        getSupplierById(supplierId),
        getProducts(), // Load all products for the dialog
      ]).then(([supplierData, productData]) => {
        if (supplierData) {
          setSupplier(supplierData);
          setAllProducts(productData);
          setMovements(supplierData.movements?.sort((a,b) => parseISO(b.date).getTime() - new Date(a.date).getTime()) || []);
          setTopProducts([]); // Clear mock data
        }
        setIsLoading(false);
      }).catch(error => {
        console.error("Error loading supplier details:", error);
        setIsLoading(false);
      });
    }
  }, [supplierId]);

  const handleReceiptProcessed = async (receiptData: { items: { productId: string; quantity: number; costPrice: number }[]; referenceDocument?: string; date: Date; }) => {
    if (!supplier) return;
    
    const success = await addSupplierMovement(supplier.id, {
        type: 'receipt',
        ...receiptData
    });
    
    if(success) {
        const updatedSupplier = await getSupplierById(supplier.id);
        if (updatedSupplier) {
            setSupplier(updatedSupplier);
            setMovements(updatedSupplier.movements?.sort((a,b) => parseISO(b.date).getTime() - new Date(a.date).getTime()) || []);
        }
        toast({
          title: "Ingreso de Mercadería Registrado (Simulado)",
          description: `Se han añadido ${receiptData.items.length} producto(s) al inventario.`
        });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo registrar el ingreso.' });
    }
  };

  const formatDateSafe = (dateString?: string, dateFormat: string = 'dd MMM, yyyy') => {
    if (!dateString) return 'N/A';
    try { return format(parseISO(dateString), dateFormat, { locale: es }); } 
    catch (e) { return 'Fecha Inválida'; }
  };
  
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return 'N/A';
    return `¢${new Intl.NumberFormat('es-CR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
  };


  if (isLoading || !userPlan) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-10">
        <Landmark className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Proveedor no encontrado</h2>
        <p className="text-muted-foreground mb-6">No pudimos encontrar los detalles del proveedor que buscas.</p>
        <Link href="/dashboard/suppliers" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Listado
          </Button>
        </Link>
      </div>
    );
  }
  
  const isPremiumPlan = userPlan === 'premium';
  const canManageMovements = isPremiumPlan;

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link href="/dashboard/suppliers" passHref>
            <Button variant="outline" className="flex items-center gap-2 self-start sm:self-center">
                <ArrowLeft className="h-4 w-4" />Volver al Listado
            </Button>
        </Link>
        <div className="flex flex-wrap gap-2 self-end sm:self-center">
            {canManageMovements && (
                <Button onClick={() => setIsReceiptDialogOpen(true)}>
                    <PackagePlus className="mr-2 h-4 w-4" /> Registrar Ingreso de Mercadería
                </Button>
            )}
            <Link href={`/dashboard/suppliers/${supplier.id}/edit`} passHref>
                <Button variant="default" className="flex items-center gap-2">
                    <Edit className="mr-2 h-4 w-4" /> Editar Proveedor
                </Button>
            </Link>
        </div>
      </div>

      <Card className="shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="bg-muted/30 p-6">
            <CardTitle className="text-3xl font-headline text-primary flex items-center gap-3">
                <Landmark className="h-8 w-8" />{supplier.name}
            </CardTitle>
            <CardDescription className="text-md">ID Proveedor: {supplier.id}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
            <section>
                <h3 className="text-xl font-semibold text-primary mb-3">Información de Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                    {supplier.contactName && <div><strong className="block text-muted-foreground">Contacto:</strong> {supplier.contactName}</div>}
                    {supplier.phone && <div><strong className="block text-muted-foreground">Teléfono:</strong> <a href={`tel:${supplier.phone}`} className="text-primary hover:underline">{supplier.phone}</a></div>}
                    {supplier.email && <div><strong className="block text-muted-foreground">Email:</strong> <a href={`mailto:${supplier.email}`} className="text-primary hover:underline">{supplier.email}</a></div>}
                    {supplier.address && <div className="md:col-span-2"><strong className="block text-muted-foreground">Dirección:</strong> {supplier.address}</div>}
                </div>
                 {supplier.notes && <div className="mt-4"><h4 className="font-semibold flex items-center gap-2"><StickyNote className="h-4 w-4"/>Notas:</h4><p className="text-sm text-foreground/80 whitespace-pre-wrap p-3 bg-muted/20 rounded-md border mt-1">{supplier.notes}</p></div>}
            </section>
            
            {canManageMovements ? (
                <>
                <Separator />
                <section>
                    <h3 className="text-xl font-semibold text-primary mb-3">Movimientos de Mercadería</h3>
                    {movements.length > 0 ? (
                        <div className="overflow-x-auto border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Ítems</TableHead>
                                        <TableHead>Ref.</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {movements.map(mov => (
                                        <TableRow key={mov.id}>
                                            <TableCell className="text-xs">{formatDateSafe(mov.date)}</TableCell>
                                            <TableCell><Badge variant={mov.type === 'receipt' ? 'default' : 'destructive'} className={cn(mov.type === 'receipt' && 'bg-green-600')}>{mov.type === 'receipt' ? 'Ingreso' : 'Devolución'}</Badge></TableCell>
                                            <TableCell className="text-xs">{mov.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}</TableCell>
                                            <TableCell>{mov.referenceDocument || 'N/A'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No hay movimientos registrados para este proveedor.</p>
                    )}
                </section>
                <Separator />
                <section>
                    <h3 className="text-xl font-semibold text-primary mb-3">Productos Más Comprados (Top 5 Simulado)</h3>
                    {topProducts.length > 0 ? (
                         <div className="overflow-x-auto border rounded-md">
                            <Table>
                                <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead className="text-center">Cant. Total</TableHead><TableHead className="text-right">Costo Total (¢)</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {topProducts.map(p => (
                                        <TableRow key={p.productId}><TableCell>{p.productName}</TableCell><TableCell className="text-center">{p.totalQuantity}</TableCell><TableCell className="text-right">{formatCurrency(p.totalCost)}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No hay historial de compras para mostrar.</p>
                    )}
                </section>
                </>
            ) : (
                 <Card className="mt-6 border-dashed border-primary/50 bg-primary/5">
                    <CardHeader className="text-center">
                        <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
                        <CardTitle className="text-xl">Desbloquea la Gestión Completa</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-muted-foreground mb-4">
                            Registra ingresos de mercadería, gestiona devoluciones y obtén reportes detallados de compras por proveedor con el Plan Premium.
                        </p>
                        <Button asChild className="bg-primary hover:bg-primary/90">
                            <Link href="/dashboard/subscription">Actualizar a Premium</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

        </CardContent>
      </Card>
      
      {canManageMovements && (
        <SupplierReceiptDialog 
            isOpen={isReceiptDialogOpen}
            onOpenChange={setIsReceiptDialogOpen}
            supplier={supplier}
            allProducts={allProducts}
            onReceiptProcessed={handleReceiptProcessed}
        />
      )}
    </div>
  );
};

export default SupplierDetailPage;
