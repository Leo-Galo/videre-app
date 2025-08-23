
"use client";

import React from "react"; // Ensure React is imported
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Minus, Sparkles, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const featuresList = [
  {
    category: "Funcionalidades Principales",
    items: [
      { name: "Prueba Gratuita de 3 Días", basic: true, pro: true, premium: true },
      { name: "Gestión de Pacientes (Historial Clínico Detallado)", basic: true, pro: true, premium: true },
      { name: "Inventario (Límite de Productos)", basic: "Hasta 500", pro: "Ilimitado", premium: "Ilimitado" },
      { name: "Programación de Citas Interna", basic: true, pro: true, premium: true },
      { name: "Punto de Venta (POS)", basic: true, pro: true, premium: true },
      { name: "Tiquete Electrónico (CR)", basic: true, pro: true, premium: true },
      { name: "Facturación Electrónica (CR v4.4)", basic: false, pro: true, premium: true },
      { name: "Gestión de Órdenes de Laboratorio", basic: true, pro: true, premium: true },
      { name: "Gestión de Mensajería", basic: true, pro: true, premium: true },
      { name: "Control de Caja Chica", basic: true, pro: true, premium: true },
    ],
  },
  {
    category: "Reportes y Analíticas",
    items: [
      { name: "Reportes Básicos (Ventas, Inventario)", basic: true, pro: true, premium: true },
      { name: "Exportación de Reportes a CSV", basic: false, pro: true, premium: true },
      { name: "Control de Gastos y Rentabilidad", basic: false, pro: false, premium: true, isPremiumFeature: true },
      { name: "Presupuestos y Proyecciones", basic: false, pro: false, premium: true, isPremiumFeature: true },
      { name: "Reportes de Proveedores", basic: false, pro: false, premium: true, isPremiumFeature: true },
    ],
  },
  {
    category: "Marketing y Crecimiento",
    items: [
      { name: "Gestión de Convenios Empresariales", basic: false, pro: false, premium: true, isPremiumFeature: true },
      { name: "Gestión de Cupones de Descuento", basic: false, pro: false, premium: true, isPremiumFeature: true },
    ],
  },
  {
    category: "Gestión y Administración",
    items: [
      { name: "Sucursales", basic: "1", pro: "Hasta 2", premium: "Hasta 5" },
      { name: "Usuarios", basic: "2", pro: "Hasta 5", premium: "Ilimitados" },
      { name: "Gestión de Proveedores (Listado)", basic: false, pro: true, premium: true },
      { name: "Gestión de Proveedores (Movimientos)", basic: false, pro: false, premium: true, isPremiumFeature: true },
      { name: "Integraciones con APIs Externas", basic: false, pro: false, premium: true, isPremiumFeature: true },
    ],
  },
  {
    category: "Soporte",
    items: [
      { name: "Soporte por Correo", basic: true, pro: true, premium: true },
      { name: "Soporte Prioritario (Chat)", basic: false, pro: true, premium: true },
      { name: "Soporte Telefónico Dedicado", basic: false, pro: false, premium: true },
    ],
  },
];

const renderFeatureValue = (value: boolean | string | undefined, isPremiumFeature?: boolean) => {
  if (typeof value === 'boolean') {
    return value ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-red-500 mx-auto" />;
  }
  if (typeof value === 'string') {
    return (
      <span className="text-sm text-foreground/90 flex items-center justify-center gap-1">
        {isPremiumFeature && <Sparkles className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
        {value}
      </span>
    );
  }
  return <Minus className="h-5 w-5 text-muted-foreground mx-auto" />;
};

export function PlanComparisonTable() {
  return (
    <section id="compare-plans" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">
            Compara Nuestros Planes en Detalle
          </h2>
          <p className="mt-4 text-lg text-foreground/70 max-w-2xl mx-auto">
            Encuentra la combinación perfecta de características para impulsar tu óptica.
          </p>
        </div>

        <Card className="shadow-xl rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[25%] min-w-[200px] text-left font-semibold text-base py-4 px-6">Característica</TableHead>
                    <TableHead className="w-[25%] text-center font-semibold text-base py-4 px-6">Básico<p className="text-xs font-normal text-muted-foreground">$49/mes</p></TableHead>
                    <TableHead className="w-[25%] text-center font-semibold text-base py-4 px-6">Pro<p className="text-xs font-normal text-muted-foreground">$99/mes</p></TableHead>
                    <TableHead className="w-[25%] text-center font-semibold text-base py-4 px-6 text-primary">Premium <Sparkles className="inline h-4 w-4" /><p className="text-xs font-normal text-muted-foreground">$139/mes</p></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featuresList.map((category, catIndex) => (
                    <React.Fragment key={catIndex}>
                      <TableRow className="bg-secondary/30 hover:bg-secondary/40">
                        <TableCell colSpan={4} className="font-bold text-primary text-md py-3 px-6">{category.category}</TableCell>
                      </TableRow>
                      {category.items.map((feature, itemIndex) => (
                        <TableRow key={itemIndex} className="hover:bg-muted/20">
                          <TableCell className="py-3 px-6 text-sm text-foreground/80">{feature.name}</TableCell>
                          <TableCell className="text-center py-3 px-6">{renderFeatureValue(feature.basic, feature.isPremiumFeature)}</TableCell>
                          <TableCell className="text-center py-3 px-6">{renderFeatureValue(feature.pro, feature.isPremiumFeature)}</TableCell>
                          <TableCell className="text-center py-3 px-6">{renderFeatureValue(feature.premium, feature.isPremiumFeature)}</TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                  <TableRow className="bg-muted/20 hover:bg-muted/30">
                    <TableCell className="py-4 px-6 font-semibold">Elige tu Plan</TableCell>
                    <TableCell className="text-center py-4 px-6">
                      <Button variant="outline" asChild><Link href="/register?plan=Basic">Elegir Plan</Link></Button>
                    </TableCell>
                    <TableCell className="text-center py-4 px-6">
                      <Button variant="outline" asChild><Link href="/register?plan=Pro">Elegir Plan</Link></Button>
                    </TableCell>
                    <TableCell className="text-center py-4 px-6">
                      <Button variant="outline" asChild><Link href="/register?plan=Premium">Elegir Plan</Link></Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
         <p className="text-center mt-8 text-sm text-muted-foreground">
            Precios mostrados para facturación mensual. <Link href="/#pricing" className="text-primary hover:underline">Consulta los descuentos por pago anual</Link>.
          </p>
      </div>
    </section>
  );
}
