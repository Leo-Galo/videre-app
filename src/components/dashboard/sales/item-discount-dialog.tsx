"use client";

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from "@/components/ui/textarea";
import { Tag, Trash2, Loader2 } from 'lucide-react';
import type { OrderItem } from '@/types/pos';
import { itemDiscountSchema, type ItemDiscountFormValues } from '@/types/discount-schema';

interface ItemDiscountModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  item: OrderItem | null;
  form: UseFormReturn<ItemDiscountFormValues>; 
  onApply: (values: ItemDiscountFormValues) => void;
  onRemove: () => void; 
}

export function ItemDiscountModal({ isOpen, onOpenChange, item, form, onApply, onRemove }: ItemDiscountModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      form.reset({
        type: item.discount?.type || 'percentage',
        value: item.discount?.value || 0,
        reason: item.discount?.reason || '',
      });
    } else if (!isOpen) {
        form.reset({ type: 'percentage', value: 0, reason: '' });
    }
  }, [isOpen, item, form]);

  const handleFormSubmit = async (values: ItemDiscountFormValues) => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 300)); 
    onApply(values);
    setIsSaving(false);
  };
  
  const handleRemoveDiscountClick = () => {
    onRemove();
  }

  if (!item) return null;

  const currentDiscountExists = !!item.discount;
  const originalItemTotal = item.unitPrice * item.quantity;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isSaving) onOpenChange(open); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" /> Aplicar/Editar Descuento al Ítem
          </DialogTitle>
          <DialogDescription>
            Producto: <strong>{item.product.name}</strong>
            <br />
            Precio Original: {originalItemTotal.toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}
            ({item.quantity} x {item.unitPrice.toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })})
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Tipo de Descuento *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                      disabled={isSaving}
                    >
                      <FormItem className="flex items-center space-x-2">
                        <RadioGroupItem value="percentage" id={`type-percentage-${item.product.id}`} />
                        <FormLabel htmlFor={`type-percentage-${item.product.id}`} className="font-normal">Porcentaje (%)</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <RadioGroupItem value="fixed" id={`type-fixed-${item.product.id}`} />
                        <FormLabel htmlFor={`type-fixed-${item.product.id}`} className="font-normal">Monto Fijo (CRC)</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor del Descuento *</FormLabel>
                  <FormControl>
                    <Input 
                        type="number" 
                        placeholder={form.getValues("type") === "percentage" ? "Ej: 10 (para 10%)" : "Ej: 500 (para ₡500)"} 
                        {...field} 
                        disabled={isSaving} 
                        min="0"
                        step={form.getValues("type") === "percentage" ? "0.01" : "1"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo del Descuento (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Ej: Promoción especial, Descuento por volumen..." {...field} disabled={isSaving} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              {currentDiscountExists && (
                <Button type="button" variant="ghost" size="sm" onClick={handleRemoveDiscountClick} disabled={isSaving} className="mr-auto text-destructive hover:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Quitar Descuento
                </Button>
              )}
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving || !form.formState.isValid}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Aplicar Descuento
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
