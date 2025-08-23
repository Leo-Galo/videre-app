"use client";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileDown, Printer, XCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface ReportPreviewModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  data: any[];
  columns: { key: string; label: string; format?: (value: any, row: any) => string | React.ReactNode }[];
}

export function ReportPreviewModal({ isOpen, onOpenChange, title, data, columns }: ReportPreviewModalProps) {
  const { toast } = useToast();

  const handleExportCsv = () => {
    toast({ title: "Exportación CSV (Simulado)", description: `Se descargaría el reporte "${title}" como CSV.` });
  };
  
  const handleExportPdf = () => {
    toast({ title: "Exportación PDF (Simulado)", description: `Se descargaría el reporte "${title}" como PDF.` });
  };

  const handlePrint = () => {
    toast({ title: "Impresión (Simulado)", description: `Se prepararía el reporte "${title}" para impresión.` });
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vista Previa: {title}</DialogTitle>
          <DialogDescription>
            Esta es una vista previa de los datos del reporte. Puedes exportarlos en diferentes formatos.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden border rounded-md">
          <ScrollArea className="h-full">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  {columns.map(col => <TableHead key={col.key}>{col.label}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length > 0 ? data.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map(col => (
                      <TableCell key={`${rowIndex}-${col.key}`}>
                        {col.format ? col.format(row[col.key], row) : row[col.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                      No hay datos disponibles para este reporte en el rango de fechas seleccionado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={handleExportCsv}><FileDown className="mr-2 h-4 w-4" /> Exportar CSV</Button>
          <Button variant="outline" onClick={handleExportPdf}><FileDown className="mr-2 h-4 w-4" /> Exportar PDF</Button>
          <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
          <DialogClose asChild>
            <Button variant="default"><XCircle className="mr-2 h-4 w-4" /> Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
