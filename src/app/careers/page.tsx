// src/app/careers/page.tsx
import { AppHeader } from "@/components/shared/app-header";
import { AppFooter } from "@/components/landing/app-footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Briefcase, Sparkles, Users, Code } from "lucide-react";

const jobOpenings = [
  {
    title: "Ingeniero de Software Full-Stack",
    location: "Remoto / San José, CR",
    description: "Buscamos un desarrollador talentoso para unirse a nuestro equipo y construir el futuro de Videre. Experiencia en Next.js, TypeScript y Firebase es un plus.",
    type: "Tiempo Completo",
    dataAiHint: "software engineer"
  },
  {
    title: "Especialista en Soporte al Cliente (Optometría)",
    location: "San José, CR",
    description: "Ayuda a nuestros clientes a sacar el máximo provecho de Videre. Se requiere experiencia previa en el sector óptico.",
    type: "Tiempo Completo",
    dataAiHint: "customer support"
  },
  {
    title: "Ejecutivo de Ventas de Software",
    location: "Remoto (LATAM)",
    description: "Impulsa el crecimiento de Videre identificando y cerrando nuevas oportunidades de negocio en el mercado latinoamericano.",
    type: "Tiempo Completo",
    dataAiHint: "sales executive"
  },
];

export default function CareersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow py-12 md:py-20">
        <div className="container mx-auto px-4">
          <section className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4">Únete al Equipo Videre</h1>
            <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto">
              Estamos construyendo el futuro de la gestión para ópticas y buscamos personas apasionadas, talentosas e innovadoras para unirse a nuestra misión.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-primary text-center mb-10">¿Por qué trabajar en Videre?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center p-6 shadow-lg hover:shadow-xl transition-shadow rounded-lg">
                <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Impacto Real</h3>
                <p className="text-sm text-foreground/70">Contribuye a una solución que transforma la forma en que las ópticas operan y atienden a sus pacientes.</p>
              </Card>
              <Card className="text-center p-6 shadow-lg hover:shadow-xl transition-shadow rounded-lg">
                <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Cultura Colaborativa</h3>
                <p className="text-sm text-foreground/70">Forma parte de un equipo diverso y solidario donde tus ideas son valoradas y fomentamos el crecimiento.</p>
              </Card>
              <Card className="text-center p-6 shadow-lg hover:shadow-xl transition-shadow rounded-lg">
                <Code className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Tecnología de Punta</h3>
                <p className="text-sm text-foreground/70">Trabaja con herramientas y tecnologías modernas en un entorno de aprendizaje continuo.</p>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-semibold text-primary text-center mb-10">Posiciones Abiertas</h2>
            {jobOpenings.length > 0 ? (
              <div className="space-y-6">
                {jobOpenings.map((job, index) => (
                  <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow rounded-lg overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-xl text-primary">{job.title}</CardTitle>
                      <CardDescription>{job.location} | {job.type}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground/70 mb-4">{job.description}</p>
                    </CardContent>
                    <CardFooter>
                      <Button asChild>
                        <Link href={`mailto:careers@videre.com?subject=Aplicación: ${job.title}`}>Aplicar Ahora</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-lg text-muted-foreground">
                Actualmente no tenemos posiciones abiertas, pero siempre estamos interesados en conocer talento excepcional. No dudes en <Link href="/contact" className="text-primary hover:underline">contactarnos</Link>.
              </p>
            )}
          </section>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
