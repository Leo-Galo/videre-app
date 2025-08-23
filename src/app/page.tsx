import { AppHeader } from "@/components/shared/app-header";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { PlanComparisonTable } from "@/components/landing/plan-comparison-table";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { CtaSection } from "@/components/landing/cta-section";
import { AppFooter } from "@/components/landing/app-footer";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Videre - Software de Gestión Integral para Ópticas Modernas',
  description: 'Descubre Videre, el software líder para ópticas. Gestiona pacientes, inventario, citas, ventas y facturación electrónica de forma eficiente. ¡Prueba gratis!',
  keywords: ['software ópticas', 'gestión de ópticas', 'software optometría', 'sistema para ópticas', 'POS ópticas', 'historial clínico óptico', 'facturación electrónica Costa Rica ópticas'],
  openGraph: {
    title: 'Videre - Software de Gestión Integral para Ópticas Modernas',
    description: 'La solución de software todo en uno para ópticas y optómetras.',
    type: 'website',
    // url: 'https://www.videre.com/', // URL canónica de esta página
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Videre - Software de Gestión Integral para Ópticas Modernas',
    description: 'Descubre Videre, el software líder para ópticas. Gestiona pacientes, inventario, citas, ventas y facturación electrónica de forma eficiente.',
  },
};

const softwareApplicationLdJson = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Videre",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web, Compatible con Navegadores Modernos",
  "description": "Videre es la solución de software todo en uno para la gestión integral de ópticas. Optimiza citas, inventario, pacientes, ventas y facturación electrónica.",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "USD",
    "price": "49", 
    "url": "https://videre.com/#pricing" 
  },
  "keywords": "software para ópticas, gestión de ópticas, software optometría, historial clínico digital ópticas, POS para ópticas, facturación electrónica ópticas Costa Rica",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "75" 
  },
  "softwareVersion": "1.0.0",
  "provider": {
    "@type": "Organization",
    "name": "Videre Soluciones"
  }
};

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationLdJson) }}
      />
      <AppHeader />
      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <PlanComparisonTable />
        <TestimonialsSection />
        <CtaSection />
      </main>
      <AppFooter />
    </div>
  );
}
