
"use client";

import { useState, useEffect, useMemo } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Repeat, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/types/pos';
import { transferFormSchema, type TransferFormValues } from '@/types/inventory-schema';

interface InventoryTransferDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  allProducts: Product[]; 
  branches: { id: string; name: string }[];
  onTransferProcessed: (transferData: TransferFormValues) => void;
}

export function InventoryTransferDialog({ isOpen, onOpenChange, allProducts, branches, onTransferProcessed }: InventoryTransferDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      fromBranchId: '',
      toBranchId: '',
      items: [{ productId: '', quantity: 1 }],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const fromBranchId = form.watch("fromBranchId");

  const productsAvailableInFromBranch = useMemo(() => {
    if (!fromBranchId) return [];
    return allProducts.filter(p => p.branchId === fromBranchId && p.stock > 0);
  }, [fromBranchId, allProducts]);

  useEffect(() => {
    if (!isOpen) {
      form.reset({
        fromBranchId: '',
        toBranchId: '',
        items: [{ productId: '', quantity: 1 }],
        notes: '',
      });
      setIsLoading(false);
    }
  }, [isOpen, form]);

  useEffect(() => {
    if (fromBranchId) {
      // Reset items when the origin branch changes to avoid inconsistencies
      form.setValue("items", [{ productId: '', quantity: 1 }]);
    }
  }, [fromBranchId, form.setValue]);


  const handleSubmitTransfer = async (values: TransferFormValues) => {
    setIsLoading(true);
    
    for (const item of values.items) {
      const productInOrigin = productsAvailableInFromBranch.find(p => p.id === item.productId);
      if (!productInOrigin) {
        toast({
          variant: "destructive",
          title: "Error en Producto",
          description: `El producto seleccionado (ID: ${item.productId}) no se encontró o no tiene stock en la sucursal de origen.`,
        });
        setIsLoading(false);
        return;
      }
      if (item.quantity > productInOrigin.stock) {
        toast({
          variant: "destructive",
          title: "Stock Insuficiente",
          description: `No hay suficiente stock de "${productInOrigin.name}" (${productInOrigin.sku}). Stock disponible: ${productInOrigin.stock}, Solicitado: ${item.quantity}.`,
        });
        setIsLoading(false);
        return;
      }
    }
    
    console.log("Simulating transfer request (validated):", values);
    
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    
    onTransferProcessed(values); // Call the callback to update parent state

    toast({
      title: "Solicitud de Traslado Enviada",
      description: "El traslado ha sido registrado y el stock se ha actualizado en esta simulación.",
    });
    setIsLoading(false);
    onOpenChange(false);
  };
  
  const getProductStock = (productId: string) => {
    const product = productsAvailableInFromBranch.find(p => p.id === productId);
    return product ? product.stock : 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" /> Iniciar Traslado de Inventario entre Sucursales
          </DialogTitle>
          <DialogDescription>
            Seleccione las sucursales de origen y destino, y los productos a trasladar.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmitTransfer)} className="space-y-4 flex-grow overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sticky top-0 bg-background py-2 z-10">
              <FormField
                control={form.control}
                name="fromBranchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desde Sucursal *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione sucursal origen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map(branch => (
                          <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="toBranchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hacia Sucursal *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione sucursal destino" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map(branch => (
                          <SelectItem key={branch.id} value={branch.id} disabled={branch.id === fromBranchId}>
                            {branch.name} {branch.id === fromBranchId && "(Origen)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Productos a Trasladar *</label>
              {fields.map((field, index) => {
                const selectedProductId = form.watch(`items.${index}.productId`);
                const maxQuantity = getProductStock(selectedProductId);
                return (
                  <div key={field.id} className="flex items-end gap-2 p-3 border rounded-md">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field: itemField }) => (
                        <FormItem className="flex-grow">
                          <FormLabel className="sr-only">Producto</FormLabel>
                          <Select 
                            onValueChange={itemField.onChange} 
                            value={itemField.value} 
                            disabled={isLoading || !fromBranchId}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={!fromBranchId ? "Seleccione origen primero" : "Seleccione un producto"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {productsAvailableInFromBranch.length > 0 ? productsAvailableInFromBranch.map(product => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} (Stock: {product.stock})
                                </SelectItem>
                              )) : <SelectItem value="no-products" disabled>No hay productos en esta sucursal</SelectItem>}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field: itemField }) => (
                        <FormItem className="w-28">
                          <FormLabel className="sr-only">Cantidad</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Cant." 
                              {...itemField} 
                              disabled={isLoading || !selectedProductId}
                              min="1"
                              max={maxQuantity > 0 ? maxQuantity : undefined} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={isLoading || fields.length <= 1}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ productId: '', quantity: 1 })}
                disabled={isLoading || !fromBranchId}
                className="mt-2"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Producto
              </Button>
              {form.formState.errors.items?.root && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.items.root.message}</p>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Adicionales (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Ej: Traslado urgente, materiales para pedido especial..." {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter className="pt-4 border-t sticky bottom-0 bg-background py-3 z-10">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Solicitar Traslado
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
