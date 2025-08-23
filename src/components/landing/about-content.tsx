"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Users, Target, Lightbulb, Handshake } from "lucide-react";

// Use the new, reliable image URL directly.
const ABOUT_IMAGE_URL = "https://i.imgur.com/7DWoGdL.jpeg";

export function AboutContent() {
    return (
        <div className="container mx-auto px-4">
        <section className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4">Sobre Videre</h1>
            <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto">
            Nuestra misión es empoderar a las ópticas con tecnología de vanguardia, simplificando la gestión y mejorando el cuidado del paciente.
            </p>
        </section>

        <section className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
            <h2 className="text-3xl font-semibold text-primary mb-6">Nuestra Historia</h2>
            <p className="text-foreground/70 mb-4 leading-relaxed">
                Videre nació de la visión de un equipo apasionado por la optometría y la tecnología. Observamos los desafíos diarios que enfrentan las ópticas – desde la gestión de citas y el control de inventario hasta el cumplimiento normativo y la necesidad de ofrecer una experiencia excepcional al paciente.
            </p>
            <p className="text-foreground/70 mb-4 leading-relaxed">
                Decidimos crear una solución integral que no solo abordara estos problemas, sino que también anticipara las necesidades futuras de la industria. Con un enfoque en la facilidad de uso, la seguridad y la innovación continua, Videre está diseñado para ser el socio tecnológico confiable de tu óptica.
            </p>
            <Button asChild size="lg">
                <Link href="/contact">Contáctanos</Link>
            </Button>
            </div>
            <div className="relative aspect-video rounded-xl shadow-xl overflow-hidden group">
            <Image 
                src={ABOUT_IMAGE_URL}
                alt="El equipo de Videre colaborando en la nueva plataforma" 
                fill
                className="object-cover transform group-hover:scale-105 transition-transform duration-500 ease-in-out"
                data-ai-hint="team collaboration"
            />
            </div>
        </section>

        <section className="mb-16">
            <h2 className="text-3xl font-semibold text-primary text-center mb-10">Nuestros Valores</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
                { icon: <Target className="w-10 h-10 text-primary mb-3" />, title: "Enfoque en el Cliente", description: "Priorizamos las necesidades de las ópticas y sus pacientes en cada decisión." },
                { icon: <Lightbulb className="w-10 h-10 text-primary mb-3" />, title: "Innovación Constante", description: "Buscamos continuamente nuevas formas de mejorar y simplificar la gestión óptica." },
                { icon: <Handshake className="w-10 h-10 text-primary mb-3" />, title: "Confianza y Transparencia", description: "Construimos relaciones sólidas basadas en la honestidad y la comunicación abierta." },
                { icon: <Users className="w-10 h-10 text-primary mb-3" />, title: "Colaboración", description: "Trabajamos de la mano con profesionales de la optometría para crear la mejor solución." },
            ].map(value => (
                <Card key={value.title} className="text-center p-6 shadow-lg hover:shadow-xl transition-shadow rounded-lg">
                {value.icon}
                <h3 className="text-xl font-semibold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-foreground/70">{value.description}</p>
                </Card>
            ))}
            </div>
        </section>
        
        <section className="text-center">
            <h2 className="text-3xl font-semibold text-primary mb-6">Únete a la Familia Videre</h2>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto mb-8">
            Estamos emocionados por el futuro de la optometría y cómo Videre puede ayudar a tu negocio a prosperar.
            </p>
            <Button size="lg" variant="outline" asChild>
            <Link href="/#pricing">Ver Planes y Precios</Link>
            </Button>
        </section>

        </div>
    );
}
