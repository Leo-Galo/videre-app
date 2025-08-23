// src/components/shared/user-nav.tsx
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogIn, UserPlus, User, Settings, LogOut, LayoutDashboard, Moon, Sun, CreditCard, Bell, CheckCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { VidereIcon } from './videre-icon';
import { usePathname } from 'next/navigation';
import { useSessionStore } from '@/hooks/use-current-user';
import { Skeleton } from '../ui/skeleton';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string; // ISO Date string for sorting
  read: boolean;
  icon: React.ReactNode;
  link?: string;
}

export function UserNav() {
  const { toast } = useToast();
  const [theme, setTheme] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const pathname = usePathname(); // Get current path
  
  const { isAuthenticated, userName, email, actions } = useSessionStore();
  const { clearSession } = actions;

  const handleLogout = () => {
    clearSession();
    if (typeof window !== 'undefined') {
      window.location.href = '/login'; 
    }
  };

  useEffect(() => {
    // We can immediately read from localStorage here because this component
    // is guaranteed to run on the client.
    const storedTheme = localStorage.getItem('theme') || 'light';
    setTheme(storedTheme);
  }, []);
  

  useEffect(() => {
    // Apply theme to the document when it changes
    if (theme) {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const isDashboardArea = pathname.startsWith('/dashboard') || pathname.startsWith('/superadmin');

  if (!isAuthenticated && !isDashboardArea) {
     return (
        <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Cambiar tema">
                {theme === null ? <Skeleton className="h-5 w-5" /> : theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button variant="outline" asChild>
                <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" /> Iniciar sesión
                </Link>
            </Button>
            <Button asChild>
                <Link href="/register">
                <UserPlus className="mr-2 h-4 w-4" /> Registrarse
                </Link>
            </Button>
        </div>
    );
  }

  if (isAuthenticated && isDashboardArea) {
    return (
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Cambiar tema">
            {theme === null ? (
                <Skeleton className="h-5 w-5" /> // Show skeleton while theme is loading
            ) : theme === 'light' ? (
                <Moon className="h-5 w-5" />
            ) : (
                <Sun className="h-5 w-5" />
            )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 md:w-96" align="end">
            <DropdownMenuLabel className="flex justify-between items-center">
              <span>Notificaciones</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-muted-foreground text-center py-4">
                No tienes notificaciones nuevas.
              </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
             <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {userName?.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || <User className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link href={pathname.startsWith('/superadmin') ? "/superadmin" : "/dashboard"} passHref>
                <DropdownMenuItem>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Panel Principal</span>
                </DropdownMenuItem>
              </Link>
              {!pathname.startsWith('/superadmin') && (
                <Link href="/dashboard/subscription" passHref>
                  <DropdownMenuItem>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Gestionar Suscripción</span>
                  </DropdownMenuItem>
                </Link>
              )}
              <Link href={pathname.startsWith('/superadmin') ? "/superadmin/settings" : "/dashboard/settings"} passHref>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Fallback for non-dashboard authenticated users or other edge cases
  return (
     <div className="flex items-center space-x-2">
      <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Cambiar tema">
            {theme === null ? <Skeleton className="h-5 w-5" /> : theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </Button>
      <Button asChild>
        <Link href="/dashboard">
          <LayoutDashboard className="mr-2 h-4 w-4" /> Ir al Panel
        </Link>
      </Button>
    </div>
  )
}
