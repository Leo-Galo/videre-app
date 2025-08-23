
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, ArrowLeft, BookOpen, Save } from "lucide-react";
import { addBlogPost } from "@/services/superadmin/blog-service";
import { blogPostFormSchema, type BlogPostFormValues } from "@/types/superadmin-schemas";

export default function NewBlogPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      author: "Equipo Videre",
      content: "",
      image: "",
      dataAiHint: "",
      tagsInput: "",
      status: "Draft",
    },
  });

  const titleValue = form.watch("title");
  useEffect(() => {
    if (titleValue && !form.getValues("slug")) {
      const generatedSlug = titleValue
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      form.setValue("slug", generatedSlug, { shouldValidate: true });
    }
  }, [titleValue, form]);


  async function onSubmit(values: BlogPostFormValues) {
    setIsLoading(true);

    const newPost = await addBlogPost(values);

    if (newPost) {
      toast({
        title: "Post Creado",
        description: `El post "${newPost.title}" ha sido creado exitosamente.`,
      });
      router.push("/superadmin/blog-management");
    } else {
      toast({
        variant: "destructive",
        title: "Error al Guardar",
        description: "No se pudo crear el nuevo post.",
      });
    }
    setIsLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline text-primary flex items-center gap-2">
          <BookOpen className="h-6 w-6" /> Crear Nuevo Post para el Blog
        </h1>
        <Button variant="outline" asChild>
          <Link href="/superadmin/blog-management">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Listado
          </Link>
        </Button>
      </div>

      <Card className="shadow-md rounded-xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="pt-6 space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título del Post *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: 5 Consejos para Cuidar tu Visión" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug (URL Amigable) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: 5-consejos-vision" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Se auto-genera del título si se deja vacío. Usar minúsculas, números y guiones.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Autor *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Dr. Alan Grant" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contenido del Post (Markdown Simulado) *</FormLabel>
                    <FormControl>
                      <Textarea rows={15} placeholder="Escribe aquí el contenido del post. Puedes usar sintaxis Markdown básica (simulado)." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>URL de Imagen Destacada (Opcional)</FormLabel>
                            <FormControl>
                            <Input type="url" placeholder="https://placehold.co/800x400.png" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="dataAiHint"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Palabras Clave Imagen (Opcional)</FormLabel>
                            <FormControl>
                            <Input placeholder="Ej: 'doctor sonrisa', 'gafas moda'" {...field} />
                            </FormControl>
                            <FormDescription className="text-xs">Para data-ai-hint (max 2 palabras).</FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
              <FormField
                control={form.control}
                name="tagsInput"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (separados por comas, opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Salud Visual, Lentes, Consejos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Draft">Borrador</SelectItem>
                        <SelectItem value="Published">Publicado</SelectItem>
                        <SelectItem value="Archived">Archivado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardContent className="border-t pt-6 flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Guardar Post
              </Button>
            </CardContent>
          </form>
        </Form>
      </Card>
    </div>
  );
}
