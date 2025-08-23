import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users, Package, BarChart3, CreditCard, Lock, ShoppingCart, FileText, BellRing } from "lucide-react";

const features = [
  {
    icon: <Users className="w-8 h-8 text-primary transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-6" />,
    title: "Gestión de Pacientes",
    description: "Mantén registros detallados de pacientes, historial y prescripciones en un solo lugar seguro.",
    dataAiHint: "patient records"
  },
  {
    icon: <Package className="w-8 h-8 text-primary transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-6" />,
    title: "Control de Inventario",
    description: "Rastrea armazones, lentes y lentes de contacto con facilidad. Recibe alertas de stock bajo.",
    dataAiHint: "inventory management"
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-primary transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-6" />,
    title: "Reportes Detallados",
    description: "Genera informes completos sobre ventas, inventario y demografía de pacientes.",
    dataAiHint: "business analytics"
  },
  {
    icon: <CreditCard className="w-8 h-8 text-primary transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-6" />,
    title: "POS Integrado",
    description: "Sistema de punto de venta rápido y fácil con soporte para múltiples métodos de pago.",
    dataAiHint: "payment processing"
  },
   {
    icon: <FileText className="w-8 h-8 text-primary transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-6" />,
    title: "Facturación Electrónica (CR)",
    description: "Cumple con los estándares de Hacienda Costa Rica v4.4 para comprobantes electrónicos.",
    dataAiHint: "invoice document"
  },
  {
    icon: <ShoppingCart className="w-8 h-8 text-primary transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-6" />,
    title: "Gestión de Suscripciones",
    description: "Planes de suscripción flexibles con facturación automatizada vía PayPal.",
    dataAiHint: "online shopping"
  },
  {
    icon: <Lock className="w-8 h-8 text-primary transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-6" />,
    title: "Seguro y Multi-inquilino",
    description: "Seguridad robusta con Firebase Authentication y datos aislados para cada clínica.",
    dataAiHint: "data security"
  },
  {
    icon: <BellRing className="w-8 h-8 text-primary transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-6" />,
    title: "Recordatorios de Citas",
    description: "Recordatorios automáticos por SMS y correo electrónico para reducir ausencias.",
    dataAiHint: "calendar notification"
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">
            Todo lo que tu Óptica Necesita
          </h2>
          <p className="mt-4 text-lg text-foreground/70 max-w-2xl mx-auto">
            Videre proporciona un conjunto completo de herramientas para administrar y hacer crecer tu negocio óptico de manera eficiente.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden flex flex-col hover:scale-[1.03] group">
              <CardHeader className="items-center text-center bg-muted/30 p-6">
                <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block transition-colors duration-300 group-hover:bg-primary/20">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl font-semibold text-primary">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex-grow">
                <CardDescription className="text-center text-foreground/70">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
