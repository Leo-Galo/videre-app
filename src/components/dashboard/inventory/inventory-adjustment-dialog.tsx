
"use client";

import { useState, useEffect } from 'react';
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/types/pos';

interface InventoryAdjustmentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentProducts: Product[]; 
}

interface ComparedItem extends Product {
  physicalStock?: number;
  difference?: number;
  justification?: string;
}

export function InventoryAdjustmentDialog({ isOpen, onOpenChange, currentProducts }: InventoryAdjustmentDialogProps) {
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [comparedItems, setComparedItems] = useState<ComparedItem[]>([]);
  const [isFileProcessed, setIsFileProcessed] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv') {
        toast({
          variant: 'destructive',
          title: 'Archivo Inválido',
          description: 'Por favor, sube un archivo CSV.',
        });
        setUploadedFile(null);
        event.target.value = ''; 
        return;
      }
      setUploadedFile(file);
      setIsFileProcessed(false); 
      setComparedItems([]);
    }
  };

  const processFile = async () => {
    if (!uploadedFile) {
      toast({ variant: 'destructive', title: 'Error', description: 'No hay archivo seleccionado.' });
      return;
    }

    // SIMULATED: File processing and comparison
    // TODO: Backend Integration - Implement CSV parsing and comparison logic here or on the server.
    // For CSV parsing, you might use a library like 'papaparse'.
    // The logic would involve:
    // 1. Reading the CSV.
    // 2. For each row, find the matching product in `currentProducts` by SKU.
    // 3. Calculate the difference and populate `ComparedItem`.
    await new Promise(resolve => setTimeout(resolve, 1000)); 

    const dummyCompared: ComparedItem[] = currentProducts.map(p => {
      const physical = Math.max(0, p.stock + Math.floor(Math.random() * 11) - 5); 
      return {
        ...p,
        physicalStock: physical,
        difference: physical - p.stock,
        justification: (physical - p.stock !== 0) ? '' : undefined, 
      };
    }).filter(p => p.difference !== 0); 

    if (dummyCompared.length === 0) {
        toast({ title: 'Sin Diferencias', description: 'El conteo coincide con el inventario del sistema o no hay productos para comparar.' });
    }

    setComparedItems(dummyCompared);
    setIsFileProcessed(true);
    toast({ title: 'Archivo Procesado', description: 'Se ha completado la comparación. Revisa las diferencias.' });
  };
  
  const handleJustificationChange = (id: string, value: string) => {
    setComparedItems(prev => prev.map(item => item.id === id ? { ...item, justification: value } : item));
  };

  const handleRequestAdjustments = () => {
    const itemsWithMissingJustification = comparedItems.filter(item => item.difference !== 0 && !item.justification?.trim());
    if (itemsWithMissingJustification.length > 0) {
      toast({
        variant: "destructive",
        title: "Justificación Requerida",
        description: `Por favor, proporciona una justificación para todos los productos con diferencias. (${itemsWithMissingJustification.map(i => i.name).join(', ')})`
      });
      return;
    }
    // SIMULATED: Request adjustments
    // TODO: Backend Integration - Send `comparedItems` (only those with differences and justifications) to a backend endpoint.
    // The backend would then:
    // 1. Validate the request (e.g., check admin permissions).
    // 2. Create adjustment records/logs in Firestore.
    // 3. Update product stock quantities.
    // 4. Potentially trigger notifications for approval if needed.
    console.log("Solicitando ajustes para:", comparedItems.filter(item => item.difference !== 0));
    toast({
      title: "Ajustes Solicitados",
      description: "Los ajustes de inventario han sido enviados para aprobación del administrador.",
    });
    onOpenChange(false); 
    
    setUploadedFile(null);
    setComparedItems([]);
    setIsFileProcessed(false);
    const fileInput = document.getElementById('inventory-csv-upload') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
  };

  useEffect(() => {
    if (!isOpen) {
      setUploadedFile(null);
      setComparedItems([]);
      setIsFileProcessed(false);
      const fileInput = document.getElementById('inventory-csv-upload') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
    }
  }, [isOpen]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Ajuste de Inventario por Conteo
          </DialogTitle>
          <DialogDescription>
            Sube el archivo CSV con el conteo físico para compararlo con el sistema y solicitar ajustes.
            La plantilla debe tener las columnas: SKU, Nombre, StockFisico.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 items-start">
          <div>
            <Label htmlFor="inventory-csv-upload" className="mb-2 block">
              1. Subir Archivo de Conteo (.csv)
            </Label>
            <div className="flex items-center gap-2">
                <Input
                    id="inventory-csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="flex-grow"
                />
                <Button onClick={processFile} disabled={!uploadedFile || isFileProcessed} className="flex-shrink-0">
                    <FileText className="mr-2 h-4 w-4" /> Procesar Archivo
                </Button>
            </div>
            {uploadedFile && <p className="text-xs mt-1 text-muted-foreground">Archivo seleccionado: {uploadedFile.name}</p>}
          </div>
           {isFileProcessed && comparedItems.length === 0 && (
            <div className="md:col-span-2 flex items-center justify-center p-6 bg-muted/50 rounded-md text-center">
                <p className="text-muted-foreground">No se encontraron diferencias significativas o el archivo no contenía datos comparables.</p>
            </div>
           )}
        </div>

        {isFileProcessed && comparedItems.length > 0 && (
          <div className="flex-grow overflow-y-auto space-y-4 pr-2">
            <h3 className="text-md font-semibold mb-2">2. Comparativa y Justificaciones (Solo Diferencias)</h3>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto (SKU)</TableHead>
                    <TableHead className="text-center">Stock Sistema</TableHead>
                    <TableHead className="text-center">Stock Físico</TableHead>
                    <TableHead className="text-center">Diferencia</TableHead>
                    <TableHead className="w-[30%]">Justificación (Requerida si hay diferencia)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparedItems.map((item) => (
                    <TableRow key={item.id} className={item.difference !== 0 ? (item.difference! < 0 ? 'bg-red-500/10' : 'bg-green-500/10') : ''}>
                      <TableCell>
                        {item.name}
                        <p className="text-xs text-muted-foreground">{item.sku || 'N/A'}</p>
                      </TableCell>
                      <TableCell className="text-center">{item.stock}</TableCell>
                      <TableCell className="text-center">{item.physicalStock ?? 'N/A'}</TableCell>
                      <TableCell className={`text-center font-semibold ${item.difference !== 0 ? (item.difference! < 0 ? 'text-red-600' : 'text-green-600') : ''}`}>
                        {item.difference?.toString() ?? 'N/A'}
                      </TableCell>
                      <TableCell>
                        {item.difference !== 0 && (
                           <Textarea
                            placeholder="Motivo de la diferencia..."
                            value={item.justification || ''}
                            onChange={(e) => handleJustificationChange(item.id, e.target.value)}
                            rows={2}
                            className="text-xs"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        
        { !isFileProcessed && !uploadedFile &&
            <div className="flex-grow flex items-center justify-center text-muted-foreground text-center border rounded-md p-8">
                <p>Sube un archivo CSV para iniciar la comparación del inventario.</p>
            </div>
        }
         {uploadedFile && !isFileProcessed &&
            <div className="flex-grow flex items-center justify-center text-muted-foreground text-center border rounded-md p-8">
                <p>Haz clic en "Procesar Archivo" para ver la comparación.</p>
            </div>
        }


        <DialogFooter className="pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleRequestAdjustments} disabled={!isFileProcessed || comparedItems.length === 0}>
            Solicitar Ajustes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
