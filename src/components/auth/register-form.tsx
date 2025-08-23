"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { register } from "@/services/auth-service";
import { registerFormSchema } from "@/types/auth-schemas";
import { useSessionActions } from "@/hooks/use-current-user";

// Eliminamos la palabra 'export' aquí
function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { setSession } = useSessionActions();

  const form = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      clinicName: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
      referrerId: "",
    },
  });

  // Effect to read userId from URL and set it in the form
  useEffect(() => {
    const userIdFromUrl = searchParams.get('userId');
    if (userIdFromUrl) {
      form.setValue('referrerId', userIdFromUrl);
      console.log("UserID obtenido de la URL:", userIdFromUrl);
    }
  }, [searchParams, form]);


  async function onSubmit(values: z.infer<typeof registerFormSchema>) {
    setIsLoading(true);
    try {
      const plan = searchParams.get('plan') || 'Premium'; // Default to Premium if no plan is specified
      const loginResult = await register(values, plan);

      if (loginResult && loginResult.user) {
        setSession(loginResult.user, loginResult.subscription);

        toast({
            title: "Registro Exitoso",
            description: `¡Bienvenido a Videre, ${loginResult.user.name}!`,
        });
        router.push("/dashboard");
      } else {
        throw new Error("No se pudo completar el registro.");
      }

    } catch (error: any) {
        console.error("Registration failed:", error);
        let description = "Ocurrió un error inesperado. Por favor, intenta de nuevo.";
         if (error.code === 'auth/email-already-in-use') {
             description = 'Este correo electrónico ya está registrado. Por favor, intenta iniciar sesión.';
             form.setError("email", { type: 'manual', message: 'Este correo ya está en uso.'});
         }
      toast({
        variant: "destructive",
        title: "Fallo en el Registro",
        description: description,
      });
    } finally {
        setIsLoading(false);
    }
  }
  
  const passwordRequirements = [
    "Al menos 8 caracteres",
    "Una letra mayúscula",
    "Una letra minúscula",
    "Un número",
    "Un carácter especial (!@#$...)",
  ];


  return (
    <Card className="w-full max-w-lg shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary">Crea tu Cuenta Videre</CardTitle>
        <CardDescription>Inicia tu prueba gratuita de 3 días. No se requiere tarjeta de crédito.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="clinicName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Clínica *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre de Tu Clínica" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tu Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tus Apellidos *</FormLabel>
                    <FormControl>
                      <Input placeholder="Tus apellidos" {...field} />
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
                  <FormLabel>Tu Correo Electrónico (será tu usuario Admin) *</FormLabel>
                  <FormControl>
                    <Input placeholder="tu@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña *</FormLabel>
                  <FormControl>
                      <div className="relative">
                      <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                       <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5 mt-1">
                      {passwordRequirements.map(req => <li key={req}>{req}</li>)}
                  </ul>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Contraseña *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                       <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             {/* Hidden field for referrerId */}
            <FormField
              control={form.control}
              name="referrerId"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input type="hidden" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal">
                      Acepto los{" "}
                      <Link href="/terms" className="text-primary hover:underline" target="_blank">Términos de Servicio</Link> y la {" "}
                      <Link href="/privacy" className="text-primary hover:underline" target="_blank">Política de Privacidad</Link> de Videre.
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Cuenta y Empezar
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/login" passHref>
            <Button variant="link" type="button" className="px-0">Inicia Sesión</Button>
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

// Y aquí, hacemos la exportación por defecto
export default RegisterForm;
