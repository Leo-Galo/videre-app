
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { Product } from '@/types/pos';
import { Loader2, UploadCloud, Image as ImageIcon, AlertCircle, Trash2, CalendarIcon } from 'lucide-react';
import Image from 'next/image';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { productFormSchema, type ProductFormValues } from '@/types/inventory-schema';
import type { DiscountTagConfig } from '@/config/discounts';
import { getProductCategories, getDiscountTags } from '@/services/settings-service';
import { Badge } from '@/components/ui/badge';

// Simulación de sucursales disponibles para una óptica
// TODO: Backend Integration - Fetch branches from Firestore/API for the current clinic
const mockBranches = [
  { id: 'branch1', name: 'Sucursal Central' },
  { id: 'branch2', name: 'Sucursal Norte' },
  { id: 'branch3', name: 'Sucursal Satélite' },
];

interface ProductFormProps {
  product?: Product;
  onSuccess: (data: ProductFormValues & { expiryDate?: string }) => void; // Ensure onSuccess can handle string date
  isLoading?: boolean;
}

export function ProductForm({ product, onSuccess, isLoading: initialIsLoading = false }: ProductFormProps) {
  const { toast } = useToast();
  const [isLoadingForm, setIsLoadingForm] = useState(initialIsLoading);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.imageUrl || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [discountTags, setDiscountTags] = useState<DiscountTagConfig[]>([]);
  const [userPlan, setUserPlan] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const [fetchedCategories, fetchedTags] = await Promise.all([
        getProductCategories(),
        getDiscountTags(),
      ]);
      setCategories(fetchedCategories);
      setDiscountTags(fetchedTags);
    }
    loadData();

    const plan = localStorage.getItem('subscriptionPlan');
    setUserPlan(plan ? plan.toLowerCase() : 'basic');

  }, []);

  const isPremiumPlan = userPlan === 'premium';
  const productHasExistingTag = product?.tag && product.tag !== 'Ninguna';

  const defaultValues: ProductFormValues = {
    name: product?.name || '',
    sku: product?.sku || '',
    category: product?.category || '',
    description: product?.description || '',
    price: product?.price || 0,
    costPrice: product?.costPrice === undefined || product?.costPrice === null ? '' : product.costPrice,
    stock: product?.stock || 0,
    supplier: product?.supplier || '',
    lowStockThreshold: product?.lowStockThreshold === undefined || product?.lowStockThreshold === null ? '' : product.lowStockThreshold,
    imageUrl: product?.imageUrl || '',
    dataAiHint: product?.dataAiHint || '',
    branchId: product?.branchId || mockBranches[0]?.id || '', 
    expiryDate: product?.expiryDate ? parseISO(product.expiryDate) : undefined,
    tag: product?.tag || 'Ninguna',
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (product) {
      form.reset({
        ...product,
        costPrice: product.costPrice === undefined || product.costPrice === null ? '' : product.costPrice,
        lowStockThreshold: product.lowStockThreshold === undefined || product.lowStockThreshold === null ? '' : product.lowStockThreshold,
        branchId: product.branchId || mockBranches[0]?.id || '',
        expiryDate: product.expiryDate ? parseISO(product.expiryDate) : undefined,
        tag: product.tag || 'Ninguna',
      });
      setImagePreview(product.imageUrl || null);
    } else {
      form.reset(defaultValues); 
      setImagePreview(null);
    }
  }, [product, form]);


  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Max 2MB
        toast({
          variant: "destructive",
          title: "Archivo Demasiado Grande",
          description: "La imagen no debe exceder los 2MB.",
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        form.setValue('imageUrl', result, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    form.setValue('imageUrl', '', { shouldValidate: true });
    const fileInput = document.getElementById('productImageUpload') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
  };

  async function onSubmit(data: ProductFormValues) {
    setIsLoadingForm(true);
    
    let finalData: any = { ...data }; // Use any temporarily for easier modification

    if (!imageFile && product?.imageUrl && !imagePreview) { 
        finalData.imageUrl = ''; 
    } else if (imagePreview && imageFile) { 
        finalData.imageUrl = imagePreview; 
    } else if (imagePreview && !imageFile && product?.imageUrl === imagePreview) { 
        finalData.imageUrl = product.imageUrl;
    } else if (!imagePreview) {
        finalData.imageUrl = '';
    }
    
    finalData.costPrice = data.costPrice === '' ? undefined : Number(data.costPrice);
    finalData.lowStockThreshold = data.lowStockThreshold === '' ? undefined : Number(data.lowStockThreshold);
    finalData.expiryDate = data.expiryDate ? data.expiryDate.toISOString().split('T')[0] : undefined; // Convert to YYYY-MM-DD string
    
    const selectedBranch = mockBranches.find(b => b.id === finalData.branchId);
    const submissionData = {
        ...finalData,
        branchName: selectedBranch ? selectedBranch.name : undefined
    };

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onSuccess(submissionData as ProductFormValues & { expiryDate?: string }); 
    setIsLoadingForm(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-1 space-y-2">
            <FormLabel>Imagen del Producto</FormLabel>
            <div className="aspect-[4/3] w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-2 hover:border-primary transition-colors relative group bg-muted/20">
              {imagePreview ? (
                <>
                  <Image src={imagePreview} alt="Vista previa" fill style={{ objectFit: 'contain' }} className="rounded-md" />
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={removeImage}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Quitar imagen</span>
                  </Button>
                </>
              ) : (
                <label htmlFor="productImageUpload" className="cursor-pointer text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                  <UploadCloud className="mx-auto h-10 w-10 mb-2" />
                  <p className="text-sm">Subir imagen</p>
                  <p className="text-xs">Max 2MB</p>
                </label>
              )}
              <Input 
                id="productImageUpload"
                type="file" 
                accept="image/png, image/jpeg, image/gif, image/webp" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer sr-only"
                onChange={handleImageChange}
                disabled={isLoadingForm}
              />
            </div>
            <FormDescription className="text-xs">Una imagen clara ayuda a vender tu producto.</FormDescription>
             <FormField
              control={form.control}
              name="dataAiHint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Palabras Clave Imagen (AI)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: gafas sol redondas" {...field} disabled={isLoadingForm} />
                  </FormControl>
                  <FormDescription className="text-xs">Para búsquedas de imágenes (max 2 palabras).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="md:col-span-2 space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Producto *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Armazón Ray-Ban Aviator Clásico" {...field} disabled={isLoadingForm} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: RB3025-001" {...field} disabled={isLoadingForm} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría *</FormLabel>
                    <FormControl>
                        <>
                          <Input
                            placeholder="Escribe o selecciona una categoría"
                            {...field}
                            list="category-list"
                            disabled={isLoadingForm}
                          />
                          <datalist id="category-list">
                            {categories.map((cat) => (
                              <option key={cat} value={cat} />
                            ))}
                          </datalist>
                        </>
                    </FormControl>
                    <FormDescription className="text-xs">
                        Escribe para buscar una categoría o simplemente teclea un nombre nuevo para crearla.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Detalles sobre el producto, materiales, características especiales..." {...field} disabled={isLoadingForm} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Precio de Venta *</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} disabled={isLoadingForm} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio de Costo</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} disabled={isLoadingForm} />
                      </FormControl>
                      <FormDescription className="text-xs">Opcional. Para cálculo de rentabilidad.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Stock Inicial *</FormLabel>
                        <FormControl>
                            <Input type="number" step="1" placeholder="0" {...field} disabled={isLoadingForm} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="lowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Umbral Stock Bajo</FormLabel>
                      <FormControl>
                         <Input type="number" step="1" placeholder="Ej: 10" {...field} disabled={isLoadingForm} />
                      </FormControl>
                      <FormDescription className="text-xs">Opcional. Para alertas de stock bajo.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
             
             {(isPremiumPlan || productHasExistingTag) && (
              <FormField
                control={form.control}
                name="tag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Etiqueta de Oferta
                      {!isPremiumPlan && <Badge variant="secondary" className="bg-yellow-400/20 border-yellow-500 text-yellow-600">Premium</Badge>}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingForm || !isPremiumPlan}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sin etiqueta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {discountTags.map(tag => (
                          <SelectItem key={tag.name} value={tag.name}>
                            {tag.name === 'Ninguna' ? 'Sin Etiqueta' : `Etiqueta ${tag.name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      {isPremiumPlan
                        ? "Aplica descuentos automáticos en el POS. Se gestionan en Configuración."
                        : "Función del plan Premium. No puedes modificar esta etiqueta."
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
             )}

             <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del proveedor" {...field} disabled={isLoadingForm} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sucursal *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingForm}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una sucursal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockBranches.map(branch => (
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
                name="expiryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Caducidad (Opcional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isLoadingForm}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Seleccione una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) } // Optional: disable past dates
                          initialFocus
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription className="text-xs">Para productos como gotas, soluciones, etc.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={() => form.reset(defaultValues)} disabled={isLoadingForm}>
            {product ? 'Restablecer Cambios' : 'Limpiar Formulario'}
          </Button>
          <Button type="submit" disabled={isLoadingForm}>
            {isLoadingForm && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {product ? 'Actualizar Producto' : 'Guardar Producto'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
