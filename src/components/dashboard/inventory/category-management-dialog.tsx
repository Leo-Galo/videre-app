
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, Trash2, Save, X, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CategoryManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  categories: string[];
  onUpdateCategory: (action: 'rename' | 'delete', oldName: string, newName?: string) => Promise<void>;
}

export function CategoryManagementDialog({ isOpen, onOpenChange, categories, onUpdateCategory }: CategoryManagementDialogProps) {
  const { toast } = useToast();
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const handleEditClick = (categoryName: string) => {
    setEditingCategory(categoryName);
    setNewName(categoryName);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewName("");
  };

  const handleSaveEdit = async () => {
    if (!editingCategory || !newName.trim() || newName.trim() === editingCategory) {
      handleCancelEdit();
      return;
    }
    if (categories.some(c => c.toLowerCase() === newName.trim().toLowerCase() && c.toLowerCase() !== editingCategory.toLowerCase())) {
      toast({ variant: 'destructive', title: 'Error', description: 'Esa categoría ya existe.' });
      return;
    }
    await onUpdateCategory('rename', editingCategory, newName.trim());
    handleCancelEdit();
  };

  const handleDeleteClick = (categoryName: string) => {
    if (categoryName.toLowerCase() === 'otro') {
      toast({ variant: 'destructive', title: 'Acción no permitida', description: 'La categoría "Otro" no se puede eliminar.' });
      return;
    }
    setCategoryToDelete(categoryName);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      await onUpdateCategory('delete', categoryToDelete);
      setCategoryToDelete(null);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Layers className="h-5 w-5"/>Gestionar Categorías de Productos</DialogTitle>
            <DialogDescription>
              Edita los nombres de las categorías o elimínalas. Al eliminar, los productos asociados se moverán a la categoría "Otro".
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-80 my-4 pr-4">
            <div className="space-y-2">
              {categories.map(category => (
                <div key={category} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50">
                  {editingCategory === category ? (
                    <div className="flex-grow flex items-center gap-2">
                      <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="h-8" />
                      <Button size="icon" className="h-8 w-8" onClick={handleSaveEdit}><Save className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}><X className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium">{category}</span>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditClick(category)}><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteClick(category)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar la categoría "{categoryToDelete}". Todos los productos en esta categoría serán movidos a la categoría "Otro". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Confirmar y Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
