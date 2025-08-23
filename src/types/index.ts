
// Este archivo puede contener otros tipos existentes.
// Si no existe, se creará con este contenido.

export interface Testimonial {
  id: string;
  name: string;
  title: string;
  quote: string;
  initials: string; // Para el fallback del avatar si no hay imagen
}

// Placeholder para otros tipos si este archivo ya existe y tiene contenido
export interface OtherExistingType {
  property: string;
}
