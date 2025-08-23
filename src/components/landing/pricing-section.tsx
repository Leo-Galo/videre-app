
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Check, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation"; 

const plansData = [
  {
    name: "Básico",
    monthlyPrice: 49,
    description: "Para ópticas pequeñas que están comenzando.",
    features: [
      "Prueba gratuita de 3 días",
      "Gestión de Pacientes con Historial Clínico",
      "Inventario (hasta 500 productos)",
      "Punto de Venta (POS) con Tiquete Electrónico",
      "Control Logístico (Órdenes a Laboratorio y Mensajería)",
      "Módulo de Caja Chica",
      "Reportes de Ventas (solo visualización)",
      "Hasta 1 sucursal y 2 usuarios",
      "Soporte por Correo",
    ],
    cta: "Elegir Plan",
    planId: "Basic",
    highlight: false,
    annualDiscountPercent: 20,
  },
  {
    name: "Pro",
    monthlyPrice: 99,
    description: "Para ópticas en crecimiento que necesitan más potencia.",
    features: [
      "Todo lo del plan Básico",
      "Inventario Ilimitado",
      "Facturación Electrónica (CR v4.4)",
      "Gestión de Proveedores (Listado y Contactos)",
      "Reportes Avanzados con Exportación a CSV",
      "Gestión Multi-sucursal (hasta 2)",
      "Hasta 5 usuarios",
      "Soporte Prioritario vía Email y Chat",
    ],
    cta: "Elegir Plan",
    planId: "Pro",
    highlight: false,
    annualDiscountPercent: 20,
  },
  {
    name: "Premium",
    monthlyPrice: 139,
    description: "La solución completa para ópticas establecidas.",
    features: [
      "Todo lo del plan Pro",
      "Control de Gastos y Rentabilidad",
      "Presupuestos y Proyecciones Financieras",
      "Gestión de Convenios y Cupones de Descuento",
      "Gestión de Proveedores Completa (con movimientos)",
      "Integraciones con APIs Externas",
      "Hasta 5 sucursales y Usuarios Ilimitados",
      "Soporte Telefónico Dedicado",
    ],
    cta: "Elegir Plan",
    planId: "Premium",
    highlight: true,
    annualDiscountPercent: 20,
  },
];


export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const pathname = usePathname();

  const isDashboardContext = pathname.startsWith('/dashboard/subscription');

  const getButtonLink = (planId: string) => {
    if (isDashboardContext) {
      // In the dashboard, it should go to a confirmation/payment page
      return `/dashboard/subscription/confirm-payment?plan=${planId}&cycle=${billingCycle}`;
    }
    // On the landing page, it should go to the registration page
    return `/register?plan=${planId}`;
  };


  return (
    <section id="pricing" className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">
            Planes Flexibles para Cada Tamaño
          </h2>
          <p className="mt-4 text-lg text-foreground/70 max-w-2xl mx-auto">
            Elige el plan perfecto que se ajuste a las necesidades y presupuesto de tu óptica. Todos los planes comienzan con una prueba gratuita de 3 días.
          </p>
        </div>

        <div className="flex items-center justify-center space-x-3 mb-12">
          <Label
            htmlFor="billing-cycle-switch"
            className={cn(
              "text-sm font-medium cursor-pointer",
              billingCycle === 'monthly' ? 'text-primary' : 'text-muted-foreground'
            )}
            onClick={() => setBillingCycle('monthly')}
          >
            Ver Planes Mensuales
          </Label>
          <Switch
            id="billing-cycle-switch"
            checked={billingCycle === 'annually'}
            onCheckedChange={(checked) => setBillingCycle(checked ? 'annually' : 'monthly')}
            aria-label="Cambiar ciclo de facturación"
          />
          <Label
            htmlFor="billing-cycle-switch"
            className={cn(
              "text-sm font-medium cursor-pointer",
              billingCycle === 'annually' ? 'text-primary' : 'text-muted-foreground'
            )}
            onClick={() => setBillingCycle('annually')}
          >
            Ver Planes Anuales (Ahorra ~{plansData[0].annualDiscountPercent}%)
          </Label>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {plansData.map((plan) => {
            const isAnnual = billingCycle === 'annually';
            const effectiveMonthlyPrice = isAnnual
              ? plan.monthlyPrice * (1 - plan.annualDiscountPercent / 100)
              : plan.monthlyPrice;
            const totalAnnualPrice = plan.monthlyPrice * (1 - plan.annualDiscountPercent / 100) * 12;
            
            const displayPriceString = isAnnual ? totalAnnualPrice.toFixed(2) : effectiveMonthlyPrice.toFixed(2);
            const periodText = isAnnual ? "/año" : "/mes";
            
            const isHighlighted = plan.highlight;

            const annualSavingsFeatureText = `Ahorra ~${plan.annualDiscountPercent}% (¡Casi 2 meses gratis!)`;
            let featuresToShow = [...plan.features];
            if (isAnnual && plan.name !== "Básico") { 
              const basicMonthlyAnnualEquivalent = plansData[0].monthlyPrice * (1- plansData[0].annualDiscountPercent/100);
              if(plan.monthlyPrice > plansData[0].monthlyPrice || effectiveMonthlyPrice > basicMonthlyAnnualEquivalent ) {
                 featuresToShow.splice(1,0,annualSavingsFeatureText);
              }
            }

            return (
              <Card
                key={plan.name}
                onMouseEnter={() => setHoveredPlan(plan.name)}
                onMouseLeave={() => setHoveredPlan(null)}
                className={cn(
                  "flex flex-col rounded-xl border-2 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-2xl hover:border-primary/80",
                  (hoveredPlan === plan.name || (hoveredPlan === null && isHighlighted))
                  ? 'border-primary ring-4 ring-primary/20 shadow-2xl'
                  : 'border-border shadow-lg'
                )}
              >
                {plan.highlight && (
                   <div className="absolute top-0 right-0 bg-slate-800 text-white px-3 py-1 text-sm font-semibold rounded-bl-xl flex items-center gap-1.5 z-10">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Más Popular
                  </div>
                )}
                <CardHeader className="text-center p-6">
                  <CardTitle className="text-2xl font-bold text-primary">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <p className="text-4xl font-headline font-extrabold text-foreground">
                      {isAnnual ? '$' : '$'}{displayPriceString.replace('.',',')} 
                      <span className="text-base font-normal text-muted-foreground">{periodText}</span>
                    </p>
                    {isAnnual && (
                      <p className="text-sm text-muted-foreground mt-1">
                        (equivale a ${effectiveMonthlyPrice.toFixed(2).replace('.',',')}/mes)
                      </p>
                    )}
                  </div>
                  <CardDescription className="mt-3 text-foreground/70 h-12">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 flex-grow">
                  <ul className="space-y-3">
                    {featuresToShow.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="p-6 mt-auto">
                    <Button 
                      asChild 
                      size="lg" 
                      variant={hoveredPlan === plan.name ? "default" : "outline"}
                      className="w-full transition-all duration-300 hover:shadow-lg"
                    >
                        <Link href={getButtonLink(plan.planId)}>{plan.cta}</Link>
                    </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
        {!isDashboardContext && (
            <p className="text-center mt-12 text-muted-foreground">
            ¿Necesitas una solución personalizada o un plan Enterprise? <Link href="/contact" className="text-primary hover:underline">Contáctanos</Link>.
            </p>
        )}
      </div>
    </section>
  );
}
