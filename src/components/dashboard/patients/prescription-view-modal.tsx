
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FileText, Printer, XCircle, UserCircle2, CalendarDays, Microscope } from 'lucide-react';
import type { Prescription } from '@/types/patient';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";

interface PrescriptionViewModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  prescription: Prescription | null;
  patientName: string; 
}

export function PrescriptionViewModal({ isOpen, onOpenChange, prescription, patientName }: PrescriptionViewModalProps) {
  const { toast } = useToast();

  if (!prescription) return null;

  const handlePrint = () => {
    // TODO: Implement actual print functionality
    // This could involve window.print() on a specific printable version of this content,
    // or generating a PDF on the backend.
    toast({
      title: "Impresión de Receta (Simulación)",
      description: `Se prepararía la receta de ${patientName} del ${formatDate(prescription.date)} para impresión.`,
    });
  };

  const formatDate = (dateString?: string, dateFormat: string = 'dd MMMM, yyyy') => {
    if (!dateString) return 'N/A';
    try { return format(parseISO(dateString), dateFormat, { locale: es }); } 
    catch { return 'Fecha Inválida'; }
  };

  const DetailRow = ({ label, value }: { label: string; value?: string | string[] | null }) => {
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0) || String(value).trim() === '') return null;
    return (
      <div className="grid grid-cols-3 gap-2 py-1">
        <dt className="text-muted-foreground font-medium col-span-1">{label}:</dt>
        <dd className="text-foreground col-span-2">{Array.isArray(value) ? value.join(', ') : value}</dd>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Microscope className="h-7 w-7 text-primary" /> Receta Óptica Detallada
          </DialogTitle>
          <DialogDescription className="pt-1">
            Paciente: <strong className="text-foreground">{patientName}</strong>
            <br />
            Fecha de Prescripción: {formatDate(prescription.date)}
            {prescription.expiryDate && ` | Válida hasta: ${formatDate(prescription.expiryDate)}`}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow overflow-y-auto px-6 py-4">
          <div className="space-y-5">
            
            <section>
              <h4 className="font-semibold text-primary mb-2 text-lg">Información General de la Prescripción</h4>
              <dl className="space-y-0.5 text-sm">
                <DetailRow label="Tipo de Lente" value={prescription.lensType} />
                <DetailRow label="Material del Lente" value={prescription.lensMaterial} />
                <DetailRow label="Tratamientos del Lente" value={prescription.lensCoatings} />
              </dl>
            </section>

            {(prescription.sphericalOD || prescription.sphericalOS || prescription.prismOD || prescription.prismOS) && (
              <section>
                <Separator className="my-3"/>
                <h4 className="font-semibold text-primary mb-2 text-lg">Refracción Lentes Oftálmicos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 text-sm">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground/90">Ojo Derecho (OD)</p>
                    <DetailRow label="Esfera" value={prescription.sphericalOD} />
                    <DetailRow label="Cilindro" value={prescription.cylinderOD} />
                    <DetailRow label="Eje" value={prescription.axisOD} />
                    <DetailRow label="Adición" value={prescription.addOD} />
                    <DetailRow label="Prisma" value={prescription.prismOD} />
                    <DetailRow label="Base Prisma" value={prescription.baseOD} />
                    <DetailRow label="Altura" value={prescription.fittingHeightOD ? `${prescription.fittingHeightOD}mm` : undefined} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground/90">Ojo Izquierdo (OS)</p>
                    <DetailRow label="Esfera" value={prescription.sphericalOS} />
                    <DetailRow label="Cilindro" value={prescription.cylinderOS} />
                    <DetailRow label="Eje" value={prescription.axisOS} />
                    <DetailRow label="Adición" value={prescription.addOS} />
                    <DetailRow label="Prisma" value={prescription.prismOS} />
                    <DetailRow label="Base Prisma" value={prescription.baseOS} />
                     <DetailRow label="Altura" value={prescription.fittingHeightOS ? `${prescription.fittingHeightOS}mm` : undefined} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-sm mt-2">
                  <DetailRow label="DP Lejos" value={prescription.pd ? `${prescription.pd}mm` : undefined} />
                  <DetailRow label="DP Cerca" value={prescription.pdNear ? `${prescription.pdNear}mm` : undefined} />
                  <DetailRow label="Distancia Vértice" value={prescription.vertexDistance ? `${prescription.vertexDistance}mm` : undefined} />
                </div>
              </section>
            )}

            {(prescription.frameBrand || prescription.frameModel) && (
              <section>
                <Separator className="my-3"/>
                <h4 className="font-semibold text-primary mb-2 text-lg">Detalles del Armazón</h4>
                <dl className="space-y-0.5 text-sm">
                    <DetailRow label="Marca" value={prescription.frameBrand} />
                    <DetailRow label="Modelo" value={prescription.frameModel} />
                    <DetailRow label="Color" value={prescription.frameColor} />
                    <DetailRow label="Medidas" value={prescription.frameMeasurements} />
                    {prescription.frameNotes && <DetailRow label="Notas Armazón" value={prescription.frameNotes} />}
                </dl>
              </section>
            )}
            
            {(prescription.clBrandOD || prescription.clBrandOS || prescription.clMaterial) && (
              <section>
                <Separator className="my-3"/>
                <h4 className="font-semibold text-primary mb-2 text-lg">Detalles Lentes de Contacto</h4>
                <DetailRow label="Material L.C." value={prescription.clMaterial} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 text-sm">
                    <div className="space-y-1">
                        <p className="font-medium text-foreground/90">OD (Ojo Derecho)</p>
                        <DetailRow label="Marca" value={prescription.clBrandOD} />
                        <DetailRow label="BC" value={prescription.clBcOD} />
                        <DetailRow label="DIA" value={prescription.clDiaOD} />
                        <DetailRow label="Poder" value={prescription.clPowerOD} />
                        <DetailRow label="Cilindro" value={prescription.clCylOD} />
                        <DetailRow label="Eje" value={prescription.clAxisOD} />
                        <DetailRow label="Adición L.C." value={prescription.clAddPowerOD} />
                        <DetailRow label="Color" value={prescription.clColorOD} />
                    </div>
                    <div className="space-y-1">
                        <p className="font-medium text-foreground/90">OS (Ojo Izquierdo)</p>
                        <DetailRow label="Marca" value={prescription.clBrandOS} />
                        <DetailRow label="BC" value={prescription.clBcOS} />
                        <DetailRow label="DIA" value={prescription.clDiaOS} />
                        <DetailRow label="Poder" value={prescription.clPowerOS} />
                        <DetailRow label="Cilindro" value={prescription.clCylOS} />
                        <DetailRow label="Eje" value={prescription.clAxisOS} />
                        <DetailRow label="Adición L.C." value={prescription.clAddPowerOS} />
                        <DetailRow label="Color" value={prescription.clColorOS} />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-sm mt-2">
                    <DetailRow label="Diseño Multifocal" value={prescription.clMultifocalDesign} />
                    <DetailRow label="Esquema de Uso" value={prescription.clWearSchedule} />
                    <DetailRow label="Reemplazo" value={prescription.clReplacementSchedule} />
                    <DetailRow label="Cant. Suministrada" value={prescription.clQuantitySupplied} />
                </div>
              </section>
            )}

            {prescription.optometristNotes && (
              <section>
                <Separator className="my-3"/>
                <h4 className="font-semibold text-primary mb-1 text-lg">Notas del Optómetra</h4>
                <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md border">{prescription.optometristNotes}</p>
              </section>
            )}

            <Separator className="my-3"/>
            <div className="text-sm">
                <p><strong>Optómetra:</strong> {prescription.optometristName || 'N/A'} {prescription.optometristLicense && `(Código Profesional: ${prescription.optometristLicense})`}</p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-muted/20">
          <Button type="button" variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir Receta
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="default">
             <XCircle className="mr-2 h-4 w-4" /> Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
