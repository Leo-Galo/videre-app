
"use client";

import type { NextPage } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ClinicUser } from '@/types/user';
import { UserForm } from '@/components/dashboard/users/user-form';
import type { EditUserFormValues } from '@/types/user-schema';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserCog, UserX } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserById, updateUser } from '@/services/user-service';

const EditUserPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const userId = params.userId as string;
  
  const [user, setUser] = useState<ClinicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      setIsLoading(true);
      getUserById(userId).then(foundUser => {
        setUser(foundUser || null);
        setIsLoading(false);
      });
    }
  }, [userId]);

  const handleSuccess = async (updatedFormData: EditUserFormValues) => {
    if (!user) return;
    
    const updatedUser = await updateUser(user.id, updatedFormData);

    if (updatedUser) {
      toast({
        title: "Usuario Actualizado",
        description: `El usuario "${updatedUser.name}" ha sido actualizado exitosamente.`,
      });
      router.push('/dashboard/users'); 
    } else {
        toast({
            variant: "destructive",
            title: "Error al actualizar",
            description: "No se pudo guardar el usuario.",
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
          <CardContent className="space-y-6">
            {[...Array(3)].map((_,i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-5 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ))}
             <div className="flex justify-end space-x-3 pt-8 mt-8 border-t">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-10">
        <UserX className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Usuario no encontrado</h2>
        <p className="text-muted-foreground mb-6">No pudimos encontrar el usuario que estás buscando.</p>
        <Link href="/dashboard/users" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Listado de Usuarios
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/users" passHref>
        <Button variant="outline" className="flex items-center gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Volver al Listado de Usuarios
        </Button>
      </Link>
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
            <UserCog className="h-6 w-6" />
            Editar Usuario: {user.name}
          </CardTitle>
          <CardDescription>Modifica la información del usuario. La contraseña se cambia por separado.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserForm user={user} onSuccess={handleSuccess as any} />
        </CardContent>
      </Card>
    </div>
  );
};

export default EditUserPage;
