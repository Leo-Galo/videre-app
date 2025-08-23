
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, Edit, Trash2, Eye, PlusCircle, FileText, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { getBlogPosts, updateBlogPost, deleteBlogPost } from '@/services/superadmin/blog-service';
import type { BlogPostItem } from '@/types/superadmin';

const getStatusDisplayName = (status: BlogPostItem['status']) => {
    switch (status) {
      case 'Published': return 'Publicado';
      case 'Draft': return 'Borrador';
      case 'Archived': return 'Archivado';
      default: return status;
    }
};

export default function SuperAdminBlogManagementPage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [postToManage, setPostToManage] = useState<BlogPostItem | null>(null);
  const [actionType, setActionType] = useState<'delete' | 'archive' | 'publish' | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const fetchedPosts = await getBlogPosts();
      setPosts(fetchedPosts);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter(post =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [posts, searchTerm]);

  const handleActionConfirm = async () => {
    if (!postToManage || !actionType) return;
    
    let success = false;
    let message = "";

    if (actionType === 'delete') {
      success = await deleteBlogPost(postToManage.id);
      message = `Post "${postToManage.title}" eliminado.`;
    } else if (actionType === 'archive') {
      success = await updateBlogPost(postToManage.id, { status: 'Archived' });
      message = `Post "${postToManage.title}" archivado.`;
    } else if (actionType === 'publish') {
      success = await updateBlogPost(postToManage.id, { status: 'Published' });
      message = `Post "${postToManage.title}" publicado.`;
    }
    
    if (success) {
      const updatedPosts = await getBlogPosts(); // Re-fetch to get the latest state
      setPosts(updatedPosts);
      toast({ title: "Acción Realizada", description: message });
    } else {
      toast({ variant: "destructive", title: "Error", description: `No se pudo ${actionType} el post.` });
    }

    setPostToManage(null);
    setActionType(null);
  };

  const openActionDialog = (post: BlogPostItem, type: 'delete' | 'archive' | 'publish') => {
    setPostToManage(post);
    setActionType(type);
  };

  const getStatusBadgeVariant = (status: BlogPostItem['status']) => {
    switch (status) {
      case 'Published': return 'default';
      case 'Draft': return 'secondary';
      case 'Archived': return 'outline';
      default: return 'default';
    }
  };
  
  const formatDateSafe = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try { return format(parseISO(dateString), 'dd MMM, yyyy HH:mm', { locale: es }); }
    catch (e) { return 'Fecha Inválida'; }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-4 w-2/3 mb-6" />
        <Card className="shadow-md rounded-xl">
          <CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader>
          <CardContent><Skeleton className="h-80 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            <BookOpen className="h-7 w-7" /> Gestión de Contenido del Blog
            </h1>
            <p className="text-muted-foreground">
            Crea, edita y administra las publicaciones del blog de Videre.
            </p>
        </div>
        <Button asChild>
          <Link href="/superadmin/blog-management/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Crear Nuevo Post
          </Link>
        </Button>
      </div>

      <Card className="shadow-md rounded-xl">
        <CardHeader>
          <CardTitle>Listado de Publicaciones</CardTitle>
          <div className="mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por título, autor o estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full md:w-1/2 lg:w-1/3"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPosts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead className="hidden md:table-cell">Autor</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="hidden lg:table-cell">Creado</TableHead>
                    <TableHead className="hidden lg:table-cell">Actualizado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell className="hidden md:table-cell">{post.author}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusBadgeVariant(post.status)}>{getStatusDisplayName(post.status)}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{formatDateSafe(post.createdAt)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{formatDateSafe(post.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                               <Link href={`/blog/${post.slug}`} target="_blank" className="flex items-center gap-2 cursor-pointer"><Eye className="mr-2 h-4 w-4" /> Vista Previa</Link>
                            </DropdownMenuItem>
                             <DropdownMenuItem asChild>
                                <Link href={`/superadmin/blog-management/edit/${post.slug}`} className="flex items-center gap-2 cursor-pointer"><Edit className="mr-2 h-4 w-4" /> Editar Post</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {post.status === 'Draft' && (
                                <DropdownMenuItem onClick={() => openActionDialog(post, 'publish')}>
                                    Publicar
                                </DropdownMenuItem>
                            )}
                            {post.status === 'Published' && (
                                <DropdownMenuItem onClick={() => openActionDialog(post, 'archive')}>
                                    Archivar
                                </DropdownMenuItem>
                            )}
                             {post.status === 'Archived' && (
                                <DropdownMenuItem onClick={() => openActionDialog(post, 'publish')}>
                                    Re-Publicar
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                                className="text-destructive hover:!text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={() => openActionDialog(post, 'delete')}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar Post
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <p>No se encontraron publicaciones con los criterios de búsqueda.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={postToManage !== null && actionType !== null} onOpenChange={(open) => !open && (setPostToManage(null), setActionType(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Acción</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres {actionType === 'delete' ? 'eliminar' : actionType === 'archive' ? 'archivar' : 'publicar'} el post "{postToManage?.title}"?
              {actionType === 'delete' && " Esta acción es irreversible."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => (setPostToManage(null), setActionType(null))}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleActionConfirm}
              className={cn(buttonVariants({variant: actionType === 'delete' ? "destructive" : "default"}))}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
