
"use client";

import { KpiCard } from "@/components/dashboard/kpi-card"; // Reutilizar si es adecuado
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { BarChart3, Users, ShieldCheck, AlertTriangle, TrendingUp, DollarSign, CheckCircle2, Server, KeyRound, Cloud } from "lucide-react"; 
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SuperAdminDashboardPage() {
  const globalMetrics = {
    totalClinics: 0,
    activeSubscriptions: 0,
    trialSubscriptions: 0,
    issuesReported: 0,
    monthlyRecurringRevenueUSD: 0, 
  };
  
  const launchChecklist = [
    { id: 'be_fe', label: "Backend de Fact. Electrónica", description: "Servicio para generar, firmar y enviar facturas a Hacienda.", completed: false },
    { id: 'be_security', label: "Reglas de Seguridad (Multi-Tenant)", description: "Implementar reglas en Firestore para aislar los datos de cada clínica.", completed: false },
    { id: 'be_proxy', label: "Proxy Seguro para API Keys", description: "Crear endpoints de backend para manejar claves de IA y otros servicios.", completed: false },
    { id: 'be_automation', label: "Tareas Automatizadas (Cron Jobs)", description: "Configurar funciones para recordatorios de citas, backups, etc.", completed: false },
    { id: 'be_monitoring', label: "Monitoreo y Salud del Sistema", description: "Crear endpoints para consultar métricas de la infraestructura (CPU, latencia, errores).", completed: false },
    { id: 'fe_ready', label: "Interfaz de Usuario Principal", description: "El frontend está conectado a Firebase y listo para la integración final.", completed: true },
  ];

  const formatCurrencyUSD = (value: number) => 
    `$${new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)}`;


  return (
    <div className="space-y-6 md:space-y-8">
      <h1 className="text-3xl font-headline font-bold text-primary">Panel de Super Administrador</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Clínicas Registradas" value={globalMetrics.totalClinics} icon={Users} description="Número total de ópticas en la plataforma." />
        <KpiCard title="Suscripciones Activas" value={globalMetrics.activeSubscriptions} icon={ShieldCheck} trend="+0 esta semana" trendDirection="neutral" description="Clínicas con planes de pago activos." />
        <KpiCard title="MRR Estimado (USD)" value={formatCurrencyUSD(globalMetrics.monthlyRecurringRevenueUSD)} icon={DollarSign} trend="+ $0 vs mes anterior" trendDirection="neutral" description="Ingreso Mensual Recurrente." />
        <KpiCard title="Problemas Reportados (Últ. 24h)" value={globalMetrics.issuesReported} icon={AlertTriangle} trendDirection={globalMetrics.issuesReported > 0 ? "warning" : "neutral"} description="Tickets de soporte o alertas críticas." link={{ href: "/superadmin/issues", text: "Ver Detalles" }} />
      </div>

       <Card className="shadow-xl rounded-xl border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-primary">Estado de Preparación para Lanzamiento</CardTitle>
            <CardDescription>Esta es una lista de verificación de las tareas críticas de backend pendientes antes de poder comercializar Videre de forma segura.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
             {launchChecklist.map(item => (
                 <div key={item.id} className="flex items-start gap-3 p-2 rounded-md transition-colors hover:bg-primary/10">
                     {item.completed ? (
                         <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                     ) : (
                         <div className="h-5 w-5 border-2 border-dashed border-yellow-500 rounded-full mt-0.5 flex-shrink-0" />
                     )}
                     <div>
                         <p className={`font-medium ${item.completed ? 'text-foreground' : 'text-yellow-700'}`}>{item.label}</p>
                         <p className="text-xs text-muted-foreground">{item.description}</p>
                     </div>
                 </div>
             ))}
          </CardContent>
          <CardFooter>
             <p className="text-xs text-muted-foreground">Una vez completadas estas tareas de backend, el software estará listo para ser comercializado.</p>
          </CardFooter>
        </Card>


      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accesos directos a tareas comunes de superadministración.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button variant="outline" asChild><Link href="/superadmin/clinics">Gestionar Clínicas</Link></Button>
            <Button variant="outline" asChild><Link href="/superadmin/subscriptions">Ver Suscripciones</Link></Button>
            <Button variant="outline" asChild><Link href="/superadmin/blog-management">Administrar Blog</Link></Button>
            <Button variant="outline" asChild><Link href="/superadmin/system-health">Salud del Sistema</Link></Button>
            <Button variant="outline" asChild><Link href="/superadmin/settings">Configuración Global</Link></Button>
            <Button variant="outline" asChild><Link href="/superadmin/reports">Centro de Reportes</Link></Button> 
          </CardContent>
        </Card>
        
        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle>Crecimiento de Clínicas</CardTitle>
            <CardDescription>Nuevas clínicas registradas por mes (ejemplo).</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[300px]">
             <div className="text-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 text-primary/30" />
                <p>Aquí se mostraría un gráfico con la tendencia de crecimiento de clínicas registradas en la plataforma.</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
