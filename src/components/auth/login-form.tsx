

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { login } from "@/services/auth-service";
import type { ClinicUser } from "@/types/user";
import { useSessionActions } from "@/hooks/use-current-user";

const formSchema = z.object({
  email: z.string().email({ message: "Dirección de correo inválida." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setSession } = useSessionActions();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      const loginResult = await login(values);

      if (loginResult && loginResult.user) {
        // Set the session on the client side after successful login
        setSession(loginResult.user, loginResult.subscription);

        if (loginResult.user.role === 'SuperAdmin') {
            toast({
              title: "Inicio de Sesión Exitoso (SuperAdmin)",
              description: `¡Bienvenido, Super Admin!`,
            });
            router.push("/superadmin");
        } else {
            toast({
              title: "Inicio de Sesión Exitoso",
              description: `¡Bienvenido de nuevo, ${loginResult.user.name}!`,
            });
            router.push("/dashboard");
        }
      } else {
        // This case handles errors thrown from the server action that are caught by the try/catch
        throw new Error("Credenciales inválidas o error del servidor.");
      }

    } catch (error: any) {
      console.error("Login failed:", error);
      let description = error.message || "Un error inesperado ha ocurrido.";
      
      form.setError("password", { type: "manual", message: description });
      form.setError("email", { type: "manual", message: " " });
      toast({
        variant: "destructive",
        title: "Fallo de Inicio de Sesión",
        description,
      });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary">Ingresar a Videre</CardTitle>
        <CardDescription>Introduce tus credenciales para acceder a tu cuenta.</CardDescription>
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between">
              <Link href="/forgot-password" passHref>
                <Button variant="link" type="button" className="px-0 text-sm font-medium">¿Olvidaste tu contraseña?</Button>
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar Sesión
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <p className="text-sm text-muted-foreground">
          ¿No tienes una cuenta?{" "}
          <Link href="/register" passHref>
            <Button variant="link" type="button" className="px-0">Regístrate</Button>
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
