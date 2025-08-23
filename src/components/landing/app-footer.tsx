"use client";

import { SiteLogo } from "@/components/shared/site-logo";
import Link from "next/link";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { useEffect, useState } from "react";

interface SocialLinks {
    instagram: string;
    facebook: string;
    youtube: string;
}

export function AppFooter() {
  const currentYear = new Date().getFullYear();
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram: "#",
    facebook: "#",
    youtube: "#",
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem("videreGlobalSettings");
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSocialLinks({
        instagram: parsedSettings.socialInstagramUrl || "#",
        facebook: parsedSettings.socialFacebookUrl || "#",
        youtube: parsedSettings.socialYoutubeUrl || "#",
      });
    }
  }, []);

  return (
    <footer className="py-12 bg-muted/50 border-t">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <SiteLogo iconSize={24} textSize="text-xl" />
            <p className="mt-3 text-sm text-foreground/70">
              Optimizando prácticas ópticas con soluciones de software innovadoras.
            </p>
            <div className="flex space-x-3 mt-4">
              {socialLinks.instagram && socialLinks.instagram !== "#" && (
                <Link href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Instagram size={20} /></Link>
              )}
              {socialLinks.facebook && socialLinks.facebook !== "#" && (
                <Link href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Facebook size={20} /></Link>
              )}
              {socialLinks.youtube && socialLinks.youtube !== "#" && (
                <Link href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Youtube size={20} /></Link>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-primary mb-3">Producto</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#features" className="text-foreground/70 hover:text-primary transition-colors">Características</Link></li>
              <li><Link href="/#pricing" className="text-foreground/70 hover:text-primary transition-colors">Precios</Link></li>
              <li><Link href="/#testimonials" className="text-foreground/70 hover:text-primary transition-colors">Testimonios</Link></li>
              <li><Link href="/blog" className="text-foreground/70 hover:text-primary transition-colors">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-primary mb-3">Compañía</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-foreground/70 hover:text-primary transition-colors">Sobre Nosotros</Link></li>
              <li><Link href="/contact" className="text-foreground/70 hover:text-primary transition-colors">Contacto</Link></li>
              <li><Link href="/careers" className="text-foreground/70 hover:text-primary transition-colors">Carreras</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-primary mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="text-foreground/70 hover:text-primary transition-colors">Política de Privacidad</Link></li>
              <li><Link href="/terms" className="text-foreground/70 hover:text-primary transition-colors">Términos de Servicio</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Videre. Todos los derechos reservados. | Desarrollado por <a href="https://enfoque-digital.net/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Enfoque Digital</a>.</p>
        </div>
      </div>
    </footer>
  );
}