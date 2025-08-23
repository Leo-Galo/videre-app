
"use client";

import type { NextPage } from 'next';
import { SupplierForm } from '@/components/dashboard/suppliers/supplier-form';
import type { SupplierFormValues } from '@/types/supplier-schema';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowLeft, Landmark } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { addSupplier } from '@/services/supplier-service';

const NewSupplierPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  const handleSuccess = async (formData: SupplierFormValues) => {
    const newSupplier = await addSupplier(formData);
    
    if (newSupplier) {
        toast({
          title: "Proveedor Creado",
          description: `El proveedor "${newSupplier.name}" ha sido añadido exitosamente.`,
        });
        router.push('/dashboard/suppliers');
    } else {
        toast({
          variant: "destructive",
          title: "Error al Crear",
          description: "No se pudo crear el nuevo proveedor.",
        });
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/suppliers" passHref>
        <Button variant="outline" className="flex items-center gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Volver al Listado de Proveedores
        </Button>
      </Link>
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
            <Landmark className="h-6 w-6" />
            Añadir Nuevo Proveedor
          </CardTitle>
          <CardDescription>Complete la información del nuevo proveedor.</CardDescription>
        </CardHeader>
        <CardContent>
          <SupplierForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewSupplierPage;
