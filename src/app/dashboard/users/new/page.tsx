
"use client";

import type { NextPage } from 'next';
import { UserForm } from '@/components/dashboard/users/user-form';
import type { CreateUserFormValues } from '@/types/user-schema';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowLeft, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { ClinicUser } from '@/types/user';

const NewUserPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  const handleSuccess = (formData: CreateUserFormValues) => {
    // In a real app, you would send this to your backend
    const newUser: ClinicUser = {
      id: `user${Date.now()}`, // Simple ID generation for demo
      name: formData.name,
      email: formData.email,
      role: formData.role,
      status: 'Active', // New users are active by default
      createdAt: new Date().toISOString(),
      // passwordHash would be generated backend
    };
    console.log("New user to be saved (simulated):", newUser);
    
    localStorage.setItem('newUserAdded', 'true');

    toast({
      title: "Usuario Creado",
      description: `El usuario "${newUser.name}" ha sido añadido exitosamente (simulado).`,
    });
    router.push('/dashboard/users');
  };

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
            <UserPlus className="h-6 w-6" />
            Añadir Nuevo Usuario a la Clínica
          </CardTitle>
          <CardDescription>Complete la información del nuevo usuario y asigne un rol.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserForm onSuccess={handleSuccess as any} />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewUserPage;
