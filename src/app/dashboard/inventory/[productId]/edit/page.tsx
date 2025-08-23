
"use client";

import type { NextPage } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Product } from '@/types/pos';
import { ProductForm } from '@/components/dashboard/inventory/product-form';
import type { ProductFormValues } from '@/types/inventory-schema';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, PackageSearch } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { getProductById, updateProduct as updateProductService } from '@/services/inventory-service'; // Renamed for clarity

const EditProductPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
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

  const handleSuccess = async (updatedFormData: ProductFormValues & { expiryDate?: string }) => {
    if (!product) return;

    const productToUpdate: Product = {
      ...product,
      ...updatedFormData,
      price: Number(updatedFormData.price),
      stock: Number(updatedFormData.stock),
      costPrice: updatedFormData.costPrice === '' || updatedFormData.costPrice === undefined ? undefined : Number(updatedFormData.costPrice),
      lowStockThreshold: updatedFormData.lowStockThreshold === '' || updatedFormData.lowStockThreshold === undefined ? undefined : Number(updatedFormData.lowStockThreshold),
      expiryDate: updatedFormData.expiryDate,
      imageUrl: updatedFormData.imageUrl || product.imageUrl,
      tag: updatedFormData.tag || 'Ninguna',
    };
    
    const updatedProductResult = await updateProductService(productToUpdate);

    if (updatedProductResult) {
      toast({
        title: "Producto Actualizado",
        description: `El producto "${updatedProductResult.name}" ha sido actualizado exitosamente.`,
      });
      router.push(`/dashboard/inventory/${product.id}`); 
    } else {
        toast({
            variant: "destructive",
            title: "Error al actualizar",
            description: "No se pudo guardar el producto.",
        });
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-56 mb-4" />
        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <Skeleton className="h-7 w-1/2 mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-1 space-y-2">
                    <Skeleton className="h-6 w-1/3 mb-1" />
                    <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                    <Skeleton className="h-4 w-2/3 mt-1" />
                    <Skeleton className="h-6 w-1/3 mt-4 mb-1" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="md:col-span-2 space-y-6">
                    {[...Array(6)].map((_,i) => ( 
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-5 w-1/4" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                </div>
            </div>
             <div className="flex justify-end space-x-3 pt-8 mt-8 border-t">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
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
      <Link href={`/dashboard/inventory/${product.id}`} passHref>
        <Button variant="outline" className="flex items-center gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Volver a Detalles del Producto
        </Button>
      </Link>
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
            <Edit className="h-6 w-6" />
            Editar Producto: {product.name}
          </CardTitle>
          <CardDescription>Modifica la información del producto y guarda los cambios.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm product={product} onSuccess={handleSuccess as any} />
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProductPage;
    
