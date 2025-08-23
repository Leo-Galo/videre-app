
"use client";

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PackageMinus, Loader2 } from 'lucide-react';
import type { Product } from '@/types/pos';
import { damageLossSchema, type DamageLossFormValues } from '@/types/inventory-schema';

interface DamageLossAdjustmentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product | null;
  onAdjust: (productId: string, quantityToRemove: number, reason: string, notes: string) => void;
  isAdmin: boolean;
}

const adjustmentReasons = ["Dañado", "Vencido", "Pérdida", "Uso Interno", "Corrección de Conteo", "Otro"] as const;

export function DamageLossAdjustmentDialog({ isOpen, onOpenChange, product, onAdjust, isAdmin }: DamageLossAdjustmentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<DamageLossFormValues>({
    resolver: zodResolver(damageLossSchema),
    defaultValues: {
      quantityToRemove: 1,
      reason: "Dañado",
      notes: '',
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        quantityToRemove: 1,
        reason: "Dañado",
        notes: '',
      });
      form.trigger(); // Para que la validación se ejecute con el stock actual
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, isOpen]); // No incluir form directamente para evitar bucles


  const handleSubmitAdjustment = async (values: DamageLossFormValues) => {
    if (!product) return;

    if (values.quantityToRemove > product.stock) {
      form.setError("quantityToRemove", { 
        type: "manual", 
        message: `No puede dar de baja más unidades de las disponibles (${product.stock}).`
      });
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 750));
    onAdjust(product.id, values.quantityToRemove, values.reason, values.notes || '');
    setIsLoading(false);
    onOpenChange(false);
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isLoading) onOpenChange(open); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageMinus className="h-5 w-5" /> Registrar Baja de Inventario
          </DialogTitle>
          <DialogDescription>
            Producto: <strong>{product.name}</strong> (SKU: {product.sku || 'N/A'})
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmitAdjustment)} className="space-y-4 py-2">
            <p className="text-sm font-medium">Stock Actual: <span className="font-bold text-primary">{product.stock}</span> unidades</p>
            
            <FormField
              control={form.control}
              name="quantityToRemove"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad a Dar de Baja *</FormLabel>
                  <FormControl>
                    <Input 
                        type="number" 
                        placeholder="Ej: 1" 
                        {...field} 
                        min="1" 
                        max={product.stock}
                        onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (isNaN(val) || val < 1) {
                                field.onChange(1);
                            } else if (val > product.stock) {
                                field.onChange(product.stock);
                            } else {
                                field.onChange(val);
                            }
                        }}
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
                  <FormLabel>Motivo de la Baja *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un motivo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {adjustmentReasons.map(reasonVal => (
                        <SelectItem key={reasonVal} value={reasonVal}>{reasonVal}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Adicionales (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Detalles sobre el motivo de la baja..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading || !form.formState.isValid}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isAdmin ? "Confirmar Baja" : "Solicitar Baja"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
