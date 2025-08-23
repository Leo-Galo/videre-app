// src/app/contact/page.tsx
"use client";

import { AppHeader } from "@/components/shared/app-header";
import { AppFooter } from "@/components/landing/app-footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Mail, MapPin } from "lucide-react";

// WhatsApp Icon SVG - Corrected
const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24" // Will be overridden by className
    height="24" // Will be overridden by className
    viewBox="0 0 16 16" // Native viewBox of the Bootstrap icon path
    className="h-5 w-5 text-primary flex-shrink-0" // Sets size and color
    fill="currentColor" // Ensures the path gets filled
  >
    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.854 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
  </svg>
);


const contactFormSchema = z.object({
  name: z.string().min(2, "El nombre es requerido."),
  email: z.string().email("Correo electrónico inválido."),
  subject: z.string().min(3, "El asunto es requerido."),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres."),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  async function onSubmit(values: ContactFormValues) {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    toast({
      title: "¡Mensaje Enviado!",
      description: "Gracias por contactarnos. Nos pondremos en contacto contigo pronto.",
    });
    form.reset();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow py-12 md:py-20">
        <div className="container mx-auto px-4">
          <section className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4">Contáctanos</h1>
            <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto">
              ¿Tienes preguntas, comentarios o necesitas soporte? Estamos aquí para ayudarte.
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-12">
            <Card className="shadow-xl rounded-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">Envíanos un Mensaje</CardTitle>
                <CardDescription>Completa el formulario y te responderemos a la brevedad.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input placeholder="Tu nombre" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Correo Electrónico</FormLabel><FormControl><Input type="email" placeholder="tu@ejemplo.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="subject" render={({ field }) => (
                      <FormItem><FormLabel>Asunto</FormLabel><FormControl><Input placeholder="Ej: Consulta sobre Plan Premium" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="message" render={({ field }) => (
                      <FormItem><FormLabel>Mensaje</FormLabel><FormControl><Textarea placeholder="Escribe tu mensaje aquí..." rows={5} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Enviar Mensaje
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <div className="space-y-8">
              <Card className="shadow-xl rounded-lg">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">Información de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-foreground/80">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Nuestra Oficina</h4>
                      <p>Geroma, Pavas. Boulevard Rohrmoser. SJO, Costa Rica.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                    <a href="mailto:info@videre.cr" className="hover:text-primary">info@videre.cr</a>
                  </div>
                  <div className="flex items-center gap-3">
                    <WhatsAppIcon />
                    <a 
                      href="https://wa.me/50671978968" 
                      className="hover:text-primary" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      +506 7197-8968 (WhatsApp)
                    </a>
                  </div>
                </CardContent>
              </Card>
               <Card className="shadow-xl rounded-lg">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">Horario de Atención</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-foreground/80">
                  <p><strong>Lunes a Viernes:</strong> 9:00 AM - 4:30 PM (GMT-6)</p>
                  <p><strong>Sábados:</strong> Cerrado</p>
                  <p><strong>Domingos y Feriados:</strong> Cerrado</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
