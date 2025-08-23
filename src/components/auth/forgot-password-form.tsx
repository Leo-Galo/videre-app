
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
  email: z.string().email({ message: "Dirección de correo inválida." }),
});

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    // SIMULATED: Backend logic for sending password reset email
    // TODO: Backend Integration - Call Firebase Auth sendPasswordResetEmail(auth, values.email)
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setSubmitted(true);

    toast({
      title: "Correo de Restablecimiento Enviado",
      description: `Si existe una cuenta para ${values.email}, recibirás un correo con instrucciones para restablecer tu contraseña.`,
    });
  }

  if (submitted) {
    return (
       <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary">Revisa Tu Correo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/80">
            Hemos enviado un enlace para restablecer la contraseña a la dirección de correo electrónico que proporcionaste, si está asociada con una cuenta. Por favor, revisa tu bandeja de entrada (y la carpeta de spam).
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/login" passHref className="w-full">
            <Button variant="outline" className="w-full">Volver a Iniciar Sesión</Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary">¿Olvidaste tu Contraseña?</CardTitle>
        <CardDescription>¡No te preocupes! Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="tu@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Enlace de Restablecimiento
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <Link href="/login" passHref className="w-full">
          <Button variant="link" type="button" className="w-full">Volver a Iniciar Sesión</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
