
"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, CreditCard, AlertTriangle, Loader2 } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useSessionStore } from '@/hooks/use-current-user';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PayPalScriptProvider, PayPalButtons, type CreateSubscriptionActions, type OnApproveData } from "@paypal/react-paypal-js";
import { cn } from '@/lib/utils';
import { createPayPalOrder } from '@/services/subscription-service';
import apiFetch from '@/lib/api-client';

const plansData = [
  { id: 'Basic', name: 'Básico', price: '49.00' },
  { id: 'Pro', name: 'Pro', price: '99.00' },
  { id: 'Premium', name: 'Premium', price: '139.00' },
];

function ConfirmPaymentPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const { actions } = useSessionStore();
    
    const planId = searchParams.get('plan');
    const cycle = (searchParams.get('cycle') as 'monthly' | 'annually') || 'monthly';
    const selectedPlan = plansData.find(p => p.id === planId);
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const PAYPAL_CLIENT_ID = "AY-7DT6Hv7OryabUjfOhfTBtwqeaGroh9V3k7jpFwoLr2Nlpg938ASpinnAiDeZl8qbGlBoi9LecljFc";
    
    // Definitive URL for backend.
    const backendUrl = "https://us-central1-videre-saas-26178.cloudfunctions.net/v1";


    if (!selectedPlan) {
        return (
            <Card className="shadow-lg rounded-xl text-center p-8">
                <CardTitle className="flex items-center justify-center gap-2"><AlertTriangle className="h-6 w-6 text-destructive"/> Plan no válido</CardTitle>
                <CardContent className="mt-4">
                    <p className="text-muted-foreground">No se ha seleccionado un plan válido. Por favor, vuelve y elige uno.</p>
                    <Button asChild className="mt-4"><Link href="/dashboard/subscription/change-plan">Volver a Planes</Link></Button>
                </CardContent>
            </Card>
        );
    }
    
    const handleCreateSubscription = async (data: Record<string, unknown>, actions: CreateSubscriptionActions): Promise<string> => {
        setError(null);
        console.log(`[Frontend] Iniciando creación de suscripción para el plan: ${selectedPlan.name}`);
        
        try {
            // El frontend llama a nuestro backend para crear la suscripción.
            // NUNCA se comunica directamente con PayPal con claves secretas.
            const response = await apiFetch<{subscriptionID: string}>(`${backendUrl}/create-subscription`, {
                method: 'POST',
                body: JSON.stringify({
                    planName: selectedPlan.name,
                    // En una app real, enviarías el ID del usuario/clínica autenticado
                }),
            });

            if (!response || !response.subscriptionID) {
                throw new Error("La respuesta del backend no incluyó un ID de suscripción.");
            }

            console.log("[Frontend] ID de suscripción recibido del backend:", response.subscriptionID);
            return response.subscriptionID;

        } catch (err: any) {
            console.error("[Frontend] Error al llamar al backend para crear la suscripción:", err);
            setError(err.message || "No se pudo iniciar el proceso de pago. Por favor, intenta de nuevo.");
            return Promise.reject(err);
        }
    };
    
    const handleOnApprove = async (data: OnApproveData) => {
        setIsProcessing(true);
        console.log("[Frontend] El usuario ha aprobado la suscripción en PayPal:", data);
        toast({ variant: 'default', title: '¡Suscripción Aprobada!', description: `Procesando la activación del plan ${selectedPlan.name}. Tu panel se actualizará en breve.` });
        
        // El backend recibirá un webhook de PayPal para activar la suscripción en la base de datos.
        // Mientras tanto, podemos actualizar el estado en el frontend de forma optimista.
        const user = useSessionStore.getState();
        actions.setSession({ ...user }, { plan: selectedPlan.name, status: 'active' });

        // Redirigir al usuario
        router.push('/dashboard/subscription');
        return Promise.resolve();
    };

    return (
        <PayPalScriptProvider options={{ "client-id": PAYPAL_CLIENT_ID, "vault": true, "intent": "subscription" }}>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Button variant="outline" asChild><Link href="/dashboard/subscription/change-plan"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Link></Button>
                </div>
                
                 <Card className="shadow-lg rounded-xl max-w-lg mx-auto">
                    <CardHeader>
                        <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2"><CreditCard className="h-6 w-6" /> Confirmar y Suscribir</CardTitle>
                        <CardDescription>Estás a punto de suscribirte al plan <strong>{selectedPlan.name}</strong>.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center text-lg mb-4">Total a pagar: <strong>${selectedPlan.price} USD/mes</strong></p>
                        
                        {isProcessing && (
                            <div className="flex flex-col items-center justify-center text-center p-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                <p className="text-sm text-muted-foreground">Procesando, por favor espera...</p>
                            </div>
                        )}
                        
                        <div className={cn(isProcessing && 'hidden')}>
                            <PayPalButtons
                                style={{
                                    shape: 'pill',
                                    color: 'blue',
                                    layout: 'vertical',
                                    label: 'subscribe'
                                }}
                                createSubscription={handleCreateSubscription}
                                onApprove={handleOnApprove}
                                onError={(err: any) => {
                                    console.error('Error de PayPal:', err);
                                    setError("Ocurrió un error inesperado con PayPal. Por favor, refresca la página e inténtalo de nuevo.");
                                    toast({ variant: 'destructive', title: 'Error de PayPal', description: 'No se pudo completar el pago.' });
                                    setIsProcessing(false);
                                }}
                            />
                        </div>
                        
                        {error && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Error de Pago</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <p className="text-xs text-muted-foreground text-center mt-2">Al continuar, aceptas que tu suscripción se renovará automáticamente.</p>
                    </CardContent>
                </Card>
            </div>
        </PayPalScriptProvider>
    );
}


export default function ConfirmPaymentPage() {
    return (
        <Suspense fallback={<Skeleton className="h-80 w-full" />}>
           <ConfirmPaymentPageContent />
        </Suspense>
    )
}
