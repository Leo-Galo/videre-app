
"use client";

import type { NextPage } from 'next';
import { PatientForm } from '@/components/dashboard/patients/patient-form';
import type { PatientFormValues } from '@/types/patient-schema';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowLeft, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Patient } from '@/types/patient';
import { addPatient } from '@/services/patient-service';

const NewPatientPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  const handleSuccess = async (formData: PatientFormValues) => {
    const newPatient = await addPatient(formData);
    if (newPatient) {
        toast({
        title: "Paciente Registrado",
        description: `El paciente ${newPatient.firstName} ${newPatient.lastName} ha sido registrado exitosamente.`,
        });
        router.push(`/dashboard/patients/${newPatient.id}`);
    } else {
        toast({
            variant: "destructive",
            title: "Error al Registrar",
            description: "No se pudo crear el nuevo paciente.",
        });
    }
  };


  return (
    <div className="space-y-6">
      <Link href="/dashboard/patients" passHref>
        <Button variant="outline" className="flex items-center gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Volver al Listado de Pacientes
        </Button>
      </Link>
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
            <UserPlus className="h-6 w-6"/>
            Registrar Nuevo Paciente
          </CardTitle>
          <CardDescription>Complete la información del nuevo paciente.</CardDescription>
        </CardHeader>
        <CardContent>
          <PatientForm onSuccess={handleSuccess as any} />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewPatientPage;
