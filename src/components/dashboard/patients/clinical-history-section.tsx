
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { PlusCircle, CalendarIcon, FileText, Activity, Microscope, StickyNote, Loader2, Trash2, Briefcase, Eye as EyeIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ClinicalRecord, Prescription, Patient } from '@/types/patient';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PrescriptionViewModal } from './prescription-view-modal'; // Importar el nuevo modal
import { clinicalRecordSchema, prescriptionFormSchema, type PatientFormValues } from '@/types/patient-schema';

type ClinicalRecordFormValues = z.infer<typeof clinicalRecordSchema>;
type PrescriptionFormValues = z.infer<typeof prescriptionFormSchema>;


interface ClinicalHistorySectionProps {
  patientId: string;
  patientName: string; 
  initialRecords?: ClinicalRecord[];
  onAddRecord: (record: ClinicalRecord) => void; 
}

const defaultPrescriptionValues: Partial<PrescriptionFormValues> = {
  date: new Date(),
  lensType: 'Monofocal', 
};

const PrescriptionDetailItem = ({ prescription, onOpenPrescriptionModal }: { prescription: Prescription, onOpenPrescriptionModal: (prescription: Prescription) => void }) => (
    <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-md text-xs space-y-1.5 shadow-sm">
        <div className="flex justify-between items-center">
            <p className="font-semibold text-primary/90 mb-1">Prescripción del {format(parseISO(prescription.date), 'dd MMMM, yyyy', { locale: es })}</p>
            <Button variant="outline" size="sm" onClick={() => onOpenPrescriptionModal(prescription)}>
                <EyeIcon className="h-3.5 w-3.5 mr-1.5"/> Ver Receta Completa
            </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            {prescription.lensType && <p><strong>Tipo Lente:</strong> {prescription.lensType}</p>}
            {prescription.lensMaterial && <p><strong>Material:</strong> {prescription.lensMaterial}</p>}
            {prescription.lensCoatings && prescription.lensCoatings.length > 0 && <p className="sm:col-span-2"><strong>Tratamientos:</strong> {prescription.lensCoatings.join(', ')}</p>}
        </div>
        
        {(prescription.sphericalOD || prescription.sphericalOS) && <Separator className="my-1.5"/> }
        {(prescription.sphericalOD || prescription.sphericalOS) && <p className="font-medium text-foreground/80">Refracción Oftálmica:</p> }
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-0.5">
            {prescription.sphericalOD && <div><strong className="text-muted-foreground">OD Esf:</strong> {prescription.sphericalOD}</div>}
            {prescription.cylinderOD && <div><strong className="text-muted-foreground">OD Cil:</strong> {prescription.cylinderOD}</div>}
            {prescription.axisOD && <div><strong className="text-muted-foreground">OD Eje:</strong> {prescription.axisOD}</div>}
            {prescription.addOD && <div><strong className="text-muted-foreground">OD Add:</strong> {prescription.addOD}</div>}
            
            {prescription.sphericalOS && <div><strong className="text-muted-foreground">OS Esf:</strong> {prescription.sphericalOS}</div>}
            {prescription.cylinderOS && <div><strong className="text-muted-foreground">OS Cil:</strong> {prescription.cylinderOS}</div>}
            {prescription.axisOS && <div><strong className="text-muted-foreground">OS Eje:</strong> {prescription.axisOS}</div>}
            {prescription.addOS && <div><strong className="text-muted-foreground">OS Add:</strong> {prescription.addOS}</div>}
        </div>
        
        {prescription.optometristName && <p className="text-xs text-muted-foreground mt-1"><strong>Código Profesional:</strong> {prescription.optometristName} {prescription.optometristLicense && `(Código Profesional: ${prescription.optometristLicense})`}</p>}
    </div>
);

export function ClinicalHistorySection({ patientId, patientName, initialRecords = [], onAddRecord }: ClinicalHistorySectionProps) {
  const [records, setRecords] = useState<ClinicalRecord[]>(initialRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<ClinicalRecordFormValues>({
    resolver: zodResolver(clinicalRecordSchema),
    defaultValues: {
      date: new Date(),
      notes: '',
      diagnosis: '',
      treatment: '',
      prescriptions: [defaultPrescriptionValues], 
      nextRecommendedVisitDate: undefined,
      reasonForNextVisit: '',
    },
  });
  
  const { fields, append, remove, replace } = useFieldArray({ 
    control: form.control,
    name: "prescriptions",
  });

  useEffect(() => {
    setRecords(initialRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, [initialRecords]);

  const handleOpenPrescriptionModal = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setIsPrescriptionModalOpen(true);
  };

  async function onSubmit(data: ClinicalRecordFormValues) {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newRecord: ClinicalRecord = {
      id: `hist-${patientId}-${Date.now()}`,
      date: data.date.toISOString(),
      notes: data.notes,
      diagnosis: data.diagnosis,
      treatment: data.treatment,
      nextRecommendedVisitDate: data.nextRecommendedVisitDate?.toISOString(),
      reasonForNextVisit: data.reasonForNextVisit,
      prescriptions: data.prescriptions?.map((p: PrescriptionFormValues) => ({
        ...p, 
        id: p.id || `presc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        date: p.date.toISOString(), 
        expiryDate: p.expiryDate?.toISOString(),
        lensCoatings: p.lensCoatingsInput ? p.lensCoatingsInput.split(',').map(s=>s.trim()).filter(s=>s) : [],
      } as Prescription)) || [],
    };
    
    onAddRecord(newRecord); 
    setShowForm(false);
    form.reset({ 
        date: new Date(), 
        notes: '', 
        diagnosis: '', 
        treatment: '', 
        prescriptions: [defaultPrescriptionValues],
        nextRecommendedVisitDate: undefined,
        reasonForNextVisit: '' 
    });
    replace([defaultPrescriptionValues]); 
    setIsLoading(false);
    toast({ title: "Nota Clínica Añadida", description: "El historial clínico ha sido actualizado." });
  }


  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
            <Activity className="h-5 w-5" /> Historial Clínico ({records.length})
        </h3>
        <Button 
          onClick={() => {
            const newShowFormState = !showForm;
            setShowForm(newShowFormState);
            if (newShowFormState) { 
              form.reset({
                date: new Date(),
                notes: '',
                diagnosis: '',
                treatment: '',
                prescriptions: [defaultPrescriptionValues],
                nextRecommendedVisitDate: undefined,
                reasonForNextVisit: '',
              });
              replace([defaultPrescriptionValues]);
            } else { 
              form.reset({ 
                date: new Date(),
                notes: '',
                diagnosis: '',
                treatment: '',
                prescriptions: [defaultPrescriptionValues], 
                nextRecommendedVisitDate: undefined,
                reasonForNextVisit: '' 
              });
               replace([defaultPrescriptionValues]); 
            }
          }} 
          variant={showForm ? "outline" : "default"}
          className={cn(showForm && "text-destructive border-destructive hover:bg-destructive/10")}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {showForm ? 'Cancelar Nota Clínica' : 'Añadir Nota Clínica'}
        </Button>
      </div>

      {showForm && (
        <Card className="shadow-md rounded-lg border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">Nueva Nota Clínica</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Fecha de la Consulta *</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")} >
                                    {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} defaultMonth={field.value || new Date()} disabled={(date) => date > new Date()} initialFocus locale={es} />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField control={form.control} name="diagnosis" render={({ field }) => ( <FormItem><FormLabel>Diagnóstico</FormLabel><FormControl><Input placeholder="Ej: Miopía, Queratocono" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                </div>
                <FormField control={form.control} name="treatment" render={({ field }) => ( <FormItem><FormLabel>Tratamiento/Plan</FormLabel><FormControl><Input placeholder="Ej: Lentes monofocales, Revisión en 6 meses" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>Notas de la Consulta / Hallazgos *</FormLabel><FormControl><Textarea rows={3} placeholder="Detalles de la consulta, hallazgos, recomendaciones..." {...field} /></FormControl><FormMessage /></FormItem> )}/>
                
                <Separator />
                 <div>
                  <h4 className="text-md font-medium mb-2">Próxima Visita Recomendada (Opcional)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="nextRecommendedVisitDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Fecha Próxima Visita</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} defaultMonth={field.value || new Date()} disabled={(date) => date < new Date()} initialFocus locale={es} />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField control={form.control} name="reasonForNextVisit" render={({ field }) => ( <FormItem><FormLabel>Motivo Próxima Visita</FormLabel><FormControl><Input placeholder="Ej: Revisión anual, Control glaucoma" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    </div>
                </div>

                <Separator />
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-md font-medium">Prescripciones Asociadas a esta Consulta</h4>
                    <Button type="button" variant="outline" size="sm" onClick={() => append(defaultPrescriptionValues)} disabled={isLoading}><PlusCircle className="h-4 w-4 mr-2" />Añadir Otra Prescripción</Button>
                  </div>
                  {fields.map((prescriptionField, index) => (
                    <Card key={prescriptionField.id} className="mb-4 p-4 space-y-3 bg-muted/30 border-dashed">
                      <div className="flex justify-between items-center">
                        <h5 className="text-sm font-semibold">Prescripción #{index + 1}</h5>
                        <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} disabled={isLoading || fields.length <=1 } className="text-destructive hover:text-destructive disabled:text-muted-foreground disabled:hover:text-muted-foreground"><Trash2 className="h-4 w-4 mr-1"/>Quitar</Button>
                      </div>
                       <FormField control={form.control} name={`prescriptions.${index}.date`}
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel className="text-xs">Fecha Prescripción *</FormLabel>
                            <Popover> <PopoverTrigger asChild>
                                <FormControl><Button variant={"outline"} size="sm" className={cn("w-full justify-start text-left font-normal text-xs", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                                    <CalendarIcon className="ml-auto h-3 w-3 opacity-50" /></Button></FormControl>
                            </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} defaultMonth={field.value || new Date()} disabled={(date) => date > new Date()} initialFocus locale={es} /></PopoverContent></Popover>
                            <FormMessage /> </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField control={form.control} name={`prescriptions.${index}.lensType`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Tipo Lente</FormLabel><FormControl><Input placeholder="Monofocal" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                        <FormField control={form.control} name={`prescriptions.${index}.lensMaterial`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Material Lente</FormLabel><FormControl><Input placeholder="CR-39" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                      </div>
                      <FormField control={form.control} name={`prescriptions.${index}.lensCoatingsInput`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Tratamientos Lente (coma sep.)</FormLabel><FormControl><Input placeholder="AR, Filtro Azul" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                      
                      <p className="text-xs font-medium mt-2 pt-2 border-t">OD (Ojo Derecho) - Lentes Oftálmicos</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <FormField control={form.control} name={`prescriptions.${index}.sphericalOD`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Esf.</FormLabel><FormControl><Input placeholder="-1.25" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                        <FormField control={form.control} name={`prescriptions.${index}.cylinderOD`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Cil.</FormLabel><FormControl><Input placeholder="-0.75" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                        <FormField control={form.control} name={`prescriptions.${index}.axisOD`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Eje</FormLabel><FormControl><Input placeholder="175" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                        <FormField control={form.control} name={`prescriptions.${index}.addOD`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Add.</FormLabel><FormControl><Input placeholder="+2.00" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                      </div>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        <FormField control={form.control} name={`prescriptions.${index}.prismOD`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Prisma</FormLabel><FormControl><Input placeholder="1.0" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                        <FormField control={form.control} name={`prescriptions.${index}.baseOD`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Base</FormLabel><FormControl><Input placeholder="Superior" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                        <FormField control={form.control} name={`prescriptions.${index}.fittingHeightOD`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Altura</FormLabel><FormControl><Input placeholder="18" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                      </div>
                       <p className="text-xs font-medium mt-2 pt-2 border-t">OS (Ojo Izquierdo) - Lentes Oftálmicos</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <FormField control={form.control} name={`prescriptions.${index}.sphericalOS`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Esf.</FormLabel><FormControl><Input placeholder="-1.50" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                        <FormField control={form.control} name={`prescriptions.${index}.cylinderOS`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Cil.</FormLabel><FormControl><Input placeholder="-0.50" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                        <FormField control={form.control} name={`prescriptions.${index}.axisOS`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Eje</FormLabel><FormControl><Input placeholder="010" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                        <FormField control={form.control} name={`prescriptions.${index}.addOS`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Add.</FormLabel><FormControl><Input placeholder="+2.00" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        <FormField control={form.control} name={`prescriptions.${index}.prismOS`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Prisma</FormLabel><FormControl><Input placeholder="1.0" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                        <FormField control={form.control} name={`prescriptions.${index}.baseOS`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Base</FormLabel><FormControl><Input placeholder="Inferior" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                        <FormField control={form.control} name={`prescriptions.${index}.fittingHeightOS`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Altura</FormLabel><FormControl><Input placeholder="18" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                      </div>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 pt-2 border-t">
                        <FormField control={form.control} name={`prescriptions.${index}.pd`} render={({ field }) => (<FormItem><FormLabel className="text-xs">DP Lejos</FormLabel><FormControl><Input placeholder="63" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                        <FormField control={form.control} name={`prescriptions.${index}.pdNear`} render={({ field }) => (<FormItem><FormLabel className="text-xs">DP Cerca</FormLabel><FormControl><Input placeholder="60" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                        <FormField control={form.control} name={`prescriptions.${index}.vertexDistance`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Dist. Vértice</FormLabel><FormControl><Input placeholder="12mm" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                      </div>

                      <Separator className="my-3" />
                      <p className="text-xs font-medium mt-2">Detalles del Armazón (si aplica)</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <FormField control={form.control} name={`prescriptions.${index}.frameBrand`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Marca Aro</FormLabel><FormControl><Input placeholder="Ray-Ban" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                        <FormField control={form.control} name={`prescriptions.${index}.frameModel`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Modelo Aro</FormLabel><FormControl><Input placeholder="Aviator" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                        <FormField control={form.control} name={`prescriptions.${index}.frameColor`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Color Aro</FormLabel><FormControl><Input placeholder="Dorado" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                      </div>
                      <FormField control={form.control} name={`prescriptions.${index}.frameMeasurements`} render={({ field }) => (<FormItem className="mt-2"><FormLabel className="text-xs">Medidas Aro</FormLabel><FormControl><Input placeholder="58-18-140" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                      <FormField control={form.control} name={`prescriptions.${index}.frameNotes`} render={({ field }) => (<FormItem className="mt-2"><FormLabel className="text-xs">Notas del Armazón</FormLabel><FormControl><Input placeholder="Ej: Ajuste especial" {...field} className="text-xs h-8" /></FormControl><FormDescription className="text-xs">Si el cliente trae su propio aro, anótelo aquí.</FormDescription></FormItem>)}/>
                      
                      <Separator className="my-3" />
                      <p className="text-xs font-medium mt-2">Lentes de Contacto (si aplica)</p>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField control={form.control} name={`prescriptions.${index}.clMaterial`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Material L.C.</FormLabel><FormControl><Input placeholder="Hidrogel Silicona" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                        <FormField control={form.control} name={`prescriptions.${index}.clMultifocalDesign`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Diseño Multifocal L.C.</FormLabel><FormControl><Input placeholder="Centro Cerca" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                      </div>

                      <p className="text-xs font-medium mt-2 pt-2 border-t">OD (Ojo Derecho) - L.C.</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          <FormField control={form.control} name={`prescriptions.${index}.clBrandOD`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Marca</FormLabel><FormControl><Input placeholder="Acuvue" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                          <FormField control={form.control} name={`prescriptions.${index}.clBcOD`} render={({ field }) => (<FormItem><FormLabel className="text-xs">BC</FormLabel><FormControl><Input placeholder="8.6" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                          <FormField control={form.control} name={`prescriptions.${index}.clDiaOD`} render={({ field }) => (<FormItem><FormLabel className="text-xs">DIA</FormLabel><FormControl><Input placeholder="14.5" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                          <FormField control={form.control} name={`prescriptions.${index}.clPowerOD`} render={({ field }) => (<FormItem><FormLabel className="text-xs">PWR</FormLabel><FormControl><Input placeholder="-2.00" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                          <FormField control={form.control} name={`prescriptions.${index}.clCylOD`} render={({ field }) => (<FormItem><FormLabel className="text-xs">CYL</FormLabel><FormControl><Input placeholder="-0.75" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                          <FormField control={form.control} name={`prescriptions.${index}.clAxisOD`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Axis</FormLabel><FormControl><Input placeholder="180" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                          <FormField control={form.control} name={`prescriptions.${index}.clAddPowerOD`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Add L.C.</FormLabel><FormControl><Input placeholder="+1.50" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                          <FormField control={form.control} name={`prescriptions.${index}.clColorOD`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Color L.C.</FormLabel><FormControl><Input placeholder="Azul" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                      </div>
                      <p className="text-xs font-medium mt-2 pt-2 border-t">OS (Ojo Izquierdo) - L.C.</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          <FormField control={form.control} name={`prescriptions.${index}.clBrandOS`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Marca</FormLabel><FormControl><Input placeholder="Biofinity" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                          <FormField control={form.control} name={`prescriptions.${index}.clBcOS`} render={({ field }) => (<FormItem><FormLabel className="text-xs">BC</FormLabel><FormControl><Input placeholder="8.7" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                          <FormField control={form.control} name={`prescriptions.${index}.clDiaOS`} render={({ field }) => (<FormItem><FormLabel className="text-xs">DIA</FormLabel><FormControl><Input placeholder="14.0" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                          <FormField control={form.control} name={`prescriptions.${index}.clPowerOS`} render={({ field }) => (<FormItem><FormLabel className="text-xs">PWR</FormLabel><FormControl><Input placeholder="-2.25" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                          <FormField control={form.control} name={`prescriptions.${index}.clCylOS`} render={({ field }) => (<FormItem><FormLabel className="text-xs">CYL</FormLabel><FormControl><Input placeholder="-1.25" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                          <FormField control={form.control} name={`prescriptions.${index}.clAxisOS`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Axis</FormLabel><FormControl><Input placeholder="020" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                          <FormField control={form.control} name={`prescriptions.${index}.clAddPowerOS`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Add L.C.</FormLabel><FormControl><Input placeholder="+1.50" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                          <FormField control={form.control} name={`prescriptions.${index}.clColorOS`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Color L.C.</FormLabel><FormControl><Input placeholder="Verde" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 pt-2 border-t">
                        <FormField control={form.control} name={`prescriptions.${index}.clWearSchedule`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Uso L.C.</FormLabel><FormControl><Input placeholder="Diario" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                        <FormField control={form.control} name={`prescriptions.${index}.clReplacementSchedule`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Reemplazo L.C.</FormLabel><FormControl><Input placeholder="Mensual" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                        <FormField control={form.control} name={`prescriptions.${index}.clQuantitySupplied`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Cant. Suministrada L.C.</FormLabel><FormControl><Input placeholder="Caja 6 un." {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                      </div>

                      <Separator className="my-3" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField control={form.control} name={`prescriptions.${index}.optometristName`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Optómetra</FormLabel><FormControl><Input placeholder="Dr. Grant" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                        <FormField control={form.control} name={`prescriptions.${index}.optometristLicense`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Código Profesional</FormLabel><FormControl><Input placeholder="COD-1234" {...field} className="text-xs h-8" /></FormControl></FormItem>)}/>
                      </div>
                      <FormField control={form.control} name={`prescriptions.${index}.optometristNotes`} render={({ field }) => (<FormItem className="mt-2"><FormLabel className="text-xs">Notas de Prescripción</FormLabel><FormControl><Textarea rows={2} placeholder="Notas adicionales para esta prescripción..." {...field} className="text-xs" /></FormControl></FormItem>)}/>
                      <FormField control={form.control} name={`prescriptions.${index}.expiryDate`}
                        render={({ field }) => (
                            <FormItem className="flex flex-col mt-2"> <FormLabel className="text-xs">Fecha Expiración Prescripción</FormLabel>
                            <Popover><PopoverTrigger asChild>
                                <FormControl><Button variant={"outline"} size="sm" className={cn("w-full justify-start text-left font-normal text-xs", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                                    <CalendarIcon className="ml-auto h-3 w-3 opacity-50" /></Button></FormControl>
                            </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} defaultMonth={field.value} disabled={(date) => date < new Date()} initialFocus locale={es} /></PopoverContent></Popover>
                            <FormMessage /> </FormItem>
                        )}
                      />
                    </Card>
                  ))}
                  {form.formState.errors.prescriptions?.root && (
                      <p className="text-sm font-medium text-destructive">{form.formState.errors.prescriptions.root.message}</p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={() => {
                        setShowForm(false); 
                        form.reset({ 
                            date: new Date(), 
                            notes: '', 
                            diagnosis: '', 
                            treatment: '', 
                            prescriptions: [defaultPrescriptionValues],
                            nextRecommendedVisitDate: undefined,
                            reasonForNextVisit: '' 
                        });
                        replace([defaultPrescriptionValues]);
                    }} disabled={isLoading}>Cancelar</Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Nota Clínica
                    </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {records.length > 0 ? (
        <Accordion type="single" collapsible className="w-full" defaultValue={records[0] ? `item-${records[0].id}` : undefined}>
          {records.map((record) => (
            <AccordionItem value={`item-${record.id}`} key={record.id} className="border-b">
              <AccordionTrigger className="hover:no-underline py-3 px-1 text-left">
                <div className="flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-primary/80"/>
                    <div>
                        <span className="font-medium text-foreground">Consulta del {format(parseISO(record.date), 'dd MMMM, yyyy', { locale: es })}</span>
                        {record.diagnosis && <p className="text-xs text-muted-foreground">Diagnóstico: {record.diagnosis}</p>}
                        {record.nextRecommendedVisitDate && <p className="text-xs text-blue-600">Próxima Cita: {format(parseISO(record.nextRecommendedVisitDate), 'dd MMMM, yyyy', { locale: es })} ({record.reasonForNextVisit || 'Seguimiento'})</p>}
                    </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-3 px-1 space-y-2">
                {record.treatment && <p className="text-sm"><strong className="text-muted-foreground">Tratamiento/Plan:</strong> {record.treatment}</p>}
                <p className="text-sm whitespace-pre-wrap"><strong className="text-muted-foreground">Notas:</strong> {record.notes}</p>
                {record.prescriptions && record.prescriptions.length > 0 ? (
                    <div className="mt-3">
                        <h5 className="text-sm font-semibold text-primary mb-1">Prescripciones en esta consulta (Más Recientes Primero):</h5>
                        {record.prescriptions
                            .sort((a, b) => parseISO(b.date).getTime() - new Date(a.date).getTime()) 
                            .map(presc => <PrescriptionDetailItem key={presc.id} prescription={presc} onOpenPrescriptionModal={handleOpenPrescriptionModal} />)}
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground mt-2">No hay prescripciones detalladas asociadas a esta entrada clínica.</p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        !showForm && <p className="text-sm text-muted-foreground text-center py-4">No hay entradas en el historial clínico de este paciente.</p>
      )}
       {selectedPrescription && (
        <PrescriptionViewModal
          isOpen={isPrescriptionModalOpen}
          onOpenChange={setIsPrescriptionModalOpen}
          prescription={selectedPrescription}
          patientName={patientName}
        />
      )}
    </section>
  );
}
