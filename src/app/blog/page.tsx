// src/app/blog/page.tsx
import { AppHeader } from "@/components/shared/app-header";
import { AppFooter } from "@/components/landing/app-footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, UserCircle2, BookOpen } from "lucide-react";
import { getBlogPosts } from "@/services/superadmin/blog-service";

export default async function BlogPage() {
  const blogPosts = await getBlogPosts();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow py-12 md:py-20">
        <div className="container mx-auto px-4">
          <section className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4">Blog Videre</h1>
            <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto">
              Noticias, consejos y mejores prácticas para la gestión de ópticas y el cuidado visual, impulsadas por la innovación y la IA.
            </p>
          </section>

          {blogPosts && blogPosts.length > 0 ? (
            <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.filter(p => p.status === 'Published').map((post) => (
                <Card key={post.slug} className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden flex flex-col">
                  <Link href={`/blog/${post.slug}`} className="block group">
                    <div className="relative aspect-video w-full overflow-hidden bg-muted/30">
                      {post.image ? (
                        <Image 
                            src={post.image} 
                            alt={post.title} 
                            fill
                            className="object-contain group-hover:scale-105 transition-transform duration-300"
                            data-ai-hint={post.dataAiHint}
                        />
                      ) : (
                         <div className="flex items-center justify-center h-full text-muted-foreground">
                            <BookOpen className="w-16 h-16"/>
                         </div>
                      )}
                    </div>
                  </Link>
                  <CardHeader className="p-6">
                    <CardTitle className="text-xl font-semibold text-primary hover:underline mb-2">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </CardTitle>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <CalendarDays size={14}/> {new Date(post.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                      <UserCircle2 size={14}/> {post.author}
                    </div>
                    <CardDescription className="text-sm text-foreground/70 leading-relaxed h-24 overflow-hidden">
                      {(post.content || '').substring(0, 150)}...
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="p-6 mt-auto">
                    <Button variant="link" asChild className="p-0 h-auto text-primary">
                      <Link href={`/blog/${post.slug}`}><span>Leer Más <ArrowRight size={16} className="ml-1 inline-block" /></span></Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </section>
          ) : (
            <section className="text-center py-16">
              <p className="text-muted-foreground">No hay artículos en el blog por el momento. ¡Vuelve pronto!</p>
            </section>
          )}

        </div>
      </main>
      <AppFooter />
    </div>
  );
}
