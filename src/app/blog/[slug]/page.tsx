// src/app/blog/[slug]/page.tsx
import { AppHeader } from "@/components/shared/app-header";
import { AppFooter } from "@/components/landing/app-footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CalendarDays, UserCircle2, MessageCircle, Users, Package, ShoppingCart, Sparkles, Building, ShieldCheck, TrendingUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from 'next';
import { getBlogPostBySlug, getBlogPosts } from "@/services/superadmin/blog-service";

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    return {
      title: "Artículo no Encontrado",
      description: "El artículo que buscas no existe o ha sido movido.",
    };
  }

  return {
    title: `${post.title} | Blog Videre`,
    description: (post.content || '').substring(0, 160) + "...", // Usar un extracto
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: (post.content || '').substring(0, 160) + "...",
      type: 'article',
      publishedTime: new Date(post.createdAt).toISOString(),
      authors: [post.author],
      images: post.image ? [{ url: post.image, alt: post.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: (post.content || '').substring(0, 160) + "...",
      images: post.image ? [post.image] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <main className="flex-grow py-12 md:py-20 flex items-center justify-center">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold text-destructive mb-4">Artículo no Encontrado</h1>
            <p className="text-lg text-muted-foreground mb-8">Lo sentimos, el artículo que buscas no existe o ha sido movido.</p>
            <Button asChild>
              <Link href="/blog"><span>Volver al Blog</span></Link>
            </Button>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  const articleLdJson = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "image": post.image || "https://i.imgur.com/20nN66m.png",
    "datePublished": new Date(post.createdAt).toISOString(),
    "dateModified": new Date(post.updatedAt).toISOString(),
    "author": {
      "@type": "Organization",
      "name": post.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Videre",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.videre.com/logo-videre-cuadrado.png"
      }
    },
    "description": (post.content || '').substring(0, 250) + "...",
    "keywords": post.tags?.join(", ")
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLdJson) }}
      />
      <AppHeader />
      <main className="flex-grow py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <article>
            <header className="mb-10">
              <Button variant="outline" size="sm" asChild className="mb-6 hover:bg-muted/80">
                <Link href="/blog"><span><ArrowLeft size={16} className="mr-2" /> Volver al Blog</span></Link>
              </Button>
              <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <CalendarDays size={15}/> Publicado el {new Date(post.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                <UserCircle2 size={15}/> Por {post.author}
              </div>
               {post.tags && post.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {post.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                </div>
               )}
            </header>

            {post.image && (
              <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-lg mb-10 bg-muted/30">
                <Image 
                    src={post.image} 
                    alt={post.title} 
                    fill 
                    className="object-contain" 
                    data-ai-hint={post.dataAiHint}
                    priority
                />
              </div>
            )}

            <div
              className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 prose-headings:text-primary prose-a:text-primary hover:prose-a:underline prose-img:rounded-md prose-img:shadow-md prose-ul:text-foreground/80 prose-li:marker:text-primary"
              dangerouslySetInnerHTML={{ __html: post.content || '' }}
            />
            
            <Separator className="my-10" />

            <footer className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Compartir:</span>
                {/* TODO: Implement actual sharing links or use a library */}
                <Button variant="outline" size="sm" title="Compartir en Facebook">Facebook</Button>
                <Button variant="outline" size="sm" title="Compartir en Twitter/X">Twitter/X</Button>
                <Button variant="outline" size="sm" title="Compartir en LinkedIn">LinkedIn</Button>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2"><MessageCircle size={20}/> Comentarios (0)</h3>
                <div className="p-6 bg-muted/50 rounded-lg text-center text-muted-foreground">
                  <p>La sección de comentarios está en construcción.</p>
                  <p className="text-xs mt-1">¡Vuelve pronto para compartir tu opinión!</p>
                </div>
              </div>
            </footer>
          </article>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
