

"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { Patient } from '@/types/patient';
import { CalendarIcon, Loader2, Microscope, Eye } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { patientFormSchema, type PatientFormValues } from '@/types/patient-schema';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import type { IdentificationType } from '@/types/pos';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';

const identificationTypeOptions: IdentificationType[] = ["Cédula Física", "Cédula Jurídica", "DIMEX", "NITE", "Pasaporte", "Otro"];

interface PatientFormProps {
  patient?: Patient; // For editing existing patient
  onSuccess: (patient: Patient) => void;
}

export function PatientForm({ patient, onSuccess }: PatientFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const defaultValues: Partial<PatientFormValues> = patient
    ? {
        ...patient,
        dateOfBirth: patient.dateOfBirth ? parseISO(patient.dateOfBirth) : undefined,
      }
    : {
        firstName: '',
        lastName: '',
        identificationType: "Cédula Física",
      };

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues,
  });

  async function onSubmit(data: PatientFormValues) {
    setIsLoading(true);
    // SIMULATED: Backend logic for creating/updating patient data
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newOrUpdatedPatient: Patient = {
      id: patient?.id || Date.now().toString(), 
      ...patient, 
      ...data,
      identificationType: data.identificationType || 'Otro',
      dateOfBirth: data.dateOfBirth?.toISOString().split('T')[0],
      registrationDate: patient?.registrationDate || new Date().toISOString(),
      clinicalHistory: patient?.clinicalHistory || [], 
      lastVisitDate: patient?.lastVisitDate, 
    };

    console.log('Patient data submitted (simulated):', newOrUpdatedPatient);
    setIsLoading(false);

    toast({
      title: patient ? "Paciente Actualizado" : "Paciente Registrado",
      description: `El paciente ${newOrUpdatedPatient.firstName} ${newOrUpdatedPatient.lastName} ha sido ${patient ? 'actualizado' : 'registrado'} exitosamente.`,
    });

    if (onSuccess) {
      onSuccess(newOrUpdatedPatient);
    } else {
      router.push(`/dashboard/patients/${newOrUpdatedPatient.id}`);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombres *</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Ana María" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellidos *</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Pérez López" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <FormField
            control={form.control}
            name="identificationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Identificación</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un tipo" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {identificationTypeOptions.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="personalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Identificación</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 1-1234-5678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Nacimiento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Seleccione una fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="Ej: 8888-8888" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico</FormLabel>
              <FormControl>
                <Input type="email" placeholder="ejemplo@correo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Textarea placeholder="Dirección completa del paciente..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <h3 className="text-lg font-medium text-primary pt-4 border-t">Información Adicional</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Ocupación</FormLabel>
                    <FormControl>
                    <Input placeholder="Ej: Estudiante, Ingeniero" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="referredBy"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Referido Por</FormLabel>
                    <FormControl>
                    <Input placeholder="Ej: Dr. Juan Pérez, Otro Paciente" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        <h3 className="text-lg font-medium text-primary pt-4 border-t">Información de Seguro</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="insuranceProvider"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Aseguradora</FormLabel>
                    <FormControl>
                    <Input placeholder="Nombre de la aseguradora" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="insurancePolicyNumber"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Número de Póliza</FormLabel>
                    <FormControl>
                    <Input placeholder="Número de póliza" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        <h3 className="text-lg font-medium text-primary pt-4 border-t">Contacto de Emergencia</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="emergencyContactName"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Nombre del Contacto</FormLabel>
                    <FormControl>
                    <Input placeholder="Nombre completo" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="emergencyContactPhone"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Teléfono del Contacto</FormLabel>
                    <FormControl>
                    <Input type="tel" placeholder="Ej: 8888-8888" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        <h3 className="text-lg font-medium text-primary pt-4 border-t">Refracción Actual (Opcional)</h3>
        <FormDescription>Ingrese los datos de la refracción más reciente. La prescripción completa se registra en el Historial Clínico.</FormDescription>
        
        <Accordion type="multiple" className="w-full">
            <AccordionItem value="lentes-oftalmicos">
                <AccordionTrigger className="font-semibold"><Eye className="mr-2 h-5 w-5"/>Lentes Oftálmicos</AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                       <FormField control={form.control} name="sphericalOD" render={({ field }) => ( <FormItem><FormLabel>OD Esfera</FormLabel><FormControl><Input placeholder="+0.00" {...field} /></FormControl><FormMessage /></FormItem> )} />
                       <FormField control={form.control} name="cylindricalOD" render={({ field }) => ( <FormItem><FormLabel>OD Cilindro</FormLabel><FormControl><Input placeholder="-0.00" {...field} /></FormControl><FormMessage /></FormItem> )} />
                       <FormField control={form.control} name="axisOD" render={({ field }) => ( <FormItem><FormLabel>OD Eje</FormLabel><FormControl><Input placeholder="0°" {...field} /></FormControl><FormMessage /></FormItem> )} />
                       <FormField control={form.control} name="additionOD" render={({ field }) => ( <FormItem><FormLabel>OD Adición</FormLabel><FormControl><Input placeholder="+2.00" {...field} /></FormControl><FormMessage /></FormItem> )} />
                       
                       <FormField control={form.control} name="sphericalOS" render={({ field }) => ( <FormItem><FormLabel>OI Esfera</FormLabel><FormControl><Input placeholder="+0.00" {...field} /></FormControl><FormMessage /></FormItem> )} />
                       <FormField control={form.control} name="cylindricalOS" render={({ field }) => ( <FormItem><FormLabel>OI Cilindro</FormLabel><FormControl><Input placeholder="-0.00" {...field} /></FormControl><FormMessage /></FormItem> )} />
                       <FormField control={form.control} name="axisOS" render={({ field }) => ( <FormItem><FormLabel>OI Eje</FormLabel><FormControl><Input placeholder="0°" {...field} /></FormControl><FormMessage /></FormItem> )} />
                       <FormField control={form.control} name="additionOS" render={({ field }) => ( <FormItem><FormLabel>OI Adición</FormLabel><FormControl><Input placeholder="+0.00" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                     <FormField
                        control={form.control}
                        name="pd"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2 lg:col-span-1">
                            <FormLabel>Distancia Pupilar (DP)</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: 62 mm" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="lentes-contacto">
                <AccordionTrigger className="font-semibold"><Microscope className="mr-2 h-5 w-5"/>Lentes de Contacto</AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                    <p className="text-sm font-medium pt-2 border-t">OD (Ojo Derecho)</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
                      <FormField control={form.control} name="clBrandOD" render={({ field }) => (<FormItem><FormLabel className="text-xs">Marca</FormLabel><FormControl><Input placeholder="Acuvue" {...field}/></FormControl></FormItem>)}/>
                      <FormField control={form.control} name="clBcOD" render={({ field }) => (<FormItem><FormLabel className="text-xs">BC</FormLabel><FormControl><Input placeholder="8.6" {...field}/></FormControl></FormItem>)}/>
                      <FormField control={form.control} name="clDiaOD" render={({ field }) => (<FormItem><FormLabel className="text-xs">DIA</FormLabel><FormControl><Input placeholder="14.5" {...field}/></FormControl></FormItem>)}/>
                      <FormField control={form.control} name="clPowerOD" render={({ field }) => (<FormItem><FormLabel className="text-xs">PWR</FormLabel><FormControl><Input placeholder="-2.00" {...field}/></FormControl></FormItem>)}/>
                      <FormField control={form.control} name="clCylOD" render={({ field }) => (<FormItem><FormLabel className="text-xs">CYL</FormLabel><FormControl><Input placeholder="-0.75" {...field}/></FormControl></FormItem>)}/>
                      <FormField control={form.control} name="clAxisOD" render={({ field }) => (<FormItem><FormLabel className="text-xs">Axis</FormLabel><FormControl><Input placeholder="180" {...field}/></FormControl></FormItem>)}/>
                    </div>
                     <p className="text-sm font-medium pt-2 border-t">OS (Ojo Izquierdo)</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
                      <FormField control={form.control} name="clBrandOS" render={({ field }) => (<FormItem><FormLabel className="text-xs">Marca</FormLabel><FormControl><Input placeholder="Biofinity" {...field}/></FormControl></FormItem>)}/>
                      <FormField control={form.control} name="clBcOS" render={({ field }) => (<FormItem><FormLabel className="text-xs">BC</FormLabel><FormControl><Input placeholder="8.7" {...field}/></FormControl></FormItem>)}/>
                      <FormField control={form.control} name="clDiaOS" render={({ field }) => (<FormItem><FormLabel className="text-xs">DIA</FormLabel><FormControl><Input placeholder="14.0" {...field}/></FormControl></FormItem>)}/>
                      <FormField control={form.control} name="clPowerOS" render={({ field }) => (<FormItem><FormLabel className="text-xs">PWR</FormLabel><FormControl><Input placeholder="-2.25" {...field}/></FormControl></FormItem>)}/>
                      <FormField control={form.control} name="clCylOS" render={({ field }) => (<FormItem><FormLabel className="text-xs">CYL</FormLabel><FormControl><Input placeholder="-1.25" {...field}/></FormControl></FormItem>)}/>
                      <FormField control={form.control} name="clAxisOS" render={({ field }) => (<FormItem><FormLabel className="text-xs">Axis</FormLabel><FormControl><Input placeholder="020" {...field}/></FormControl></FormItem>)}/>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas Adicionales del Paciente</FormLabel>
              <FormControl>
                <Textarea placeholder="Cualquier observación general sobre el paciente..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {patient ? 'Actualizar Paciente' : 'Registrar Paciente'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
    
