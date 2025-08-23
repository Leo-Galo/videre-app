
"use client";

import { PricingSection } from "@/components/landing/pricing-section";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";


export default function ChangePlanPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Button variant="outline" asChild>
                    <Link href="/dashboard/subscription">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a mi Suscripción
                    </Link>
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Selecciona tu Nuevo Plan</CardTitle>
                    <CardDescription>
                        Elige el plan que mejor se adapte a tus necesidades. Serás redirigido a una página de confirmación para completar el pago.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="bg-background rounded-xl shadow-lg overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
                <PricingSection />
            </div>
        </div>
    );
}
