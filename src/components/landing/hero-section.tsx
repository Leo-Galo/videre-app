
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle } from "lucide-react";

// Use the new, reliable image URL directly.
const HERO_IMAGE_URL = "https://i.imgur.com/0nQ3mgg.jpeg";

export function HeroSection() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-background to-secondary/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold tracking-tight text-primary">
              Transforma tu Óptica con Videre
            </h1>
            <p className="text-lg md:text-xl text-foreground/80">
              La solución todo en uno diseñada para ópticas. Optimiza citas, gestiona inventario y eleva el cuidado del paciente con nuestra plataforma intuitiva.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button size="lg" asChild className="shadow-lg hover:shadow-primary/30 transition-shadow">
                <Link href="/register?plan=Premium">Iniciar Prueba Gratuita (3 Días)</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="shadow-sm hover:shadow-md transition-shadow">
                <Link href="/#features">Conoce Más</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center md:justify-start pt-4 text-sm text-muted-foreground">
              <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-1.5 text-primary/70" /> No se requiere tarjeta de crédito</span>
              <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-1.5 text-primary/70" /> Cancela en cualquier momento</span>
            </div>
          </div>
          <div className="relative aspect-video rounded-xl shadow-2xl overflow-hidden group">
             <Image 
                src={HERO_IMAGE_URL}
                alt="Videre Platform Showcase" 
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transform group-hover:scale-105 transition-transform duration-500 ease-in-out"
                data-ai-hint="modern optometry"
                priority // Cargar esta imagen primero
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
