
"use client";

import type { NextPage } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Patient } from '@/types/patient';
import { PatientForm } from '@/components/dashboard/patients/patient-form';
import type { PatientFormValues } from '@/types/patient-schema';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getPatientById, updatePatient } from '@/services/patient-service';

const EditPatientPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const patientId = params.patientId as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      setIsLoading(true);
      getPatientById(patientId).then(data => {
        setPatient(data);
        setIsLoading(false);
      });
    }
  }, [patientId]);

  const handleSuccess = async (updatedPatientData: PatientFormValues) => {
    if (!patient) return;
    const updatedPatient = await updatePatient(patient.id, updatedPatientData);
    if(updatedPatient) {
        toast({
            title: "Paciente Actualizado",
            description: `La información de ${updatedPatient.firstName} ${updatedPatient.lastName} ha sido guardada.`,
        });
        router.push(`/dashboard/patients/${updatedPatient.id}`);
    } else {
         toast({
            variant: "destructive",
            title: "Error al Actualizar",
            description: "No se pudieron guardar los cambios del paciente.",
        });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><p>Cargando datos del paciente para editar...</p></div>;
  }

  if (!patient) {
    return (
       <div className="text-center py-10">
        <p className="text-xl text-muted-foreground mb-4">Paciente no encontrado para editar.</p>
        <Button onClick={() => router.push('/dashboard/patients')}>Volver al Listado</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/patients/${patientId}`} passHref>
        <Button variant="outline" className="flex items-center gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Volver a Detalles del Paciente
        </Button>
      </Link>
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
            <Edit className="h-6 w-6"/>
            Editar Paciente: {patient.firstName} {patient.lastName}
          </CardTitle>
          <CardDescription>Actualice la información del paciente.</CardDescription>
        </CardHeader>
        <CardContent>
          <PatientForm patient={patient} onSuccess={handleSuccess as any} />
        </CardContent>
      </Card>
    </div>
  );
};

export default EditPatientPage;
