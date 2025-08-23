
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Stethoscope, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ClinicalRecord } from '@/types/patient';
import { getGlobalClinicalRecords } from '@/services/patient-service';

export default function GlobalClinicalHistoryPage() {
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const fetchedRecords = await getGlobalClinicalRecords();
      setRecords(fetchedRecords);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records;
    const lowercasedFilter = searchTerm.toLowerCase();
    return records.filter(record =>
      record.patientName?.toLowerCase().includes(lowercasedFilter) ||
      record.diagnosis?.toLowerCase().includes(lowercasedFilter) ||
      record.treatment?.toLowerCase().includes(lowercasedFilter)
    );
  }, [records, searchTerm]);

  const formatDateSafe = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'dd MMM, yyyy', { locale: es });
    } catch (e) {
      return 'Fecha Inválida';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <Stethoscope className="h-8 w-8" />
          Historial Clínico Global
        </h1>
        <p className="text-muted-foreground">
          Consulta todas las entradas clínicas de todos los pacientes en un solo lugar.
        </p>
      </div>

      <Card className="shadow-md rounded-xl">
        <CardHeader>
          <CardTitle>Listado de Entradas Clínicas</CardTitle>
          <div className="mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por paciente, diagnóstico o tratamiento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full md:w-1/2 lg:w-1/3"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Fecha</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Diagnóstico</TableHead>
                  <TableHead>Tratamiento</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{formatDateSafe(record.date)}</TableCell>
                      <TableCell className="font-medium">{record.patientName}</TableCell>
                      <TableCell><Badge variant="outline">{record.diagnosis || 'N/A'}</Badge></TableCell>
                      <TableCell className="max-w-xs truncate" title={record.treatment}>{record.treatment || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/patients/${record.patientId}`}>
                            <Eye className="mr-2 h-4 w-4" /> Ver Paciente
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No se encontraron registros clínicos.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
