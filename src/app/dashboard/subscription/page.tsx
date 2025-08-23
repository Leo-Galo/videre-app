
"use client";

import { useState, useEffect, Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CalendarDays, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { addDays, format, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { useSessionStore } from '@/hooks/use-current-user';

interface SubscriptionDetails {
  planName: string;
  status: "trialing" | "active" | "grace_period" | "expired" | "unknown" | "cancelled" | "suspended" | "payment_failed";
  renewalDate?: Date | null;
}

function SubscriptionPageContent() {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { plan: currentPlan, status: currentStatus } = useSessionStore();

  useEffect(() => {
    setIsLoading(true);
    // Simulate fetching subscription details
    setTimeout(() => {
      let details: SubscriptionDetails = {
        planName: currentPlan || 'Básico',
        status: (currentStatus as SubscriptionDetails["status"]) || "unknown",
        renewalDate: localStorage.getItem('renewalDate') ? new Date(localStorage.getItem('renewalDate')!) : null,
      };
      setSubscription(details);
      setIsLoading(false);
    }, 500);
  }, [currentPlan, currentStatus]);

  if (isLoading || !subscription) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  const getStatusInfo = () => {
    switch (subscription.status) {
      case 'active':
        return {
          variant: 'default' as const,
          text: 'Activa',
          icon: <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />,
          description: `Tu plan se renovará el ${subscription.renewalDate ? format(subscription.renewalDate, 'PPP', { locale: es }) : 'N/A'}.`
        };
      case 'trialing':
        return {
          variant: 'secondary' as const,
          text: 'En Prueba',
          icon: <CheckCircle2 className="mr-2 h-4 w-4 text-blue-500" />,
          description: `Tu prueba finaliza el ${subscription.renewalDate ? format(subscription.renewalDate, 'PPP', { locale: es }) : 'N/A'}.`
        };
      default:
        return {
          variant: 'destructive' as const,
          text: 'Inactiva',
          icon: <AlertTriangle className="mr-2 h-4 w-4" />,
          description: "Tu suscripción no está activa. Por favor, actualiza tu plan para continuar."
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary">Gestionar Suscripción</h1>
        <p className="text-muted-foreground">Revisa el estado de tu plan Videre o haz cambios.</p>
      </div>
      
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" /> Tu Plan Actual: {subscription.planName}
          </CardTitle>
          <CardDescription className="flex items-center gap-2 pt-1">
            {statusInfo.icon}
            Estado: <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>{statusInfo.description}</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" asChild>
            <Link href="/dashboard/subscription/change-plan">Ver o Cambiar de Plan</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
      <SubscriptionPageContent />
    </Suspense>
  );
}
