
import { AppHeader } from "@/components/shared/app-header";
import { AppFooter } from "@/components/landing/app-footer";
import { AboutContent } from "@/components/landing/about-content";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre Videre - Nuestra Misión y Valores',
  description: 'Conoce la historia detrás de Videre, nuestra misión de empoderar ópticas con tecnología de vanguardia y los valores que nos guían.',
  keywords: ['Videre', 'sobre nosotros', 'misión Videre', 'valores Videre', 'software para ópticas'],
};

const organizationLdJson = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Videre",
    "url": "https://www.videre.com",
    "logo": "https://www.videre.com/logo-videre-cuadrado.png",
    "description": "Videre se dedica a empoderar a las ópticas con tecnología de vanguardia, simplificando la gestión y mejorando el cuidado del paciente.",
    "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+506-7197-8968",
    "contactType": "Customer Service",
    "email": "info@videre.cr"
    },
    "address": {
    "@type": "PostalAddress",
    "streetAddress": "Boulevard Rohrmoser",
    "addressLocality": "San José",
    "addressRegion": "San José",
    "postalCode": "10109",
    "addressCountry": "CR"
    },
    "sameAs": []
};

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLdJson) }}
            />
            <AppHeader />
            <main className="flex-grow py-12 md:py-20">
                <AboutContent />
            </main>
            <AppFooter />
        </div>
    );
}
