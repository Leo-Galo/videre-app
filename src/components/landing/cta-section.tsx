"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const contactFormSchema = z.object({
  firstName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  lastName: z.string().min(2, { message: "El apellido debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Dirección de correo inválida." }),
  phone: z.string().optional(),
  message: z.string().optional(),
});

export function CtaSection() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  async function onContactSubmit(values: z.infer<typeof contactFormSchema>) {
    setIsSubmitting(true);
    // console.log("Contact/Subscription form values:", values); // For development
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    
    setIsSubmitting(false);
    toast({
      title: "¡Solicitud Recibida!",
      description: "Gracias por tu interés. Si te suscribiste, recibirás nuestras novedades. Si dejaste un mensaje, te contactaremos pronto.",
    });
    form.reset();
  }

  return (
    <section id="cta" className="py-16 md:py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-headline font-bold mb-6">
          ¿Listo para Elevar tu Práctica Óptica?
        </h2>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-primary-foreground/90">
          Únete a cientos de optómetras que confían en Videre para optimizar sus operaciones y mejorar el cuidado del paciente. ¡Comienza tu prueba gratuita hoy!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto justify-center">
          <Button size="lg" variant="secondary" asChild className="shadow-lg hover:shadow-xl transition-shadow">
            <Link href="/register?plan=Premium">Inicia Tu Prueba Gratuita de 3 Días</Link>
          </Button>
        </div>
        <p className="mt-6 text-sm text-primary-foreground/80">
          Sin compromiso, cancela en cualquier momento.
        </p>
        
        <div className="mt-16 pt-12 border-t border-primary-foreground/20 max-w-xl mx-auto">
            <h3 className="text-2xl font-semibold mb-3 text-primary-foreground">Mantente Conectado</h3>
            <p className="text-primary-foreground/80 mb-6 text-center">
                Suscríbete a nuestro boletín para recibir las últimas noticias sobre Videre, consejos de gestión para ópticas y ofertas especiales. También puedes usar este formulario para enviarnos un mensaje rápido.
            </p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onContactSubmit)} className="space-y-6 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary-foreground/90">Nombre *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Tu nombre" 
                            {...field} 
                            className="bg-background/20 placeholder:text-primary-foreground/70 border-primary-foreground/30 text-primary-foreground focus:bg-background/30 focus:border-primary-foreground/50"
                          />
                        </FormControl>
                        <FormMessage className="text-red-300" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary-foreground/90">Apellido *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Tu apellido" 
                            {...field} 
                            className="bg-background/20 placeholder:text-primary-foreground/70 border-primary-foreground/30 text-primary-foreground focus:bg-background/30 focus:border-primary-foreground/50"
                          />
                        </FormControl>
                        <FormMessage className="text-red-300" />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary-foreground/90">Correo Electrónico *</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="tu@ejemplo.com" 
                          {...field} 
                          className="bg-background/20 placeholder:text-primary-foreground/70 border-primary-foreground/30 text-primary-foreground focus:bg-background/30 focus:border-primary-foreground/50"
                        />
                      </FormControl>
                      <FormMessage className="text-red-300" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary-foreground/90">Número de Teléfono <span className="text-primary-foreground/70">(Opcional)</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Tu número de teléfono" 
                          {...field} 
                          className="bg-background/20 placeholder:text-primary-foreground/70 border-primary-foreground/30 text-primary-foreground focus:bg-background/30 focus:border-primary-foreground/50"
                        />
                      </FormControl>
                      <FormMessage className="text-red-300" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary-foreground/90">Mensaje <span className="text-primary-foreground/70">(Opcional)</span></FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Si tienes alguna consulta específica, escríbela aquí..." 
                          {...field} 
                          className="bg-background/20 placeholder:text-primary-foreground/70 border-primary-foreground/30 text-primary-foreground focus:bg-background/30 focus:border-primary-foreground/50 min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage className="text-red-300" />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  variant="secondary" 
                  className="w-full sm:w-auto bg-primary-foreground text-primary hover:bg-primary-foreground/90" 
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Enviando..." : "Enviar"}
                </Button>
                <p className="text-xs text-primary-foreground/70 text-center pt-2">Respetamos tu privacidad. Puedes cancelar tu suscripción en cualquier momento.</p>
              </form>
            </Form>
        </div>
      </div>
    </section>
  );
}
