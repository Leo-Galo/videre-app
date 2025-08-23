
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { Supplier } from '@/types/supplier';
import { Loader2 } from 'lucide-react';
import { supplierFormSchema, type SupplierFormValues } from '@/types/supplier-schema';

interface SupplierFormProps {
  supplier?: Supplier;
  onSuccess: (data: SupplierFormValues) => void;
  isLoading?: boolean;
}

export function SupplierForm({ supplier, onSuccess, isLoading: initialIsLoading = false }: SupplierFormProps) {
  const router = useRouter();
  const [isLoadingForm, setIsLoadingForm] = useState(initialIsLoading);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: supplier || {
      name: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
    },
  });

  useEffect(() => {
    const defaultValues = supplier || {
      name: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
    };
    form.reset(defaultValues);
  }, [supplier, form]);

  async function onSubmit(data: SupplierFormValues) {
    setIsLoadingForm(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    onSuccess(data);
    setIsLoadingForm(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Proveedor *</FormLabel>
              <FormControl>
                <Input placeholder="Ej: OptiSupply Co." {...field} disabled={isLoadingForm} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Contacto</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Juan Pérez" {...field} disabled={isLoadingForm} />
                </FormControl>
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
                  <Input type="tel" placeholder="Ej: 8888-7777" {...field} disabled={isLoadingForm} />
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
                <Input type="email" placeholder="contacto@proveedor.com" {...field} disabled={isLoadingForm} />
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
                <Textarea rows={2} placeholder="Dirección del proveedor..." {...field} disabled={isLoadingForm} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Condiciones, días de entrega, etc..." {...field} disabled={isLoadingForm} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoadingForm}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoadingForm}>
            {isLoadingForm && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {supplier ? 'Actualizar Proveedor' : 'Guardar Proveedor'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
