
"use client";

import type { NextPage } from 'next';
import { ProductForm, type ProductFormValues } from '@/components/dashboard/inventory/product-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowLeft, PackagePlus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/types/pos';


const NewProductPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  const handleSuccess = (formData: ProductFormValues & { expiryDate?: string }) => {
    // In a real app, you would send this to your backend
    // For simulation, we'll assume it's successful and add to local storage or similar for demo
    const newProduct: Product = {
      id: `prod${Date.now()}`, // Simple ID generation for demo
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock),
      costPrice: formData.costPrice !== '' ? Number(formData.costPrice) : undefined,
      lowStockThreshold: formData.lowStockThreshold !== '' ? Number(formData.lowStockThreshold) : undefined,
      imageUrl: formData.imageUrl || 'https://placehold.co/300x200.png', // Fallback placeholder
      expiryDate: formData.expiryDate, // Already string or undefined
      tag: formData.tag || 'Ninguna',
      ivaRate: 0.13, // Default IVA rate
    };
    console.log("New product to be saved (simulated):", newProduct);
    
    // Simulate "refreshing" the list by setting a flag that the list page can check
    localStorage.setItem('newProductAdded', 'true');

    toast({
      title: "Producto Creado",
      description: `El producto "${newProduct.name}" ha sido añadido exitosamente.`,
    });
    router.push('/dashboard/inventory');
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/inventory" passHref>
        <Button variant="outline" className="flex items-center gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Volver al Listado de Inventario
        </Button>
      </Link>
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
            <PackagePlus className="h-6 w-6" />
            Añadir Nuevo Producto
          </CardTitle>
          <CardDescription>Complete la información del nuevo producto para añadirlo a su inventario.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewProductPage;

    

    
