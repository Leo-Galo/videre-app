
"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Testimonial } from "@/types/index";

// The definitive list of testimonials is now managed from the superadmin panel.
// This component will now render based on fetched data (or show a placeholder).
const displayTestimonials: Testimonial[] = [];


export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">
            Amado por Optómetras Como Tú
          </h2>
          <p className="mt-4 text-lg text-foreground/70 max-w-2xl mx-auto">
            Escucha lo que nuestros clientes satisfechos tienen que decir sobre Videre.
          </p>
        </div>
        {displayTestimonials.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayTestimonials.map((testimonial) => (
              <Card key={testimonial.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden flex flex-col">
                <CardContent className="p-6 flex-grow flex flex-col items-center text-center">
                  <p className="text-lg font-medium text-foreground/90 italic mb-4 flex-grow">"{testimonial.quote}"</p>
                  <p className="font-semibold text-primary mt-auto">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">Aún no hay testimonios para mostrar. ¡Vuelve pronto!</p>
        )}
      </div>
    </section>
  );
}
