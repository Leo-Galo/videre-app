
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Palette, Bell, KeyRound, Eye, EyeOff, Image as ImageIconLucide, Link as LinkIcon, Check, CreditCard, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import NextImage from 'next/image';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { superAdminPasswordSchema, type SuperAdminPasswordFormValues } from "@/types/superadmin-schemas";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface GlobalSettings {
  platformName?: string;
  defaultLogoUrl?: string;
  defaultPrimaryColor?: string;
  heroImageUrl?: string;
  aboutPageImageUrl?: string;
  adminNotificationEmail?: string;
  defaultSenderEmail?: string;
  socialInstagramUrl?: string;
  socialFacebookUrl?: string;
  socialYoutubeUrl?: string;
  paypalClientId?: string;
  paypalClientSecret?: string;
}

export default function SuperAdminSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<GlobalSettings>({});
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [showPayPalSecret, setShowPayPalSecret] = useState(false);
  
  useEffect(() => {
    setIsLoading(prev => ({...prev, page: true}));
    const saved = localStorage.getItem("videreGlobalSettings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse global settings from localStorage", e);
      }
    }
    setIsLoading(prev => ({...prev, page: false}));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async (sectionName: string, event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(prev => ({ ...prev, [sectionName]: true }));
    console.log(`Saving ${sectionName} settings (simulated):`, settings);
    await new Promise(resolve => setTimeout(resolve, 1000));
    localStorage.setItem("videreGlobalSettings", JSON.stringify(settings));
    toast({
      title: "Configuración Guardada",
      description: `Los ajustes para "${sectionName}" han sido actualizados.`,
    });
    setIsLoading(prev => ({ ...prev, [sectionName]: false }));
  };

  const passwordForm = useForm<SuperAdminPasswordFormValues>({
    resolver: zodResolver(superAdminPasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  async function onPasswordFormSubmit(values: SuperAdminPasswordFormValues) {
    setIsPasswordLoading(true);
    console.log("Changing SuperAdmin password (simulated):", values.newPassword);
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (values.currentPassword !== "Videre.2025!!") { 
      passwordForm.setError("currentPassword", { type: "manual", message: "Contraseña actual incorrecta (simulado)." });
      toast({ variant: "destructive", title: "Error de Contraseña" });
      setIsPasswordLoading(false);
      return;
    }
    toast({ title: "Contraseña de SuperAdmin Actualizada" });
    passwordForm.reset();
    setIsPasswordLoading(false);
  }

  const passwordRequirements = [
    "Al menos 8 caracteres", "Una letra mayúscula", "Una letra minúscula", "Un número", "Un carácter especial (!@#$...)",
  ];

  if (isLoading['page']) {
    return <Skeleton className="h-[800px] w-full" />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary">Configuración Global de Videre</h1>
        <p className="text-muted-foreground">Administra las configuraciones maestras de la plataforma Videre.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Configuración de Pasarela de Pago (PayPal)</CardTitle>
          <CardDescription>Introduce las credenciales API de PayPal para procesar los pagos de suscripciones.</CardDescription>
        </CardHeader>
        <form onSubmit={(e) => handleSaveSettings('Pasarela de Pago', e)}>
            <CardContent className="space-y-4">
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>¡Atención! Zona de Alta Seguridad</AlertTitle>
                    <AlertDescription>
                      NUNCA compartas tus claves secretas. Estos campos son una simulación. En un entorno real, tu desarrollador de backend debe almacenar estas claves de forma segura en variables de entorno del servidor.
                    </AlertDescription>
                </Alert>
                <div className="space-y-1.5">
                    <Label htmlFor="paypalClientId">PayPal Client ID</Label>
                    <Input id="paypalClientId" name="paypalClientId" placeholder="Tu Client ID de producción de PayPal" value={settings.paypalClientId || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="paypalClientSecret">PayPal Client Secret</Label>
                    <div className="relative">
                       <Input id="paypalClientSecret" name="paypalClientSecret" type={showPayPalSecret ? "text" : "password"} placeholder="••••••••••••••••••••" value={settings.paypalClientSecret || ''} onChange={handleInputChange} />
                       <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2" onClick={() => setShowPayPalSecret(!showPayPalSecret)}>{showPayPalSecret ? <EyeOff /> : <Eye />}</Button>
                    </div>
                </div>
            </CardContent>
             <CardFooter className="border-t pt-6 flex justify-end">
                <Button type="submit" disabled={isLoading['Pasarela de Pago']}>
                {isLoading['Pasarela de Pago'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Check className="mr-2 h-4 w-4" /> Guardar Configuración de Pago
                </Button>
            </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIconLucide className="h-5 w-5 text-primary" /> Gestión de Contenido (Landing)
          </CardTitle>
          <CardDescription>Actualiza las imágenes principales de la página de inicio y "Sobre Nosotros".</CardDescription>
        </CardHeader>
        <form onSubmit={(e) => handleSaveSettings('Contenido Landing', e)}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="heroImageUrl">URL Imagen Hero Principal</Label>
              <Input id="heroImageUrl" name="heroImageUrl" type="url" placeholder="https://i.imgur.com/imagen.png" value={settings.heroImageUrl || ''} onChange={handleInputChange} />
              <p className="text-xs text-muted-foreground">Recomendado: 1200x800px. Usa un enlace directo a la imagen (ej: de Imgur).</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aboutPageImageUrl">URL Imagen "Sobre Nosotros"</Label>
              <Input id="aboutPageImageUrl" name="aboutPageImageUrl" type="url" placeholder="https://i.imgur.com/otra-imagen.png" value={settings.aboutPageImageUrl || ''} onChange={handleInputChange} />
              <p className="text-xs text-muted-foreground">Recomendado: 600x400px.</p>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6 flex justify-end">
            <Button type="submit" disabled={isLoading['Contenido Landing']}>
              {isLoading['Contenido Landing'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Check className="mr-2 h-4 w-4" /> Guardar Cambios
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Personalización y Marca</CardTitle>
            <CardDescription>Configura la apariencia por defecto para nuevas clínicas y enlaces de redes sociales.</CardDescription>
          </CardHeader>
          <form onSubmit={(e) => handleSaveSettings('Personalización y Marca', e)}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                  <Label htmlFor="platformName">Nombre de la Plataforma</Label>
                  <Input id="platformName" name="platformName" value={settings.platformName || ''} onChange={handleInputChange} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                    <Label htmlFor="defaultLogoUrl">URL Logo por Defecto</Label>
                    <Input id="defaultLogoUrl" name="defaultLogoUrl" type="url" placeholder="https://i.imgur.com/logo-defecto.png" value={settings.defaultLogoUrl || ''} onChange={handleInputChange}/>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="defaultPrimaryColor">Color Primario por Defecto (Hex)</Label>
                    <Input id="defaultPrimaryColor" name="defaultPrimaryColor" placeholder="#468189" value={settings.defaultPrimaryColor || ''} onChange={handleInputChange}/>
                </div>
              </div>
              <div className="space-y-1.5">
                  <Label htmlFor="socialInstagramUrl">URL Instagram</Label>
                  <Input id="socialInstagramUrl" name="socialInstagramUrl" type="url" placeholder="https://www.instagram.com/tu_usuario" value={settings.socialInstagramUrl || ''} onChange={handleInputChange}/>
              </div>
              <div className="space-y-1.5">
                  <Label htmlFor="socialFacebookUrl">URL Facebook</Label>
                  <Input id="socialFacebookUrl" name="socialFacebookUrl" type="url" placeholder="https://www.facebook.com/tu_pagina" value={settings.socialFacebookUrl || ''} onChange={handleInputChange}/>
              </div>
              <div className="space-y-1.5">
                  <Label htmlFor="socialYoutubeUrl">URL YouTube</Label>
                  <Input id="socialYoutubeUrl" name="socialYoutubeUrl" type="url" placeholder="https://www.youtube.com/tu_canal" value={settings.socialYoutubeUrl || ''} onChange={handleInputChange}/>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-end">
                <Button type="submit" disabled={isLoading['Personalización y Marca']}>
                {isLoading['Personalización y Marca'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Check className="mr-2 h-4 w-4" /> Guardar Cambios
                </Button>
            </CardFooter>
          </form>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Notificaciones</CardTitle><CardDescription>Configura los correos para notificaciones globales.</CardDescription></CardHeader>
        <form onSubmit={(e) => handleSaveSettings('Notificaciones', e)}>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <Label htmlFor="adminNotificationEmail">Email Admin para Alertas</Label>
                        <Input id="adminNotificationEmail" name="adminNotificationEmail" type="email" placeholder="superadmin@videre.com" value={settings.adminNotificationEmail || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="defaultSenderEmail">Email Remitente (No-Reply)</Label>
                        <Input id="defaultSenderEmail" name="defaultSenderEmail" type="email" placeholder="noreply@videre.com" value={settings.defaultSenderEmail || ''} onChange={handleInputChange} />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-end">
                <Button type="submit" disabled={isLoading['Notificaciones']}>
                {isLoading['Notificaciones'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Check className="mr-2 h-4 w-4" /> Guardar Cambios
                </Button>
            </CardFooter>
        </form>
      </Card>
      
      <Separator />

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Cambiar Contraseña de SuperAdmin</CardTitle><CardDescription>Actualiza la contraseña de acceso principal para este panel.</CardDescription></CardHeader>
        <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordFormSubmit)} className="space-y-6">
                <CardContent className="space-y-4">
                    <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (<FormItem><FormLabel>Contraseña Actual *</FormLabel><FormControl><div className="relative"><Input type={showCurrentPassword ? "text" : "password"} {...field} disabled={isPasswordLoading} /><Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>{showCurrentPassword ? <EyeOff /> : <Eye />}</Button></div></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (<FormItem><FormLabel>Nueva Contraseña *</FormLabel><FormControl><div className="relative"><Input type={showNewPassword ? "text" : "password"} {...field} disabled={isPasswordLoading} /><Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2" onClick={() => setShowNewPassword(!showNewPassword)}>{showNewPassword ? <EyeOff /> : <Eye />}</Button></div></FormControl><ul className="list-disc list-inside text-xs text-muted-foreground mt-1">{passwordRequirements.map(req => <li key={req}>{req}</li>)}</ul><FormMessage /></FormItem>)}/>
                    <FormField control={passwordForm.control} name="confirmNewPassword" render={({ field }) => (<FormItem><FormLabel>Confirmar Nueva Contraseña *</FormLabel><FormControl><div className="relative"><Input type={showConfirmNewPassword ? "text" : "password"} {...field} disabled={isPasswordLoading} /><Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>{showConfirmNewPassword ? <EyeOff /> : <Eye />}</Button></div></FormControl><FormMessage /></FormItem>)}/>
                </CardContent>
                <CardFooter className="border-t pt-6"><Button type="submit" disabled={isPasswordLoading}>{isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Actualizar Contraseña</Button></CardFooter>
            </form>
        </Form>
      </Card>
    </div>
  );
}
