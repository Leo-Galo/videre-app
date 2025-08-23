// src/app/dashboard/consultas/recetas/page.tsx
"use client";

import type { NextPage } from 'next';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Eye, Microscope, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Patient, Prescription } from '@/types/patient';
import { getPatients } from '@/services/patient-service';
import { PrescriptionViewModal } from '@/components/dashboard/patients/prescription-view-modal';

interface EnrichedPrescription extends Prescription {
  patientName: string;
  patientId: string;
}

const PrescriptionQueryPage: NextPage = () => {
  const [allPrescriptions, setAllPrescriptions] = useState<EnrichedPrescription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<EnrichedPrescription | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const fetchedPatients = await getPatients();
      const prescriptions = fetchedPatients.flatMap(p => 
        (p.clinicalHistory || []).flatMap(h => 
          (h.prescriptions || []).map(presc => ({
            ...presc,
            patientName: `${p.firstName} ${p.lastName}`,
            patientId: p.id,
          }))
        )
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setAllPrescriptions(prescriptions);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const filteredPrescriptions = useMemo(() => {
    if (!searchTerm.trim()) {
      return [];
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return allPrescriptions.filter(p =>
      p.patientName.toLowerCase().includes(lowercasedTerm) ||
      (p.optometristName || '').toLowerCase().includes(lowercasedTerm)
    );
  }, [allPrescriptions, searchTerm]);

  const handleViewPrescription = useCallback((prescription: EnrichedPrescription) => {
    setSelectedPrescription(prescription);
    setIsModalOpen(true);
  }, []);
  
  const formatDateSafe = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try { return format(parseISO(dateString), 'dd MMM, yyyy', { locale: es }); }
    catch { return 'Fecha Inválida'; }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
            <Microscope className="h-6 w-6" /> Consulta de Recetas
          </CardTitle>
          <CardDescription>Busca recetas por nombre de paciente u optómetra.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative w-full sm:w-auto sm:flex-grow md:flex-grow-0 md:w-1/2 lg:w-1/3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por Paciente u Optómetra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full"
                autoFocus
              />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : searchTerm.trim() && filteredPrescriptions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>No se encontraron recetas con los criterios de búsqueda.</p>
            </div>
          ) : searchTerm.trim() && filteredPrescriptions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Tipo de Lente</TableHead>
                    <TableHead>Optómetra</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrescriptions.slice(0, 50).map((presc) => (
                    <TableRow key={presc.id}>
                      <TableCell>{formatDateSafe(presc.date)}</TableCell>
                      <TableCell className="font-medium">{presc.patientName}</TableCell>
                      <TableCell>{presc.lensType || 'No especificado'}</TableCell>
                      <TableCell>{presc.optometristName || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleViewPrescription(presc)}>
                          <Eye className="mr-1 h-3 w-3" /> Ver Detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredPrescriptions.length > 50 && <p className="text-xs text-muted-foreground text-center mt-4">Mostrando los primeros 50 resultados. Afine su búsqueda para ver más.</p>}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-lg">
              <Info className="h-10 w-10 mx-auto mb-2 text-primary/50" />
              <p>Introduce un término de búsqueda para encontrar recetas.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedPrescription && (
        <PrescriptionViewModal
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
            prescription={selectedPrescription}
            patientName={selectedPrescription.patientName}
        />
      )}
    </div>
  );
};

export default PrescriptionQueryPage;
