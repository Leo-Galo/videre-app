"use client";

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PackagePlus, PlusCircle, Trash2, Loader2, CalendarIcon, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Supplier } from '@/types/supplier';
import type { Product } from '@/types/pos';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SupplierReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  supplier: Supplier | null;
  allProducts: Product[];
  onReceiptProcessed: (data: { items: { productId: string; quantity: number; costPrice: number }[], referenceDocument?: string, date: Date }) => void;
}

const receiptItemSchema = z.object({
  productId: z.string().min(1, "Debe seleccionar un producto."),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a 0."),
  costPrice: z.coerce.number().nonnegative("El costo debe ser 0 o mayor."),
});

const receiptFormSchema = z.object({
  referenceDocument: z.string().optional(),
  date: z.date({ required_error: "La fecha del ingreso es requerida." }),
  items: z.array(receiptItemSchema).min(1, "Debe añadir al menos un producto."),
});

type ReceiptFormValues = z.infer<typeof receiptFormSchema>;

const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined) return 'N/A';
  return `¢${new Intl.NumberFormat('es-CR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
};

export function SupplierReceiptDialog({ isOpen, onOpenChange, supplier, allProducts, onReceiptProcessed }: SupplierReceiptDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: {
      referenceDocument: '',
      date: new Date(),
      items: [{ productId: '', quantity: 1, costPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const watchedItems = form.watch("items");

  useEffect(() => {
    if (!isOpen) {
      form.reset({
        referenceDocument: '',
        date: new Date(),
        items: [{ productId: '', quantity: 1, costPrice: 0 }],
      });
      setIsLoading(false);
    }
  }, [isOpen, form]);

  const handleSubmit = async (values: ReceiptFormValues) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    onReceiptProcessed(values);
    setIsLoading(false);
    onOpenChange(false);
  };
  
  const handleCostBlur = (event: React.FocusEvent<HTMLInputElement>, index: number) => {
    const selectedProductId = form.getValues(`items.${index}.productId`);
    if (!selectedProductId) return;

    const newCostStr = event.target.value;
    if (!newCostStr) return;
    
    const newCost = parseFloat(newCostStr);
    const selectedProduct = allProducts.find(p => p.id === selectedProductId);
    const oldCost = selectedProduct?.costPrice;

    if (typeof oldCost === 'number' && !isNaN(newCost) && newCost > oldCost) {
      toast({
        variant: "warning",
        title: "Alerta de Aumento de Costo",
        description: `El costo de "${selectedProduct.name}" ha subido de ${formatCurrency(oldCost)} a ${formatCurrency(newCost)}. Considere ajustar el precio de venta.`,
        duration: 8000,
      });
    }
  };

  if (!supplier) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLoading && onOpenChange(open)}>
      <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-6 w-6" /> Registrar Ingreso de Mercadería
          </DialogTitle>
          <DialogDescription>
            Proveedor: <strong>{supplier.name}</strong>. Introduce los productos recibidos para actualizar el stock.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 flex-grow overflow-hidden flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
              <FormField
                control={form.control}
                name="referenceDocument"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº Factura/Referencia Proveedor (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: FACT-12345" {...field} disabled={isLoading} />
                    </FormControl>
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Ingreso *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")} disabled={isLoading}>
                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus locale={es}/>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <ScrollArea className="flex-grow border rounded-md p-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[45%]">Producto *</TableHead>
                    <TableHead className="w-[20%] text-center">Cantidad Recibida *</TableHead>
                    <TableHead className="w-[25%] text-right">Costo Unitario (¢) *</TableHead>
                    <TableHead className="w-[10%] text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    const selectedProduct = allProducts.find(p => p.id === watchedItems[index]?.productId);
                    const newCost = watchedItems[index]?.costPrice;
                    const oldCost = selectedProduct?.costPrice;
                    const hasCostIncreased = typeof oldCost === 'number' && typeof newCost === 'number' && newCost > oldCost;
                    const costIncreasePercent = hasCostIncreased && oldCost > 0 ? ((newCost - oldCost) / oldCost) * 100 : 0;

                    return (
                    <TableRow key={field.id} className="align-top">
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.productId`}
                          render={({ field: itemField }) => (
                            <FormItem>
                              <Select onValueChange={itemField.onChange} value={itemField.value} disabled={isLoading}>
                                <FormControl>
                                  <SelectTrigger><SelectValue placeholder="Seleccione un producto" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {allProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (SKU: {p.sku || 'N/A'})</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field: itemField }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" placeholder="Cant." {...itemField} disabled={isLoading} min="1"/>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <FormField
                           control={form.control}
                           name={`items.${index}.costPrice`}
                           render={({ field: itemField }) => (
                             <FormItem>
                               <FormControl>
                                 <Input 
                                   type="number" 
                                   placeholder="Costo" 
                                   {...itemField}
                                   onBlur={(e) => {
                                      itemField.onBlur(e); // RHF's onBlur
                                      handleCostBlur(e, index);
                                    }}
                                   disabled={isLoading} 
                                   min="0" 
                                   step="any" 
                                   className="text-right" 
                                  />
                               </FormControl>
                               <FormMessage />
                             </FormItem>
                           )}
                          />
                          {hasCostIncreased && (
                            <Alert variant="warning" className="p-2 text-xs">
                                <TrendingUp className="h-4 w-4" />
                                <AlertTitle className="text-xs font-semibold">Aumento de Costo</AlertTitle>
                                <AlertDescription>
                                    Anterior: {formatCurrency(oldCost)}. Aumento del {costIncreasePercent.toFixed(1)}%.
                                </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={isLoading || fields.length <= 1} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </ScrollArea>
             <div className="flex-shrink-0">
                <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', quantity: 1, costPrice: 0 })} disabled={isLoading}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Fila de Producto
                </Button>
                <FormMessage>{form.formState.errors.items?.root?.message}</FormMessage>
            </div>
            <DialogFooter className="pt-4 border-t sticky bottom-0 bg-background py-3 z-10">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading || !form.formState.isValid}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Ingreso
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
