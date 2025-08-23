import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { GlobalClientComponents } from '@/components/shared/client-components';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Videre - Sistema de Gestión para Ópticas',
    template: '%s | Videre',
  },
  description: 'Videre es la solución de software para la gestión integral de ópticas. Optimiza citas, inventario, pacientes, ventas y facturación electrónica.',
  keywords: ['software para ópticas', 'gestión de ópticas', 'software optometría', 'historial clínico digital ópticas', 'POS para ópticas', 'facturación electrónica ópticas Costa Rica', 'Videre'],
  openGraph: {
    title: 'Videre - Sistema de Gestión para Ópticas',
    description: 'La solución de software todo en uno para ópticas y optómetras.',
    type: 'website',
    locale: 'es_CR',
    siteName: 'Videre',
    // url: 'https://www.videre.com', // Reemplazar con la URL real cuando esté disponible
    // images: [ // Añadir una imagen representativa para redes sociales
    //   {
    //     url: 'https://www.videre.com/og-image.png', // URL de la imagen
    //     width: 1200,
    //     height: 630,
    //     alt: 'Videre Platform',
    //   },
    // ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Videre - Sistema de Gestión para Ópticas',
    description: 'La solución de software todo en uno para ópticas y optómetras.',
    // site: '@videre', // Reemplazar con el handle de Twitter si existe
    // creator: '@videre',
    // images: ['https://www.videre.com/twitter-image.png'], // URL de la imagen para Twitter
  },
  robots: { // Controlar el rastreo e indexación
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // icons: { // Favicon y otros iconos
  //   icon: '/favicon.ico',
  //   apple: '/apple-touch-icon.png',
  // },
  // manifest: '/site.webmanifest', // Para PWA
};

// Este script se ejecuta antes de que React se hidrate, eliminando el parpadeo del tema.
const ThemeInitializationScript = () => {
  const scriptContent = `
    (function() {
      try {
        const theme = localStorage.getItem('theme') || 'light';
        document.documentElement.classList.add(theme);
      } catch (e) {
        console.error('Failed to set initial theme from localStorage', e);
      }
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: scriptContent }} />;
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <head />
      <body>
        <ThemeInitializationScript />
        {children}
        <GlobalClientComponents />
      </body>
    </html>
  );
}
