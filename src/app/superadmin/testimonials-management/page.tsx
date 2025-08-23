
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button, buttonVariants } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as UiFormDescription } from '@/components/ui/form';
import { MoreHorizontal, Search, Edit, Trash2, PlusCircle, MessageSquareQuote, Loader2, UploadCloud, Image as ImageIconLucide } from 'lucide-react';
import type { Testimonial } from '@/types/index';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getTestimonials, addTestimonial, updateTestimonial, deleteTestimonial } from '@/services/superadmin/testimonial-service';
import { testimonialFormSchema, type TestimonialFormValues } from '@/types/superadmin-schemas';


export default function SuperAdminTestimonialsPage() {
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialFormSchema),
    defaultValues: { name: '', title: '', quote: '', initials: '' },
  });

  useEffect(() => {
    async function loadTestimonials() {
        const data = await getTestimonials();
        setTestimonials(data);
        setIsLoading(false);
    }
    loadTestimonials();
  }, []);

  const handleOpenForm = (testimonial?: Testimonial) => {
    if (testimonial) {
      setEditingTestimonial(testimonial);
      form.reset(testimonial);
    } else {
      setEditingTestimonial(null);
      form.reset({ name: '', title: '', quote: '', initials: '' });
    }
    setIsFormOpen(true);
  };
  
  const handleFormSubmit = async (values: TestimonialFormValues) => {
    setIsSaving(true);
    
    let success = false;
    if (editingTestimonial) {
      success = await updateTestimonial(editingTestimonial.id, values);
      if (success) toast({ title: "Testimonio Actualizado", description: `Testimonio de ${values.name} guardado.` });
    } else {
      const newTestimonial = await addTestimonial(values);
      if (newTestimonial) {
        success = true;
        toast({ title: "Testimonio Añadido", description: `Testimonio de ${values.name} creado.` });
      }
    }
    
    if (success) {
      const updatedData = await getTestimonials();
      setTestimonials(updatedData);
    } else {
        toast({ variant: "destructive", title: "Error al guardar" });
    }
    
    setIsFormOpen(false);
    setEditingTestimonial(null);
    setIsSaving(false);
  };

  const handleDeleteConfirm = async () => {
    if (testimonialToDelete) {
      const success = await deleteTestimonial(testimonialToDelete.id);
      if (success) {
        setTestimonials(prev => prev.filter(t => t.id !== testimonialToDelete.id));
        toast({ title: "Testimonio Eliminado", description: `Testimonio de ${testimonialToDelete.name} eliminado.` });
      } else {
         toast({ variant: "destructive", title: "Error al eliminar" });
      }
      setTestimonialToDelete(null);
    }
  };

  const filteredTestimonials = useMemo(() => {
    return testimonials.filter(t =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.quote.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [testimonials, searchTerm]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-4 w-2/3 mb-6" />
        <Card className="shadow-md rounded-xl">
          <CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader>
          <CardContent><Skeleton className="h-80 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            <MessageSquareQuote className="h-7 w-7" /> Gestión de Testimonios
          </h1>
          <p className="text-muted-foreground">
            Administra los testimonios que se muestran en la página de inicio.
          </p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <PlusCircle className="mr-2 h-5 w-5" /> Añadir Testimonio
        </Button>
      </div>

      <Card className="shadow-md rounded-xl">
        <CardHeader>
          <CardTitle>Listado de Testimonios</CardTitle>
          <div className="mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre, título o cita..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full md:w-1/2 lg:w-1/3"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTestimonials.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">Título/Cargo</TableHead>
                    <TableHead>Cita (Extracto)</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTestimonials.map((testimonial) => (
                    <TableRow key={testimonial.id}>
                      <TableCell className="font-medium">{testimonial.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{testimonial.title}</TableCell>
                      <TableCell className="max-w-xs truncate" title={testimonial.quote}>
                        "{testimonial.quote.substring(0, 50)}{testimonial.quote.length > 50 ? '...' : ''}"
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleOpenForm(testimonial)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive hover:!text-destructive"
                              onClick={() => setTestimonialToDelete(testimonial)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <p>No se encontraron testimonios. Puedes añadir uno nuevo.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!isSaving) setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTestimonial ? "Editar Testimonio" : "Añadir Nuevo Testimonio"}</DialogTitle>
            <DialogDescription>
              Completa los detalles del testimonio.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nombre*</FormLabel><FormControl><Input placeholder="Nombre de la persona" {...field} disabled={isSaving} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Título/Cargo*</FormLabel><FormControl><Input placeholder="Ej: Optómetra, Gerente de Óptica" {...field} disabled={isSaving} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="quote" render={({ field }) => (
                <FormItem><FormLabel>Cita del Testimonio*</FormLabel><FormControl><Textarea rows={4} placeholder="Escribe aquí la cita..." {...field} disabled={isSaving} /></FormControl><FormMessage /></FormItem>
              )}/>
              
              <FormField control={form.control} name="initials" render={({ field }) => (
                <FormItem><FormLabel>Iniciales* (1-3 letras)</FormLabel><FormControl><Input placeholder="Ej: AR" {...field} disabled={isSaving} /></FormControl><FormMessage /></FormItem>
              )}/>

              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingTestimonial ? "Guardar Cambios" : "Crear Testimonio"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={testimonialToDelete !== null} onOpenChange={(open) => !open && setTestimonialToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar el testimonio de "{testimonialToDelete?.name}"? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTestimonialToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className={cn(buttonVariants({ variant: "destructive" }))}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
