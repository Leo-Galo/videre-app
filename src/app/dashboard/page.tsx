
"use client";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { SalesOverviewChart } from "@/components/dashboard/sales-overview-chart";
import { InventoryStatusWidget } from "@/components/dashboard/inventory-status-widget";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { DollarSign, Users, ShoppingBag, CalendarCheck2, ListChecks, Gift, Repeat, PhoneCall } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { es } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { getDashboardKpiData, getTodaysAppointments, getUpcomingBirthdays, getFollowUpReminders, type KpiData } from "@/services/dashboard-service";
import type { Patient } from "@/types/patient";
import type { Appointment } from "@/types/appointment";

function UpcomingAppointmentsWidget() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getTodaysAppointments().then(data => {
      setAppointments(data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <Card className="shadow-md rounded-xl">
        <CardHeader><Skeleton className="h-6 w-3/4 mb-1" /></CardHeader>
        <CardContent className="space-y-3">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-semibold flex items-center">
          <ListChecks className="h-5 w-5 mr-2 text-primary" />
          Próximas Citas Hoy
        </CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/appointments">Ver Todas</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground pt-4 text-center">No hay citas programadas para hoy.</p>
        ) : (
          <ul className="space-y-2">
            {appointments.slice(0, 3).map(appt => (
              <li key={appt.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted/50">
                <div>
                  <span className="font-medium text-foreground">{format(parseISO(appt.dateTime), "HH:mm", { locale: es })}</span> - {appt.patientName}
                  <p className="text-xs text-muted-foreground">{appt.type}</p>
                </div>
                <Button variant="ghost" size="xs" asChild>
                  <Link href={`/dashboard/appointments`}>Detalles</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function UpcomingBirthdaysWidget() {
  const [upcoming, setUpcoming] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const handleContactBirthday = (patientName: string) => {
    // This logic remains as it is client-side interaction
    const currentPlan = localStorage.getItem('subscriptionPlan') || "Básico";
    if (currentPlan.toLowerCase() !== 'premium') {
      toast({
        variant: "default", 
        title: "Función Premium",
        description: "Registrar contactos y el seguimiento detallado de campañas son funciones del Plan Premium.",
        duration: 5000,
      });
      return;
    }
    toast({
      title: "Simulación de Registro de Contacto",
      description: `Acción 'Saludo de Cumpleaños' para ${patientName} simulada.`,
      duration: 4000,
    });
  };

  useEffect(() => {
    getUpcomingBirthdays().then(data => {
      setUpcoming(data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) { 
    return (
        <Card className="shadow-md rounded-xl">
            <CardHeader><Skeleton className="h-6 w-3/4 mb-1" /></CardHeader>
            <CardContent className="space-y-3">
                {[...Array(2)].map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-semibold flex items-center"><Gift className="h-5 w-5 mr-2 text-primary" />Cumpleaños Próximos</CardTitle>
        <Button variant="outline" size="sm" asChild><Link href="/dashboard/reports">Ver Reporte</Link></Button>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (<p className="text-sm text-muted-foreground pt-4 text-center">No hay cumpleaños en los próximos 14 días.</p>) : (
          <ul className="space-y-2">
            {upcoming.slice(0,3).map(p => (
              <li key={p.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted/50">
                <div><span className="font-medium">{p.firstName} {p.lastName}</span><p className="text-xs text-muted-foreground">{format(parseISO(p.dateOfBirth!), "dd 'de' MMMM", {locale:es})}</p></div>
                <Button variant="ghost" size="xs" onClick={() => handleContactBirthday(`${p.firstName} ${p.lastName}`)}><PhoneCall className="mr-1 h-3 w-3"/>Registrar Contacto</Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function FollowUpRemindersWidget() {
  const [reminders, setReminders] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const handleContactFollowUp = (patientName: string) => {
    // This logic also remains client-side
    const currentPlan = localStorage.getItem('subscriptionPlan') || "Básico";
    if (currentPlan.toLowerCase() !== 'premium') {
      toast({
        variant: "default",
        title: "Función Premium",
        description: "Registrar contactos y el seguimiento detallado de campañas son funciones del Plan Premium.",
        duration: 5000,
      });
      return;
    }
    toast({
      title: "Simulación de Registro de Contacto",
      description: `Acción 'Recordatorio de Seguimiento' para ${patientName} simulada.`,
      duration: 4000,
    });
  };

  useEffect(() => {
    getFollowUpReminders().then(data => {
      setReminders(data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) { 
    return (
        <Card className="shadow-md rounded-xl">
            <CardHeader><Skeleton className="h-6 w-3/4 mb-1" /></CardHeader>
            <CardContent className="space-y-3">
                {[...Array(2)].map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-semibold flex items-center"><Repeat className="h-5 w-5 mr-2 text-primary" />Recordatorios de Seguimiento</CardTitle>
         <Button variant="outline" size="sm" asChild><Link href="/dashboard/reports">Ver Reporte</Link></Button>
      </CardHeader>
      <CardContent>
         {reminders.length === 0 ? (<p className="text-sm text-muted-foreground pt-4 text-center">No hay seguimientos próximos o vencidos.</p>) : (
          <ul className="space-y-2">
            {reminders.slice(0,3).map(p => (
              <li key={p.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted/50">
                <div>
                  <span className="font-medium">{p.firstName} {p.lastName}</span>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(p.overallNextRecommendedVisitDate!), "dd MMM yyyy", {locale:es})} - {p.overallReasonForNextVisit || 'Seguimiento'}
                  </p>
                </div>
                <Button variant="ghost" size="xs" onClick={() => handleContactFollowUp(`${p.firstName} ${p.lastName}`)}><PhoneCall className="mr-1 h-3 w-3"/>Registrar Contacto</Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}


export default function DashboardPage() {
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  
  useEffect(() => {
    getDashboardKpiData().then(data => {
      setKpiData(data);
    });
  }, []);

  const formatCurrency = (amount: number) => `¢${new Intl.NumberFormat('es-CR', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)}`;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Ingresos del Mes"
          value={kpiData ? formatCurrency(kpiData.totalSales.value) : '...'} 
          icon={DollarSign}
          trend={kpiData?.totalSales.trend}
          trendDirection={kpiData && parseFloat(kpiData.totalSales.trend) >= 0 ? 'up' : 'down'}
          description="Suma de ventas completadas este mes."
          isLoading={!kpiData}
        />
        <KpiCard
          title="Nuevos Pacientes (Mes)"
          value={kpiData ? `+${kpiData.newPatients.value}` : '...'}
          icon={Users}
          trend={kpiData?.newPatients.trend}
          trendDirection={kpiData && parseFloat(kpiData.newPatients.trend) >= 0 ? 'up' : 'down'}
          description="Pacientes registrados este mes."
          isLoading={!kpiData}
        />
        <KpiCard
          title="Productos Vendidos (Mes)"
          value={kpiData?.productsSold.value ?? '...'}
          icon={ShoppingBag}
          description="Total de artículos vendidos."
          isLoading={!kpiData}
        />
        <KpiCard
          title="Citas Hoy"
          value={kpiData?.appointmentsToday.value ?? '...'}
          icon={CalendarCheck2}
          description="Consultas programadas para hoy."
          isLoading={!kpiData}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesOverviewChart />
        </div>
        <div className="lg:col-span-1 space-y-6">
         <InventoryStatusWidget />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <UpcomingAppointmentsWidget />
        <FollowUpRemindersWidget />
      </div>

       <div className="grid gap-6 md:grid-cols-2">
        <UpcomingBirthdaysWidget />
        <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
           <CardHeader>
            <CardTitle>Espacio para otro Widget</CardTitle>
            <CardDescription>Pendiente de definir.</CardDescription>
           </CardHeader>
           <CardContent>
            <p className="text-muted-foreground text-center py-8">Contenido futuro aquí.</p>
           </CardContent>
        </Card>
      </div>
      
      <div>
        <RecentSales />
      </div>
    </div>
  );
}

