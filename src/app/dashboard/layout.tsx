

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AppSidebar } from '@/components/shared/app-sidebar';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { SiteLogo } from '@/components/shared/site-logo';
import { UserNav } from '@/components/shared/user-nav';
import { Input } from '@/components/ui/input';
import { Search, AlertTriangle, Info, Clock, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { addDays, differenceInDays, isPast, isToday } from 'date-fns';
import { OnboardingModal } from '@/components/dashboard/onboarding-modal';
import { useCurrentUser, useHasHydrated } from '@/hooks/use-current-user';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isSubscriptionCheckComplete, setIsSubscriptionCheckComplete] = useState(false);
  
  const { isAuthenticated, userName, plan, status } = useCurrentUser();
  const hasHydrated = useHasHydrated(); // Use the hydration hook

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    const trialStartDateStr = localStorage.getItem('trialStartDate');
    const trialDurationDays = parseInt(localStorage.getItem('trialDurationDays') || "3", 10);
    const isSubscriptionPage = pathname.startsWith('/dashboard/subscription');

    if (status === 'trialing' && trialStartDateStr && !isSubscriptionPage) {
      const trialStartDate = new Date(trialStartDateStr);
      const trialEndDate = addDays(trialStartDate, trialDurationDays);
      const daysRemaining = differenceInDays(trialEndDate, new Date());
      
      if (daysRemaining < 0) { // Trial has fully expired
        router.replace('/dashboard/subscription');
        return; // Stop further rendering until redirect happens
      }
    }
    
    setIsSubscriptionCheckComplete(true); // Mark check as complete
    
    if (localStorage.getItem('onboardingCompleted') !== 'true') {
      setShowOnboarding(true);
    }
  }, [hasHydrated, isAuthenticated, router, status, pathname]);
  
  const handleOnboardingComplete = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setShowOnboarding(false);
  };

  const subscriptionAlert = React.useMemo(() => {
    if (!hasHydrated || !status || status === 'active' || pathname.startsWith('/dashboard/subscription')) return null;

    const trialStartDateStr = localStorage.getItem('trialStartDate');
    const trialDurationDays = parseInt(localStorage.getItem('trialDurationDays') || "3", 10);
    
    if (status === 'trialing' && trialStartDateStr) {
      const trialStartDate = new Date(trialStartDateStr);
      const trialEndDate = addDays(trialStartDate, trialDurationDays);
      const daysRemaining = differenceInDays(trialEndDate, new Date());
      
      if (daysRemaining < 0) return null; // Handled by redirect

      if (daysRemaining <= 3) {
        return {
          variant: "warning" as const,
          title: "¡Tu Prueba está por Terminar!",
          description: <>Te queda{daysRemaining === 0 ? '' : 'n'} {daysRemaining + 1} día{daysRemaining === 0 ? '' : 's'} de prueba del plan {plan}.<Link href="/dashboard/subscription" passHref><Button variant="link" className="p-0 h-auto ml-1 text-yellow-700 dark:text-yellow-300 underline">Actualiza tu plan</Button></Link> para no perder acceso.</>,
        };
      }
    }
    return null;
  }, [hasHydrated, plan, status, pathname]);

  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 font-semibold text-primary">Cargando...</p>
      </div>
    );
  }
  
  if (!isSubscriptionCheckComplete) {
     return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 font-semibold text-primary">Verificando estado de la suscripción...</p>
      </div>
    );
  }
  
  const AlertIcon = subscriptionAlert?.variant === 'destructive' ? AlertTriangle : subscriptionAlert?.variant === 'warning' ? Clock : Info;

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
                <Input placeholder="Buscar..." className="pl-9 h-9 w-full md:w-64 lg:w-96" />
              </div>
              <div className="ml-auto flex items-center space-x-4">
                <UserNav />
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {showOnboarding && userName && (
              <OnboardingModal
                isOpen={showOnboarding}
                onClose={handleOnboardingComplete}
                clinicName={userName}
              />
            )}
            {subscriptionAlert && (
              <Alert variant={subscriptionAlert.variant as any} className="mb-6 shadow-md">
                <AlertIcon className="h-5 w-5" />
                <AlertTitle>{subscriptionAlert.title}</AlertTitle>
                <AlertDescription>
                  {subscriptionAlert.description}
                </AlertDescription>
              </Alert>
            )}
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
