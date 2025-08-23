
"use client";

import type { NextPage } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Supplier } from '@/types/supplier';
import { SupplierForm } from '@/components/dashboard/suppliers/supplier-form';
import type { SupplierFormValues } from '@/types/supplier-schema';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { getSupplierById, updateSupplier } from '@/services/supplier-service';


const EditSupplierPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const supplierId = params.supplierId as string;
  
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (supplierId) {
      setIsLoading(true);
      getSupplierById(supplierId).then(data => {
        setSupplier(data);
        setIsLoading(false);
      });
    }
  }, [supplierId]);

  const handleSuccess = async (updatedFormData: SupplierFormValues) => {
    if (!supplier) return;
    const updatedSupplier = await updateSupplier(supplier.id, updatedFormData);
    if (updatedSupplier) {
      toast({
        title: "Proveedor Actualizado",
        description: `El proveedor "${updatedSupplier.name}" ha sido actualizado exitosamente.`,
      });
      router.push(`/dashboard/suppliers`);
    } else {
       toast({
        variant: "destructive",
        title: "Error al Guardar",
        description: "No se pudieron guardar los cambios.",
      });
    }
  };
  
  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (!supplier) {
    return <div>Proveedor no encontrado.</div>;
  }

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/suppliers`} passHref>
        <Button variant="outline" className="flex items-center gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Volver al Listado de Proveedores
        </Button>
      </Link>
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
            <Edit className="h-6 w-6" />
            Editar Proveedor: {supplier.name}
          </CardTitle>
          <CardDescription>Modifica la información del proveedor.</CardDescription>
        </CardHeader>
        <CardContent>
          <SupplierForm supplier={supplier} onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  );
};

export default EditSupplierPage;
