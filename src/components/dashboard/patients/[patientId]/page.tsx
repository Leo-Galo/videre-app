
"use client";

import type { NextPage } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react'; 
import type { Patient, ClinicalRecord, Prescription } from '@/types/patient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit, PlusCircle, FileText, CalendarDays, UserCircle2, Phone, Mail, MapPin, Briefcase, Users, Shield, ShieldAlert, Stethoscope, StickyNote, Download, ShoppingBag, Sparkles, Loader2, Brain, Repeat, Eye as EyeIcon } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO, differenceInYears, isPast, isFuture, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ClinicalHistorySection } from '@/components/dashboard/patients/clinical-history-section';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { summarizeClinicalHistory } from '@/ai/flows/summarize-clinical-history-flow';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InvoiceModal } from '@/components/dashboard/sales/invoice-modal'; 
import type { Order, OrderItem } from '@/types/pos'; 
import { getPatientById, addClinicalRecord } from '@/services/patient-service';

interface MockPurchase {
  id: string;
  date: string; 
  orderNumber: string;
  description: string;
  total: number; 
  patientId?: string;
  items?: OrderItem[]; 
  payments?: Order['payments'];
}

const mockPurchaseHistory: MockPurchase[] = [];


const PatientDetailPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const patientId = params.patientId as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  
  const patientPurchaseHistory = useMemo(() => {
    if (!patient) return [];
    return mockPurchaseHistory
      .filter(p => p.patientId === patient.id)
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [patient]);


  useEffect(() => {
    if (patientId) {
      setIsLoading(true);
      getPatientById(patientId).then(data => {
        setPatient(data);
        setIsLoading(false);
      });
    }
  }, [patientId]);

  const handleAddClinicalRecord = async (record: ClinicalRecord) => {
    if (patient) {
        const updatedPatient = await addClinicalRecord(patient.id, record);
        if (updatedPatient) {
            setPatient(updatedPatient);
            toast({ title: "Entrada Clínica Añadida", description: "El historial clínico ha sido actualizado." });
        } else {
            toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el historial clínico." });
        }
    }
  };
  
  const handleViewInvoice = (purchase: MockPurchase) => {
    if (!patient) return;
    // Construct a full Order object for the InvoiceModal
    const orderToView: Order = {
        id: purchase.id,
        orderNumber: purchase.orderNumber,
        items: purchase.items || [{ product: { id: 'placeholder-item', name: purchase.description, price: purchase.total, stock: 0, category: 'Varios' }, quantity: 1, unitPrice: purchase.total, subtotal: purchase.total }],
        customer: { id: patient.id, name: `${patient.firstName} ${patient.lastName}`, email: patient.email, phone: patient.phone, identification: patient.personalId },
        subtotalOriginalCRC: purchase.items ? purchase.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0) : purchase.total,
        itemsDiscountAmountCRC: purchase.items ? purchase.items.reduce((sum, item) => sum + (item.discount?.amountApplied || 0), 0) : 0,
        subtotalAfterItemDiscountsCRC: purchase.items ? purchase.items.reduce((sum, item) => sum + item.subtotal, 0) : purchase.total,
        orderDiscountAmountCRC: 0, 
        baseForTaxCRC: purchase.total / 1.13, 
        taxAmountCRC: purchase.total - (purchase.total / 1.13),
        totalCRC: purchase.total,
        payments: purchase.payments || [{ method: 'card', amountCRC: purchase.total }],
        amountPaidTotalCRC: purchase.total,
        balanceDueCRC: 0,
        status: 'completed', 
        createdAt: purchase.date,
        sellerName: "Historial",
        documentTypeGenerated: 'electronic_invoice', 
    };
    setSelectedOrderForInvoice(orderToView);
    setIsInvoiceModalOpen(true);
  };


  if (isLoading) {
    return ( <div className="space-y-6"> <Skeleton className="h-10 w-48" /> <Skeleton className="h-80 w-full" /> <Skeleton className="h-64 w-full" /> <Skeleton className="h-40 w-full" /> </div> );
  }
  if (!patient) {
    return ( <div className="text-center py-10"> <p className="text-xl text-muted-foreground mb-4">Paciente no encontrado.</p> <Button onClick={() => router.push('/dashboard/patients')}>Volver al Listado</Button> </div> );
  }

  const getAge = (dateString?: string) => dateString ? differenceInYears(new Date(), parseISO(dateString)) : 'N/A';
  const formatDate = (dateString?: string, dateFormat: string = 'dd MMMM, yyyy') => dateString ? format(parseISO(dateString), dateFormat, { locale: es }) : 'N/A';
  
  const latestClinicalRecord = patient.clinicalHistory?.sort((a,b) => parseISO(b.date).getTime() - new Date(a.date).getTime())[0];
  const latestPrescriptionFromHistory: Prescription | undefined = latestClinicalRecord?.prescriptions?.sort((a,b) => parseISO(b.date).getTime() - new Date(a.date).getTime())[0];

  const nextVisitDate = patient.overallNextRecommendedVisitDate ? parseISO(patient.overallNextRecommendedVisitDate) : null;
  const isNextVisitPast = nextVisitDate && isPast(nextVisitDate) && !isToday(nextVisitDate);
  const isNextVisitFuture = nextVisitDate && isFuture(nextVisitDate);
  const isNextVisitToday = nextVisitDate && isToday(nextVisitDate);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(amount);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link href="/dashboard/patients" passHref><Button variant="outline" className="flex items-center gap-2 self-start sm:self-center"><ArrowLeft className="h-4 w-4" />Volver al Listado</Button></Link>
        <div className="flex gap-2 self-end sm:self-center">
            <Dialog> <DialogTrigger asChild><Button variant="outline" className="flex items-center gap-2"><FileText className="h-4 w-4" /> Ver Reporte</Button></DialogTrigger> <DialogContent><DialogHeader><DialogTitle>Reporte Paciente</DialogTitle><DialogDescription>Contenido del reporte PDF para {patient.firstName} {patient.lastName}.</DialogDescription></DialogHeader><div className="py-4">Aquí iría el contenido del reporte del paciente.</div><DialogFooter><DialogClose asChild><Button type="button">Cerrar</Button></DialogClose></DialogFooter></DialogContent> </Dialog>
            <Link href={`/dashboard/patients/${patient.id}/edit`} passHref><Button variant="outline" className="flex items-center gap-2"><Edit className="h-4 w-4" /> Editar Paciente</Button></Link>
        </div>
      </div>

      <Card className="shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="bg-muted/30 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div><CardTitle className="text-3xl font-headline text-primary flex items-center gap-2"><UserCircle2 className="h-8 w-8" />{patient.firstName} {patient.lastName}</CardTitle><CardDescription className="text-md">ID Paciente: {patient.id} {patient.personalId && `| Cédula: ${patient.personalId}`}</CardDescription></div>
            <div className="flex flex-col items-start sm:items-end gap-1 text-sm">
                <Badge variant={patient.lastVisitDate ? "default" : "secondary"}>{patient.lastVisitDate ? `Última Visita: ${formatDate(patient.lastVisitDate)}` : 'Sin visitas registradas'}</Badge>
                <span>Registrado: {formatDate(patient.registrationDate)}</span>
                {patient.overallNextRecommendedVisitDate && (
                    <Badge variant={isNextVisitPast ? "destructive" : isNextVisitToday ? "secondary" : "outline"} className={cn(isNextVisitToday && "bg-yellow-400 text-yellow-900 hover:bg-yellow-400/90")}>
                        <Repeat className="mr-1.5 h-3 w-3"/>
                        Próx. Rec: {formatDate(patient.overallNextRecommendedVisitDate)} ({patient.overallReasonForNextVisit || 'Seguimiento'})
                        {isNextVisitPast && " (Vencida)"}
                        {isNextVisitToday && " (Hoy)"}
                    </Badge>
                )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
            <section><h3 className="text-xl font-semibold text-primary mb-3 flex items-center gap-2"><FileText className="h-5 w-5" /> Información Personal</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm"><div><strong className="block text-muted-foreground">Fecha de Nacimiento:</strong> {formatDate(patient.dateOfBirth)} ({getAge(patient.dateOfBirth)} años)</div><div><strong className="block text-muted-foreground">Teléfono:</strong> <a href={`tel:${patient.phone}`} className="text-primary hover:underline">{patient.phone || 'N/A'}</a></div><div><strong className="block text-muted-foreground">Correo Electrónico:</strong> <a href={`mailto:${patient.email}`} className="text-primary hover:underline">{patient.email || 'N/A'}</a></div><div className="md:col-span-2"><strong className="block text-muted-foreground">Dirección:</strong> {patient.address || 'N/A'}</div><div><strong className="block text-muted-foreground">Ocupación:</strong> {patient.occupation || 'N/A'}</div><div><strong className="block text-muted-foreground">Referido Por:</strong> {patient.referredBy || 'N/A'}</div></div></section>
            <Separator />
            {(patient.insuranceProvider || patient.emergencyContactName) && (<><section><h3 className="text-xl font-semibold text-primary mb-3 flex items-center gap-2"><Shield className="h-5 w-5" /> Información de Seguro y Emergencia</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">{patient.insuranceProvider && (<><div><strong className="block text-muted-foreground">Aseguradora:</strong> {patient.insuranceProvider}</div><div><strong className="block text-muted-foreground">Nº Póliza:</strong> {patient.insurancePolicyNumber || 'N/A'}</div></>)}{patient.emergencyContactName && (<><div><strong className="block text-muted-foreground">Contacto Emergencia:</strong> {patient.emergencyContactName}</div><div><strong className="block text-muted-foreground">Tel. Emergencia:</strong> {patient.emergencyContactPhone || 'N/A'}</div></>)}</div></section><Separator /></>)}
            {(latestPrescriptionFromHistory || patient.sphericalOD || patient.notes) && (<><section><h3 className="text-xl font-semibold text-primary mb-3 flex items-center gap-2"><Stethoscope className="h-5 w-5" /> Refracción (Vista Rápida)</h3><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-3 text-sm bg-muted/20 p-4 rounded-md border"><div className="font-medium col-span-full">Ojo Derecho (OD)</div><div><strong className="text-muted-foreground">Esfera:</strong> {patient.sphericalOD || '-'}</div><div><strong className="text-muted-foreground">Cilindro:</strong> {patient.cylindricalOD || '-'}</div><div><strong className="text-muted-foreground">Eje:</strong> {patient.axisOD || '-'}</div><div><strong className="text-muted-foreground">Adición:</strong> {patient.additionOD || '-'}</div><div className="font-medium col-span-full pt-2 mt-2 border-t">Ojo Izquierdo (OS)</div><div><strong className="text-muted-foreground">Esfera:</strong> {patient.sphericalOS || '-'}</div><div><strong className="text-muted-foreground">Cilindro:</strong> {patient.cylindricalOS || '-'}</div><div><strong className="text-muted-foreground">Eje:</strong> {patient.axisOS || '-'}</div><div><strong className="text-muted-foreground">Adición:</strong> {patient.additionOS || '-'}</div><div className="font-medium col-span-full pt-2 mt-2 border-t">General</div><div className="col-span-2"><strong className="text-muted-foreground">Distancia Pupilar (DP):</strong> {patient.pd || '-'}</div></div><p className="text-xs text-muted-foreground mt-1">Esta es la refracción rápida (usualmente la más reciente). Prescripciones completas en Historial Clínico.</p>{patient.notes && (<div className="mt-4"><h4 className="font-semibold text-foreground mb-1 flex items-center gap-2"><StickyNote className="h-4 w-4 text-muted-foreground"/> Notas Generales del Paciente:</h4><p className="text-sm text-foreground/80 whitespace-pre-wrap p-3 bg-muted/20 rounded-md border">{patient.notes}</p></div>)}</section><Separator /></>)}
            
            <ClinicalHistorySection 
                patientId={patient.id} 
                patientName={`${patient.firstName} ${patient.lastName}`}
                initialRecords={patient.clinicalHistory || []} 
                onAddRecord={handleAddClinicalRecord} 
            />
            
            <section>
              <h3 className="text-xl font-semibold text-primary mb-3 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" /> Historial de Compras (Más Recientes Primero)
              </h3>
              {patientPurchaseHistory.length > 0 ? (
                <div className="overflow-x-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Nº Orden</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Total (CRC)</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patientPurchaseHistory.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell>{formatDate(purchase.date, 'dd/MM/yyyy HH:mm')}</TableCell>
                          <TableCell>{purchase.orderNumber}</TableCell>
                          <TableCell>{purchase.description}</TableCell>
                          <TableCell className="text-right">{formatCurrency(purchase.total)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="xs" onClick={() => handleViewInvoice(purchase)}>
                                <EyeIcon className="mr-1 h-3 w-3"/> Ver Factura
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-4 bg-muted/30 rounded-md text-center text-muted-foreground">
                  Este paciente no tiene historial de compras registrado.
                </div>
              )}
            </section>

        </CardContent>
        <CardFooter className="p-6 border-t"><p className="text-xs text-muted-foreground">Esta información es confidencial y debe ser manejada de acuerdo con las políticas de privacidad.</p></CardFooter>
      </Card>
      
      {selectedOrderForInvoice && (
        <InvoiceModal
            isOpen={isInvoiceModalOpen}
            onOpenChange={setIsInvoiceModalOpen}
            order={selectedOrderForInvoice}
        />
      )}

    </div>
  );
};

export default PatientDetailPage;
