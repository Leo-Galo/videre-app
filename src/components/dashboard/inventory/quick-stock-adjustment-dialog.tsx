
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Package, Edit3, Loader2 } from 'lucide-react';
import type { Product } from '@/types/pos';
import { quickStockAdjustmentSchema, type QuickStockAdjustmentFormValues } from '@/types/inventory-schema';

interface QuickStockAdjustmentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product | null;
  onStockAdjusted: (productId: string, newStock: number, reason: string) => void;
  isAdmin: boolean;
}

export function QuickStockAdjustmentDialog({ isOpen, onOpenChange, product, onStockAdjusted, isAdmin }: QuickStockAdjustmentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<QuickStockAdjustmentFormValues>({
    resolver: zodResolver(quickStockAdjustmentSchema),
    defaultValues: {
      newStock: product?.stock || 0,
      reason: '',
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        newStock: product.stock,
        reason: '',
      });
    }
  }, [product, form, isOpen]); 

  const handleSubmitAdjustment = async (values: QuickStockAdjustmentFormValues) => {
    if (!product) return;
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 750));
    onStockAdjusted(product.id, values.newStock, values.reason);
    setIsLoading(false);
    onOpenChange(false); 
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" /> Ajuste Rápido de Stock
          </DialogTitle>
          <DialogDescription>
            Modifica la cantidad de stock para: <strong>{product.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmitAdjustment)} className="space-y-4 py-2">
            <div className="space-y-1">
                <p className="text-sm font-medium">Producto SKU: <span className="font-normal text-muted-foreground">{product.sku || 'N/A'}</span></p>
                <p className="text-sm font-medium">Stock Actual del Sistema: <span className="font-bold text-primary">{product.stock}</span> unidades</p>
            </div>
            
            <FormField
              control={form.control}
              name="newStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva Cantidad de Stock *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ej: 25" {...field} />
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
                  <FormLabel>Motivo del Ajuste *</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Ej: Conteo físico, Devolución, Producto dañado..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isAdmin ? 'Guardar Ajuste' : 'Solicitar Ajuste'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
