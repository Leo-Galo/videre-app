
"use client";

import type { NextPage } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Product } from '@/types/pos';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Edit, PackageSearch,DollarSign, Hash, Layers, ShoppingCart, AlertTriangle, Info, Image as ImageIcon, Tag, GitBranch, Building, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO, isPast, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getTagConfig } from '@/config/discounts';
import { getProductById } from '@/services/inventory-service';


const formatCurrencyCRC = (amount: number) => {
    return `¢${new Intl.NumberFormat('es-CR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
};

const formatDateSafe = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'dd MMMM, yyyy', { locale: es });
    } catch (e) {
      return 'Fecha Inválida';
    }
};

const ProductDetailPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      setIsLoading(true);
      getProductById(productId).then(foundProduct => {
        setProduct(foundProduct || null);
        setIsLoading(false);
      });
    }
  }, [productId]);

  const getStockBadgeVariant = (stock: number, threshold?: number | string) => {
    if (stock === 0) return "destructive";
    const numericThreshold = typeof threshold === 'number' ? threshold : (typeof threshold === 'string' && threshold !== '' ? parseInt(threshold, 10) : undefined);
    if (numericThreshold !== undefined && !isNaN(numericThreshold) && stock <= numericThreshold) return "secondary"; 
    return "default"; 
  };

  const isExpired = product?.expiryDate ? isPast(parseISO(product.expiryDate)) : false;
  const daysToExpiry = product?.expiryDate ? differenceInDays(parseISO(product.expiryDate), new Date()) : null;
  const isNearExpiry = daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry <= 30;

  const tagConfig = product?.tag ? getTagConfig(product.tag) : null;


  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-56 mb-6" />
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-3/4 md:w-96" />
              <Skeleton className="h-5 w-1/2 md:w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </CardHeader>
          <CardContent className="p-6 grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <Skeleton className="aspect-square w-full rounded-lg" />
            </div>
            <div className="md:col-span-2 space-y-6">
              {[...Array(7)].map((_, i) => ( 
                <div key={i} className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-5 w-2/3 col-span-2" />
                </div>
              ))}
              <Skeleton className="h-20 w-full mt-2" />
            </div>
          </CardContent>
          <CardFooter className="border-t p-6">
             <Skeleton className="h-4 w-1/3" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-10">
        <PackageSearch className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Producto no encontrado</h2>
        <p className="text-muted-foreground mb-6">No pudimos encontrar el producto que estás buscando.</p>
        <Link href="/dashboard/inventory" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inventario
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link href="/dashboard/inventory" passHref>
          <Button variant="outline" className="flex items-center gap-2 self-start sm:self-center">
            <ArrowLeft className="h-4 w-4" />
            Volver al Listado de Inventario
          </Button>
        </Link>
        <Link href={`/dashboard/inventory/${product.id}/edit`} passHref>
          <Button variant="default" className="flex items-center gap-2 self-end sm:self-center">
            <Edit className="h-4 w-4" /> Editar Producto
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="bg-muted/30 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <CardTitle className="text-3xl font-headline text-primary flex items-center gap-2">
                <ShoppingCart className="h-8 w-8" />
                {product.name}
              </CardTitle>
              <CardDescription className="text-md">
                SKU: {product.sku || 'N/A'} | Categoría: <Badge variant="outline">{product.category}</Badge>
                {tagConfig && tagConfig.name !== 'Ninguna' && (
                  <Badge variant='secondary' className={cn('ml-2 text-white', tagConfig.badgeClass)}>
                      Etiqueta {tagConfig.name} ({tagConfig.discountPercentage}%)
                  </Badge>
                )}
                {product.branchName && <> | Sucursal: <Badge variant="secondary">{product.branchName}</Badge></>}
              </CardDescription>
            </div>
            <Badge variant={getStockBadgeVariant(product.stock, product.lowStockThreshold)} className="text-sm px-3 py-1 self-start sm:self-center">
              {product.stock === 0 ? 'Agotado' : (product.stock <= (typeof product.lowStockThreshold === 'number' ? product.lowStockThreshold : (typeof product.lowStockThreshold === 'string' && product.lowStockThreshold !== '' ? parseInt(product.lowStockThreshold, 10) : 5)) && product.lowStockThreshold !== '' ? 'Stock Bajo' : 'En Stock')}
              : {product.stock} unidades
            </Badge>
          </div>
           {product.expiryDate && (
                <div className={`mt-2 p-2 rounded-md text-xs flex items-center gap-1.5
                  ${isExpired ? 'bg-red-100 text-red-700 border border-red-300' : 
                    isNearExpiry ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 
                    'bg-green-100 text-green-700 border border-green-300'}`}>
                    <CalendarClock size={14}/>
                    <strong>Fecha de Caducidad: {formatDateSafe(product.expiryDate)}</strong>
                    {isExpired && " (VENCIDO)"}
                    {isNearExpiry && ` (Vence en ${daysToExpiry} días)`}
                </div>
            )}
        </CardHeader>

        <CardContent className="p-6 grid md:grid-cols-3 gap-x-8 gap-y-6">
          <div className="md:col-span-1">
            <div className="aspect-[4/3] w-full relative rounded-lg overflow-hidden border bg-muted/30 mb-4 shadow-md">
              {product.imageUrl ? (
                <NextImage 
                  src={product.imageUrl} 
                  alt={product.name} 
                  fill
                  className="object-contain"
                  data-ai-hint={product.dataAiHint || 'product image'}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon size={48} />
                  <p className="mt-2 text-sm">Sin imagen</p>
                </div>
              )}
            </div>
             {product.dataAiHint && 
                <p className="text-xs text-muted-foreground text-center">
                    Sugerencia AI para imagen: <span className="italic">{product.dataAiHint}</span>
                </p>
            }
          </div>

          <div className="md:col-span-2 space-y-5">
            <div className="space-y-1">
              <h3 className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-1.5"><DollarSign size={14}/>Precios</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><strong className="block text-foreground/70">Venta:</strong> <span className="text-lg font-semibold text-primary">{formatCurrencyCRC(product.price)}</span></p>
                {typeof product.costPrice === 'number' && <p><strong className="block text-foreground/70">Costo:</strong> {formatCurrencyCRC(product.costPrice)}</p>}
              </div>
            </div>
            <Separator />
             <div className="space-y-1">
              <h3 className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-1.5"><Info size={14}/>Descripción</h3>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{product.description || 'No hay descripción disponible.'}</p>
            </div>
             <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <h3 className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-1.5"><Layers size={14}/>Stock</h3>
                <p className="text-sm">{product.stock} unidades</p>
              </div>
               { (typeof product.lowStockThreshold === 'number' && product.lowStockThreshold > 0) || (typeof product.lowStockThreshold === 'string' && product.lowStockThreshold !== '') ?
                <div>
                    <h3 className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-1.5"><AlertTriangle size={14}/>Umbral Stock Bajo</h3>
                    <p className="text-sm">{product.lowStockThreshold} unidades</p>
                </div>
               : null
               }
              {product.supplier && 
                <div>
                    <h3 className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-1.5"><GitBranch size={14}/>Proveedor</h3>
                    <p className="text-sm">{product.supplier}</p>
                </div>
              }
               {product.sku && 
                <div>
                    <h3 className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-1.5"><Tag size={14}/>SKU</h3>
                    <p className="text-sm">{product.sku}</p>
                </div>
              }
              <div>
                <h3 className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-1.5"><Hash size={14}/>Categoría</h3>
                <p className="text-sm">{product.category}</p>
              </div>
              {product.branchName &&
                <div>
                    <h3 className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-1.5"><Building size={14}/>Sucursal</h3>
                    <p className="text-sm">{product.branchName}</p>
                </div>
              }
               {product.expiryDate &&
                <div>
                    <h3 className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-1.5"><CalendarClock size={14}/>Fecha Caducidad</h3>
                    <p className={`text-sm ${isExpired ? 'text-red-600 font-bold' : isNearExpiry ? 'text-yellow-600 font-semibold' : ''}`}>
                        {formatDateSafe(product.expiryDate)}
                        {isExpired && " (VENCIDO)"}
                        {isNearExpiry && ` (Vence pronto)`}
                    </p>
                </div>
              }
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-6 border-t bg-muted/20">
          <p className="text-xs text-muted-foreground">
            ID del Producto: {product.id}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProductDetailPage;
