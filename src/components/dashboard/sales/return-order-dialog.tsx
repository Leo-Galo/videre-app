
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RotateCcw, AlertCircle, Loader2, MinusCircle, PlusCircle, Package } from 'lucide-react';
import type { Order, OrderItem, ReturnedItemInfo, OrderStatus } from '@/types/pos';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { returnFormSchema, ReturnFormValues } from '@/types/pos-schema'; // Corrected import

interface ReturnOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  order: Order | null;
  onReturnProcessed: (orderId: string, returnedItems: ReturnedItemInfo[], newStatus: OrderStatus, generalReason?: string) => void;
}

export function ReturnOrderDialog({ isOpen, onOpenChange, order, onReturnProcessed }: ReturnOrderDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ReturnFormValues>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      items: [],
      generalReturnReason: '',
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (isOpen && order) {
      const itemsToReturn = order.items.map(item => {
        const alreadyReturnedQty = order.returnedItems?.filter(ri => ri.productId === item.product.id).reduce((sum, ri) => sum + ri.quantityReturned, 0) || 0;
        return {
          orderItemId: item.product.id, // Usar product.id como identificador del OrderItem en este contexto
          productId: item.product.id,
          productName: item.product.name,
          originalQuantity: item.quantity,
          alreadyReturned: alreadyReturnedQty,
          quantityToReturn: 0,
        };
      });
      form.reset({ items: itemsToReturn, generalReturnReason: '' });
    } else if (!isOpen) {
      form.reset({ items: [], generalReturnReason: '' });
      setIsLoading(false);
    }
  }, [isOpen, order, form]);


  const handleQuantityChange = (index: number, change: number) => {
    const currentItem = form.getValues(`items.${index}`);
    const currentReturnQty = currentItem.quantityToReturn || 0;
    const maxReturnable = currentItem.originalQuantity - currentItem.alreadyReturned;
    let newQuantity = currentReturnQty + change;
    newQuantity = Math.max(0, Math.min(newQuantity, maxReturnable));
    form.setValue(`items.${index}.quantityToReturn`, newQuantity, { shouldValidate: true });
  };


  const handleSubmitReturn = async (values: ReturnFormValues) => {
    if (!order) return;
    setIsLoading(true);

    const itemsBeingReturned: ReturnedItemInfo[] = [];
    for (const item of values.items) {
      if (item.quantityToReturn > 0) {
        const maxReturnable = item.originalQuantity - item.alreadyReturned;
        if (item.quantityToReturn > maxReturnable) {
          toast({
            variant: "destructive",
            title: "Cantidad Excedida",
            description: `No puede devolver más de ${maxReturnable} unidades de "${item.productName}".`,
          });
          setIsLoading(false);
          return;
        }
        itemsBeingReturned.push({
          productId: item.productId,
          productName: item.productName,
          quantityReturned: item.quantityToReturn,
        });
      }
    }

    if (itemsBeingReturned.length === 0) {
      toast({ variant: "destructive", title: "Nada que Devolver", description: "Por favor, ingrese una cantidad para al menos un ítem." });
      setIsLoading(false);
      return;
    }
    
    // SIMULATED: Backend logic for processing return
    await new Promise(resolve => setTimeout(resolve, 1000));

    const totalOriginalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalCurrentlyReturned = itemsBeingReturned.reduce((sum, item) => sum + item.quantityReturned, 0);
    const totalPreviouslyReturned = order.returnedItems?.reduce((sum, item) => sum + item.quantityReturned, 0) || 0;
    const newTotalReturned = totalCurrentlyReturned + totalPreviouslyReturned;

    let newStatus: OrderStatus = newTotalReturned >= totalOriginalItems ? 'fully_returned' : 'partially_returned';
    
    onReturnProcessed(order.id, itemsBeingReturned, newStatus, values.generalReturnReason);
    setIsLoading(false);
    onOpenChange(false);
  };

  if (!order) return null;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(amount);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" /> Procesar Devolución para Orden #{order.orderNumber}
          </DialogTitle>
          <DialogDescription>
            Seleccione los productos y cantidades a devolver. El stock se actualizará simuladamente.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmitReturn)} className="space-y-4 flex-grow overflow-hidden flex flex-col">
            <ScrollArea className="flex-grow pr-2">
              <div className="mb-4 p-3 border rounded-md bg-muted/30">
                <p className="text-sm font-medium">Cliente: {order.customer?.name || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">Total Original: {formatCurrency(order.totalCRC)} | Estado Actual: {order.status}</p>
              </div>

              {fields.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 hidden sm:table-cell">Img</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-center">Cant. Comprada</TableHead>
                      <TableHead className="text-center">Ya Devuelto</TableHead>
                      <TableHead className="text-center w-40">Cant. a Devolver</TableHead>
                      <TableHead className="text-right">Precio Unit.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((fieldItem, index) => {
                      const orderItem = order.items.find(oi => oi.product.id === fieldItem.productId);
                      const maxReturnable = fieldItem.originalQuantity - fieldItem.alreadyReturned;
                      return (
                        <TableRow key={fieldItem.id}>
                           <TableCell className="hidden sm:table-cell">
                            {orderItem?.product.imageUrl ? (
                              <Image src={orderItem.product.imageUrl} alt={fieldItem.productName} width={32} height={32} className="rounded-sm aspect-square object-contain bg-muted/20"/>
                            ) : <Package className="h-6 w-6 text-muted-foreground"/>}
                          </TableCell>
                          <TableCell>
                            {fieldItem.productName}
                            <p className="text-xs text-muted-foreground">SKU: {orderItem?.product.sku || 'N/A'}</p>
                          </TableCell>
                          <TableCell className="text-center">{fieldItem.originalQuantity}</TableCell>
                          <TableCell className="text-center">{fieldItem.alreadyReturned}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(index, -1)} disabled={isLoading || (form.getValues(`items.${index}.quantityToReturn`) || 0) <= 0}>
                                <MinusCircle className="h-4 w-4" />
                              </Button>
                              <FormField
                                control={form.control}
                                name={`items.${index}.quantityToReturn`}
                                render={({ field: qtyField }) => (
                                  <FormItem className="w-16">
                                    <FormControl>
                                      <Input
                                        type="number"
                                        {...qtyField}
                                        className="h-7 text-center px-1"
                                        min="0"
                                        max={maxReturnable}
                                        onChange={(e) => {
                                           let val = parseInt(e.target.value, 10);
                                           if (isNaN(val)) val = 0;
                                           val = Math.max(0, Math.min(val, maxReturnable));
                                           qtyField.onChange(val);
                                        }}
                                        disabled={isLoading}
                                      />
                                    </FormControl>
                                    <FormMessage className="text-xs"/>
                                  </FormItem>
                                )}
                              />
                              <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(index, 1)} disabled={isLoading || (form.getValues(`items.${index}.quantityToReturn`) || 0) >= maxReturnable}>
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            </div>
                               {maxReturnable === 0 && <p className="text-xs text-muted-foreground mt-1">(No retornable)</p>}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(orderItem?.unitPrice || 0)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">No hay ítems en esta orden para devolver.</p>
              )}
            </ScrollArea>
            
            <FormField
              control={form.control}
              name="generalReturnReason"
              render={({ field }) => (
                <FormItem className="mt-auto pt-4 border-t">
                  <FormLabel>Motivo General de la Devolución *</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Ej: Producto defectuoso, Talla incorrecta, Cliente se arrepintió..." {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4 border-t sticky bottom-0 bg-background py-3 z-10">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading || !form.formState.isValid || !fields.some(item => (item.quantityToReturn || 0) > 0) }>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Procesar Devolución
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
