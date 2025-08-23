
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation'; 
import { AppSidebar } from '@/components/shared/app-sidebar';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { SiteLogo } from '@/components/shared/site-logo';
import { UserNav } from '@/components/shared/user-nav';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"; // Import useToast

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname(); 
  const { toast } = useToast(); // Get toast function from useToast
  const [isClient, setIsClient] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const authStatus = localStorage.getItem('mockAuth') === 'true';
    const userRole = localStorage.getItem('mockUserRole');
    
    if (!authStatus) {
      router.replace('/login'); 
      return;
    }
    
    if (userRole !== 'SuperAdmin') {
      toast({ variant: "destructive", title: "Acceso Denegado", description: "No tienes permisos para acceder a esta área." });
      router.replace('/dashboard');
      return;
    }
    
    setIsSuperAdmin(true);
  }, [router, pathname, toast]); // Added toast to dependency array

  if (!isClient || !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-primary font-semibold">Cargando Panel SuperAdmin...</div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen bg-background">
        <AppSidebar /> 
        <SidebarInset className="flex-1 flex flex-col">
          <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
              <div className="md:hidden">
                 <SidebarTrigger />
              </div>
              <div className="hidden md:block mr-4">
                 <SidebarTrigger />
              </div>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar en SuperAdmin..." className="pl-9 h-9 w-full md:w-64 lg:w-96" />
              </div>
              <div className="ml-auto flex items-center space-x-4">
                <UserNav />
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
