
// src/components/shared/app-sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarMenuBadge,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { SiteLogo } from "./site-logo";
import { VidereIcon } from "./videre-icon";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  BarChart3, 
  DollarSign, 
  CalendarDays, 
  Settings, 
  LogOut,
  HelpCircle,
  UserCog,
  Sparkles, 
  ChevronDown,
  ChevronUp,
  Shield,
  Store,
  DatabaseZap, 
  BookOpen,
  FileText,
  HardDriveDownload,
  History, 
  MessageSquareQuote,
  Tag, 
  Archive,
  MailQuestion, 
  Building,
  Handshake,
  TrendingDown,
  Landmark,
  Stethoscope,
  ArchiveRestore,
  Bike,
  FlaskConical,
  Coins,
  Receipt,
  ClipboardList,
  PiggyBank,
  MessageSquareWarning,
  Microscope,
  FileSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useEffect, useState, useCallback } from "react"; 
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import NextImage from 'next/image';
import { useSessionStore } from '@/hooks/use-current-user';
import { ToastAction } from "@/components/ui/toast";

// This is now the single source of truth for sidebar data
const useSidebarData = () => {
  const { userName, userRole, email, isSuperAdmin, plan } = useSessionStore();
  const { clearSession } = useSessionStore.getState().actions;
  
  const logout = async () => {
    clearSession();
    if (typeof window !== 'undefined') {
      window.location.href = '/login'; 
    }
  };
  return { userName, userRole, email, isSuperAdmin, logout, currentPlan: plan };
};

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  roles?: string[];
  minPlan?: 'Pro' | 'Premium';
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Panel", icon: <LayoutDashboard /> },
  { href: "/dashboard/patients", label: "Pacientes", icon: <Users /> },
  { href: "/dashboard/appointments", label: "Citas", icon: <CalendarDays /> },
  { href: "/dashboard/clinical-history", label: "Historial Clínico", icon: <Stethoscope />, roles: ["Admin", "Optómetra"] },
  { href: "/dashboard/inventory", label: "Inventario", icon: <Package /> },
  { href: "/dashboard/lab-orders", label: "Laboratorio", icon: <FlaskConical /> },
  { href: "/dashboard/suppliers", label: "Proveedores", icon: <Landmark />, minPlan: 'Pro' },
  { href: "/dashboard/courier", label: "Mensajería", icon: <Bike /> },
  { href: "/dashboard/reports", label: "Reportes", icon: <BarChart3 /> },
  { href: "/dashboard/marketing/coupons", label: "Cupones y Descuentos", icon: <Tag/>, roles: ["Admin"], minPlan: 'Premium' },
  { href: "/dashboard/expenses", label: "Control de Gastos", icon: <TrendingDown />, roles: ["Admin"], minPlan: 'Premium' },
  { href: "/dashboard/agreements", label: "Convenios", icon: <Handshake />, roles: ["Admin"], minPlan: 'Premium' },
];

const salesNavItems: NavItem[] = [
    { href: "/dashboard/sales", label: "Facturación", icon: <Receipt/> },
    { href: "/dashboard/sales/accounts-receivable", label: "Cuentas por Cobrar", icon: <DollarSign /> },
    { href: "/dashboard/sales/history", label: "Historial de Ventas", icon: <History/> },
];

const closuresNavItems: NavItem[] = [
    { href: "/dashboard/closures/opening", label: "Apertura de Caja", icon: <ArchiveRestore /> },
    { href: "/dashboard/closures/daily", label: "Cierre Diario", icon: <Archive /> },
    { href: "/dashboard/closures/monthly", label: "Cierre Mensual", icon: <CalendarDays />, minPlan: 'Pro' },
];

const queryNavItems: NavItem[] = [
    { href: "/dashboard/consultas/facturas", label: "Facturas", icon: <Receipt /> },
    { href: "/dashboard/consultas/recetas", label: "Recetas", icon: <Microscope /> },
];


const managementNavItems: NavItem[] = [
  { href: "/dashboard/users", label: "Gestión Usuarios", icon: <UserCog />, roles: ["Admin"] },
  { href: "/dashboard/settings", label: "Configuración Clínica", icon: <Settings />, roles: ["Admin"] },
  { href: "/dashboard/settings/branches", label: "Gestionar Sucursales", icon: <Building />, roles: ["Admin"], minPlan: 'Pro'},
  { href: "/dashboard/settings/budget", label: "Presupuestos", icon: <PiggyBank />, roles: ["Admin"], minPlan: 'Premium'},
  { href: "/dashboard/help", label: "Ayuda y Soporte", icon: <HelpCircle />, roles: ["Admin", "Optómetra", "Asesor"] },
];

const superAdminNavItems: NavItem[] = [
  { href: "/superadmin", label: "Panel SA", icon: <Shield /> },
  { href: "/superadmin/clinics", label: "Clínicas", icon: <Store /> },
  { href: "/superadmin/subscriptions", label: "Suscripciones", icon: <FileText /> },
  { href: "/superadmin/reports", label: "Reportes SA", icon: <BarChart3 /> }, 
  { href: "/superadmin/marketing-database", label: "Base de Datos Marketing", icon: <Users /> },
  { href: "/superadmin/blog-management", label: "Gestión Blog", icon: <BookOpen /> },
  { href: "/superadmin/testimonials-management", label: "Testimonios", icon: <MessageSquareQuote /> },
  { href: "/superadmin/contact-inquiries", label: "Consultas/Contacto", icon: <MailQuestion /> },
  { href: "/superadmin/issues", label: "Incidencias", icon: <MessageSquareWarning />},
  { href: "/superadmin/backups", label: "Gestión Backups", icon: <HardDriveDownload /> },
  { href: "/superadmin/system-health", label: "Salud del Sistema", icon: <DatabaseZap /> },
  { href: "/superadmin/settings", label: "Configuración Global", icon: <Settings /> },
];

const getSafeClinicLogo = (rawUrl: string | null): string | null => {
    if (!rawUrl) return null;
    try {
        const url = new URL(rawUrl);
        const allowedHosts = ['i.imgur.com', 'placehold.co'];
        if (allowedHosts.includes(url.hostname)) {
            return rawUrl;
        }
    } catch (e) {
        // Invalid URL format
    }
    return null; // Return null for invalid or unallowed URLs
};


export function AppSidebar() {
  const pathname = usePathname();
  const { open, state } = useSidebar();
  const { userName, userRole, email, isSuperAdmin, logout, currentPlan } = useSidebarData();
  const { toast } = useToast();
  const [clinicLogo, setClinicLogo] = useState<string | null>(null);

  const isSalesPath = pathname.startsWith("/dashboard/sales");
  const isClosuresPath = pathname.startsWith("/dashboard/closures");
  const isQueryPath = pathname.startsWith("/dashboard/consultas");
  const isManagementPath = pathname.startsWith("/dashboard/users") || pathname.startsWith("/dashboard/settings");

  const [isSalesOpen, setIsSalesOpen] = React.useState(isSalesPath);
  const [isClosuresOpen, setIsClosuresOpen] = React.useState(isClosuresPath);
  const [isQueryOpen, setIsQueryOpen] = React.useState(isQueryPath);
  const [isManagementOpen, setIsManagementOpen] = React.useState(isManagementPath);


  React.useEffect(() => {
    // Sync open state with path changes
    setIsSalesOpen(pathname.startsWith("/dashboard/sales"));
    setIsClosuresOpen(pathname.startsWith("/dashboard/closures"));
    setIsQueryOpen(pathname.startsWith("/dashboard/consultas"));
    setIsManagementOpen(pathname.startsWith("/dashboard/users") || pathname.startsWith("/dashboard/settings"));
  }, [pathname]);

  useEffect(() => {
    if (!isSuperAdmin) {
      const savedSettings = localStorage.getItem("videreClinicSettings");
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          const safeLogoUrl = getSafeClinicLogo(parsed.clinicLogo);
          setClinicLogo(safeLogoUrl);
        } catch (error) {
          console.warn("Could not load clinic logo from settings, using default.", error);
          setClinicLogo(null);
        }
      } else {
        setClinicLogo(null);
      }
    } else {
      setClinicLogo(null); // Reset for superadmin view
    }
  }, [isSuperAdmin, pathname, userName]); // Added userName to re-check on user change

  const isActive = (href: string) => {
     // Exact match only
     return pathname === href;
  }

  const showUpgradePrompt = (requiredPlan: 'Pro' | 'Premium') => {
    toast({
      title: `Funcionalidad ${requiredPlan} Requerida`,
      description: `Esta es una característica del plan ${requiredPlan}. Por favor, actualiza tu suscripción para acceder.`,
      action: (
        <ToastAction altText="Actualizar Plan" asChild>
            <Link href="/dashboard/subscription">Actualizar Plan</Link>
        </ToastAction>
      ),
      variant: 'default',
      className: 'bg-yellow-400/80 border-yellow-500 text-yellow-900 dark:bg-yellow-800/50 dark:border-yellow-700 dark:text-yellow-200',
    });
  };

  const checkAccess = (itemPlan?: 'Pro' | 'Premium'): { locked: boolean; requiredPlan?: 'Pro' | 'Premium' } => {
    if (isSuperAdmin) return { locked: false }; 
    if (!itemPlan) return { locked: false }; 

    const planHierarchy = { basic: 1, pro: 2, premium: 3 };
    const currentUserPlanLevel = planHierarchy[currentPlan?.toLowerCase() as keyof typeof planHierarchy] || 0;
    const requiredPlanLevel = planHierarchy[itemPlan.toLowerCase() as keyof typeof planHierarchy];

    if (currentUserPlanLevel < requiredPlanLevel) {
      return { locked: true, requiredPlan: itemPlan };
    }
    return { locked: false };
  };
  
  const filteredMainNavItems = mainNavItems.filter(item => {
    if (!userRole || (item.roles && !item.roles.includes(userRole))) {
      return false;
    }
    return true;
  });

  const filteredManagementNavItems = managementNavItems.filter(item => {
    if (!userRole || (item.roles && !item.roles.includes(userRole))) {
        return false;
    }
    return true;
  });

  const renderMenuItem = (item: NavItem, isSubItem: boolean = false) => {
    const { locked, requiredPlan } = checkAccess(item.minPlan);
    const ButtonComponent = isSubItem ? SidebarMenuSubButton : SidebarMenuButton;

    return (
      <Link
        href={locked ? "#" : item.href}
        onClick={(e) => {
          if (locked && requiredPlan) {
            e.preventDefault();
            showUpgradePrompt(requiredPlan);
          }
        }}
        aria-disabled={locked}
        tabIndex={locked ? -1 : undefined}
        className={cn(locked && "cursor-not-allowed")}
      >
        <ButtonComponent
          isActive={!locked && isActive(item.href)}
          tooltip={{ children: item.label, side: "right", align: "center" }}
          aria-label={item.label}
          className={cn(locked && "opacity-60 hover:bg-sidebar-accent")}
        >
          <div className="flex items-center gap-2 flex-grow min-w-0">
            {item.icon && React.cloneElement(item.icon as React.ReactElement, { className: cn(isSubItem && !open && 'mx-auto') })}
            <span className={cn("truncate", !open && !isSubItem && "hidden", isSubItem && state === "collapsed" && "hidden", isSubItem && open && "")}>
              {item.label}
            </span>
          </div>
          {item.badge && !locked && <SidebarMenuBadge className={cn(!open && "hidden", "flex-shrink-0")}>{item.badge}</SidebarMenuBadge>}
          {locked && open && (
            <Badge variant="outline" className="ml-auto text-xs bg-yellow-400/20 border-yellow-500 text-yellow-600 px-1.5 py-0.5 flex-shrink-0">
              {requiredPlan}
            </Badge>
          )}
        </ButtonComponent>
      </Link>
    );
  };

  const userEmailDisplay = email || "";


  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
      <SidebarHeader className="p-4">
        {clinicLogo && !isSuperAdmin ? (
             <Link 
                href="/dashboard" 
                className={cn(
                    "flex items-center h-full",
                    open ? "justify-start" : "justify-center"
                )}
             >
                <div className={cn("relative", open ? "h-10 w-32" : "h-8 w-8")}>
                    <NextImage 
                        src={clinicLogo} 
                        alt="Logo de la Clínica" 
                        fill={true}
                        style={{ objectFit: 'contain' }}
                    />
                </div>
            </Link>
        ) : (
             <SiteLogo 
                className={cn(
                    "text-sidebar-foreground", 
                    open ? "flex" : "hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:w-full", 
                    !open && "justify-center items-center w-full"
                )} 
            />
        )}
      </SidebarHeader>

      <SidebarContent className="flex-grow p-2">
        <SidebarMenu>
          {isSuperAdmin ? (
            <SidebarGroup>
              <SidebarGroupLabel className={cn(!open && "hidden")}>Super Admin</SidebarGroupLabel>
              {superAdminNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  {renderMenuItem(item)}
                </SidebarMenuItem>
              ))}
            </SidebarGroup>
          ) : (
            <>
              <SidebarGroup>
                <SidebarGroupLabel className={cn(!open && "hidden")}>Menú Principal</SidebarGroupLabel>

                {/* 1. Panel */}
                <SidebarMenuItem key={"/dashboard"}>
                  {renderMenuItem(filteredMainNavItems.find(i => i.href === "/dashboard")!)}
                </SidebarMenuItem>
                
                {/* 2. New Query Group */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                      onClick={() => {if (open) setIsQueryOpen(!isQueryOpen)}}
                      isActive={isQueryPath}
                      tooltip={{children: "Consultas", side: "right", align:"center"}}
                      aria-label="Consultas"
                      className={cn(
                        open ? "justify-between" : "",
                        open && isQueryPath && "bg-transparent text-sidebar-primary data-[active=true]:bg-transparent data-[active=true]:text-sidebar-primary",
                        open && isQueryPath && "font-semibold"
                      )}
                  >
                    <div className="flex items-center gap-2">
                        <FileSearch/>
                        <span className={cn(!open && "hidden")}>Consultas</span>
                    </div>
                    {open && (isQueryOpen ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>)}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {(isQueryOpen || state === "collapsed") && (
                    <SidebarMenuSub className={cn(open && "pl-4")}>
                      {queryNavItems.map((item) => (
                          <SidebarMenuSubItem key={item.href}>
                              {renderMenuItem(item, true)}
                          </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                )}


                {/* 3. Sales Group */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                      onClick={() => {if (open) setIsSalesOpen(!isSalesOpen)}}
                      isActive={isSalesPath}
                      tooltip={{children: "Ventas", side: "right", align:"center"}}
                      aria-label="Ventas"
                      className={cn(
                        open ? "justify-between" : "",
                        open && isSalesPath && "bg-transparent text-sidebar-primary data-[active=true]:bg-transparent data-[active=true]:text-sidebar-primary",
                        open && isSalesPath && "font-semibold"
                      )}
                  >
                    <div className="flex items-center gap-2">
                        <DollarSign/>
                        <span className={cn(!open && "hidden")}>Ventas</span>
                    </div>
                    {open && (isSalesOpen ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>)}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {(isSalesOpen || state === "collapsed") && (
                    <SidebarMenuSub className={cn(open && "pl-4")}>
                      {salesNavItems.map((item) => (
                          <SidebarMenuSubItem key={item.href}>
                              {renderMenuItem(item, true)}
                          </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                )}

                {/* 4. Closures Group */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                      onClick={() => {if (open) setIsClosuresOpen(!isClosuresOpen)}}
                      isActive={isClosuresPath}
                      tooltip={{children: "Cierres", side: "right", align:"center"}}
                      aria-label="Cierres"
                      className={cn(
                        open ? "justify-between" : "",
                        open && isClosuresPath && "bg-transparent text-sidebar-primary data-[active=true]:bg-transparent data-[active=true]:text-sidebar-primary",
                        open && isClosuresPath && "font-semibold"
                      )}
                  >
                    <div className="flex items-center gap-2">
                        <ClipboardList/>
                        <span className={cn(!open && "hidden")}>Cierres</span>
                    </div>
                    {open && (isClosuresOpen ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>)}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {(isClosuresOpen || state === "collapsed") && (
                    <SidebarMenuSub className={cn(open && "pl-4")}>
                      {closuresNavItems.map((item) => (
                          <SidebarMenuSubItem key={item.href}>
                              {renderMenuItem(item, true)}
                          </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                )}
                
                {filteredMainNavItems.filter(i => i.href !== "/dashboard").map((item) => (
                  <SidebarMenuItem key={item.href}>
                    {renderMenuItem(item)}
                  </SidebarMenuItem>
                ))}
              </SidebarGroup>
              
              <Separator className="my-4" />
              
              {filteredManagementNavItems.length > 0 && (
                <SidebarGroup>
                 <SidebarMenuItem>
                    <SidebarMenuButton
                        onClick={() => {if (open) setIsManagementOpen(!isManagementOpen)}}
                        isActive={isManagementPath}
                        tooltip={{children: "Administración", side: "right", align:"center"}}
                        aria-label="Administración"
                        className={cn(
                            open ? "justify-between" : "",
                             open && isManagementPath && "bg-transparent text-sidebar-primary data-[active=true]:bg-transparent data-[active=true]:text-sidebar-primary",
                             open && isManagementPath && "font-semibold"
                          )}
                    >
                        <div className="flex items-center gap-2">
                            <Settings/>
                            <span className={cn(!open && "hidden")}>Administración</span>
                        </div>
                        {open && (isManagementOpen ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>)}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {(isManagementOpen || state === "collapsed") && (
                      <SidebarMenuSub className={cn(open && "pl-4")}>
                          {filteredManagementNavItems.map((item) => (
                              <SidebarMenuSubItem key={item.href}>
                                 {renderMenuItem(item, true)}
                              </SidebarMenuSubItem>
                          ))}
                      </SidebarMenuSub>
                  )}
                </SidebarGroup>
              )}
            </>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className={cn("flex items-center gap-3 text-sidebar-foreground", !open && "justify-center")}>
          <VidereIcon size={open ? 36 : 28} color="currentColor"/>
          <div className={cn("flex flex-col", !open && "hidden")}>
            <span className="text-sm font-medium">{userName}</span>
            <span className="text-xs text-sidebar-foreground/70">{userEmailDisplay}</span>
          </div>
        </div>
        <Button variant="ghost" className="mt-2 w-full justify-start text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0" onClick={logout}>
          <div className="flex items-center gap-2">
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={cn(!open && "hidden", "group-data-[collapsible=icon]:hidden")}>Cerrar sesión</span>
          </div>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
