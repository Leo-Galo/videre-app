
"use client";

import { useState, useEffect } from 'react'; // Importados
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HelpCircle, BookOpen, MessageSquare, Search, LifeBuoy, Settings2, Download, Video, FileText, Gem } from "lucide-react"; // Importados Download y Video
import Link from "next/link";
import { useToast } from '@/hooks/use-toast'; // Importado useToast
import { Skeleton } from '@/components/ui/skeleton'; // Importado Skeleton

const faqs = [
  {
    question: "¿Cómo registro un nuevo paciente?",
    answer: "Dirígete a la sección 'Pacientes' en el menú lateral, luego haz clic en el botón 'Nuevo Paciente'. Completa el formulario con la información requerida y guarda los cambios.",
  },
  {
    question: "¿Cómo ajusto el stock de un producto?",
    answer: "En la sección 'Inventario', puedes usar la opción 'Ajuste Rápido de Stock' desde el menú de acciones de cada producto, o realizar un 'Ajuste Masivo por Conteo' subiendo un archivo CSV con el conteo físico.",
  },
  {
    question: "¿Puedo generar facturas electrónicas?",
    answer: "Sí, Videre está preparado para la facturación electrónica conforme a las normativas de Hacienda Costa Rica (v4.4). Asegúrate de que tu información fiscal esté correctamente configurada en 'Configuración' > 'Facturación'.",
  },
  {
    question: "Olvidé mi contraseña, ¿cómo la recupero?",
    answer: "En la pantalla de inicio de sesión, haz clic en el enlace '¿Olvidaste tu contraseña?'. Sigue las instrucciones para recibir un correo de restablecimiento.",
  },
  {
    question: "¿Cómo cambio el plan de mi suscripción?",
    answer: "Puedes gestionar tu suscripción y cambiar de plan desde 'Panel Principal' > (Menú de Usuario) > 'Gestionar Suscripción'.",
  },
];

export default function HelpPage() {
  const { toast } = useToast();
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);

  useEffect(() => {
    const plan = localStorage.getItem('subscriptionPlan');
    setCurrentPlan(plan ? plan.toLowerCase() : 'básico'); // Default to basic if no plan
    setIsLoadingPlan(false);
  }, []);

  const handleDownloadManual = (manualType: string) => {
    toast({
      title: "Descarga Iniciada",
      description: `Se ha iniciado la descarga del ${manualType}.`,
    });
  };
  
  const handleAccessVideos = () => {
    toast({
      title: "Accediendo a Videotutoriales",
      description: "Serás redirigido a la sección de videotutoriales.",
    });
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            <HelpCircle className="h-8 w-8" />
            Centro de Ayuda y Soporte
            </h1>
            <p className="text-muted-foreground mt-1">
            Encuentra respuestas a tus preguntas y obtén ayuda con Videre.
            </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/contact">
            <span><MessageSquare className="mr-2 h-4 w-4" /> Contactar Soporte Directo</span>
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-primary"/>Buscar en la Documentación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="Escribe tu pregunta o palabra clave..." className="flex-grow" />
            <Button>Buscar</Button>
          </div>
           <p className="text-xs text-muted-foreground mt-2">Ej: "crear cita", "reporte de ventas", "configurar logo"</p>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg rounded-xl">
            <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary"/>Preguntas Frecuentes (FAQ)</CardTitle>
            <CardDescription>Respuestas rápidas a las consultas más comunes.</CardDescription>
            </CardHeader>
            <CardContent>
            <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-foreground/80">
                    {faq.answer}
                    </AccordionContent>
                </AccordionItem>
                ))}
            </Accordion>
            </CardContent>
        </Card>

        <div className="space-y-6">
            <Card className="shadow-lg rounded-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><LifeBuoy className="h-5 w-5 text-primary"/>Guías y Tutoriales Generales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="link" className="p-0 h-auto text-base" asChild><Link href="#">Guía de Inicio Rápido para Videre</Link></Button>
                    <p className="text-xs text-muted-foreground">Aprende los fundamentos en minutos.</p>
                    <Button variant="link" className="p-0 h-auto text-base" asChild><Link href="#">Tutorial: Gestión Avanzada de Inventario</Link></Button>
                     <p className="text-xs text-muted-foreground">Domina el control de tu stock.</p>
                    <Button variant="link" className="p-0 h-auto text-base" asChild><Link href="#">Video: Configurando tu Facturación Electrónica</Link></Button>
                     <p className="text-xs text-muted-foreground">Paso a paso para cumplir con Hacienda.</p>
                </CardContent>
            </Card>
             <Card className="shadow-lg rounded-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary"/>Resolución de Problemas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="link" className="p-0 h-auto text-base" asChild><Link href="#">No puedo iniciar sesión, ¿qué hago?</Link></Button>
                    <Button variant="link" className="p-0 h-auto text-base" asChild><Link href="#">Mis reportes no se generan correctamente.</Link></Button>
                </CardContent>
            </Card>
        </div>
      </div>
      
      {/* Nueva sección de Manuales por Plan */}
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" /> Manuales y Documentación Específica del Plan
          </CardTitle>
          <CardDescription>Recursos adaptados a tu nivel de suscripción para ayudarte a sacar el máximo provecho de Videre.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingPlan ? (
            <div className="space-y-3">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-48" />
            </div>
          ) : currentPlan === 'básico' ? (
            <div>
              <p className="text-foreground/80 mb-3">
                Bienvenido al Plan Básico. Accede a nuestra Guía de Inicio Rápido y FAQs para resolver tus dudas más comunes.
              </p>
              <Button onClick={() => handleDownloadManual('Manual Básico Videre')} variant="outline">
                <Download className="mr-2 h-4 w-4" /> Descargar Guía de Inicio
              </Button>
            </div>
          ) : currentPlan === 'pro' ? (
            <div>
              <p className="text-foreground/80 mb-3">
                ¡Gracias por ser usuario Pro! Además de las FAQs, tienes acceso al Manual de Usuario Detallado y a tutoriales avanzados sobre gestión de inventario, facturación y marketing básico.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => handleDownloadManual('Manual Videre Pro')} variant="outline">
                  <Download className="mr-2 h-4 w-4" /> Descargar Manual Pro
                </Button>
                <Button onClick={() => handleAccessVideos()} variant="outline">
                  <Video className="mr-2 h-4 w-4" /> Ver Tutoriales Avanzados
                </Button>
              </div>
            </div>
          ) : currentPlan === 'premium' ? (
            <div>
              <p className="text-foreground/80 mb-3">
                Como usuario Premium, disfrutas de acceso ilimitado a toda nuestra base de conocimiento. Esto incluye el Manual Avanzado, la biblioteca completa de videotutoriales (incluyendo funciones IA y marketing avanzado), y guías de optimización.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => handleDownloadManual('Manual Videre Premium Avanzado')} variant="default" className="bg-primary hover:bg-primary/90">
                  <Download className="mr-2 h-4 w-4" /> Descargar Manual Premium
                </Button>
                 <Button onClick={() => handleAccessVideos()} variant="default" className="bg-primary hover:bg-primary/90">
                  <Video className="mr-2 h-4 w-4" /> Acceder a Videotutoriales Premium
                </Button>
                 <Button onClick={() => toast({title: "Acceso a Base de Conocimiento", description: "Serías redirigido a la base de conocimiento completa."})} variant="outline">
                  <BookOpen className="mr-2 h-4 w-4" /> Explorar Base de Conocimiento
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No se pudo determinar tu plan actual. Contacta a soporte.</p>
          )}
          <div className="mt-6 pt-4 border-t border-dashed">
             <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Gem className="h-5 w-5 text-green-600"/>
                ¿Buscas más? <Link href="/dashboard/subscription" className="text-primary hover:underline">Actualiza tu plan</Link> para desbloquear recursos y funcionalidades adicionales.
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
