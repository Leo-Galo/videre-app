
"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Zap, Database, Cloud, Server, Trash2, RotateCw, AlertTriangle, CheckCircle2, ShieldAlert, TrendingUp } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/kpi-card'; // Reutilizar KPI card
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge'; // Added missing import

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
}

// TODO: Backend Integration - Fetch real system health data from monitoring services (e.g., Firebase Performance, Google Cloud Monitoring)
const initialSystemMetrics: SystemMetric[] = [];


export default function SuperAdminSystemHealthPage() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaningCache, setIsCleaningCache] = useState<string | null>(null);

  useEffect(() => {
    // SIMULATED: Fetching system metrics
    // TODO: Backend Integration - Fetch real-time metrics from monitoring tools
    setTimeout(() => {
      setMetrics(initialSystemMetrics.map(m => ({...m, value: Math.random() * (m.name.includes('Error') ? 2 : 100) })));
      setIsLoading(false);
    }, 1500);
  }, []);

  const handleClearCache = async (cacheType: string) => {
    setIsCleaningCache(cacheType);
    // SIMULATED: API call to backend to clear specific cache
    // TODO: Backend Integration - Call a Cloud Function or backend endpoint to trigger cache clearing.
    // e.g., await fetch('/api/superadmin/clear-cache', { method: 'POST', body: JSON.stringify({ type: cacheType }) });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Caché Limpiada",
      description: `El caché de "${cacheType}" ha sido limpiado exitosamente.`,
    });
    setIsCleaningCache(null);
  };

  const getStatusColor = (status: SystemMetric['status']) => {
    if (status === 'critical') return 'bg-red-500';
    if (status === 'warning') return 'bg-yellow-500';
    return 'bg-green-500'; // 'normal'
  };
  
  const getStatusIcon = (status: SystemMetric['status']) => {
    if (status === 'critical') return <ShieldAlert className="h-4 w-4 text-red-500" />;
    if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  };

  const OverallSystemStatus = () => {
    if (isLoading) return <Skeleton className="h-6 w-24" />;
    const hasCritical = metrics.some(m => m.status === 'critical');
    const hasWarning = metrics.some(m => m.status === 'warning');
    if (hasCritical) return <Badge variant="destructive" className="text-lg px-3 py-1"><AlertTriangle className="mr-1.5 h-4 w-4"/>Crítico</Badge>;
    if (hasWarning) return <Badge variant="outline" className="text-yellow-600 border-yellow-500 text-lg px-3 py-1"><AlertTriangle className="mr-1.5 h-4 w-4"/>Advertencia</Badge>;
    return <Badge variant="default" className="text-lg px-3 py-1 bg-green-600 hover:bg-green-600/90"><CheckCircle2 className="mr-1.5 h-4 w-4"/>Operacional</Badge>;
  }

  if (isLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-2/3 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
            <Card className="shadow-md rounded-xl">
                <CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
             <Skeleton className="h-64 w-full rounded-xl" />
        </div>
    );
  }


  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-1">
            <h1 className="text-3xl font-headline font-bold text-primary">Salud y Monitoreo del Sistema Videre</h1>
            <OverallSystemStatus />
        </div>
        <p className="text-muted-foreground">
          Estado general de los servicios, rendimiento y herramientas de mantenimiento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Estado API Principal" value="Operacional" icon={Zap} trendDirection="up" isLoading={isLoading}/>
        <KpiCard title="Base de Datos" value="Conectada" icon={Database} trendDirection="up" isLoading={isLoading}/>
        <KpiCard title="Servicios en la Nube" value="Estables" icon={Cloud} trendDirection="up" isLoading={isLoading}/>
        <KpiCard title="Tiempo Actividad (Últ. 24h)" value="100%" icon={Server} trendDirection="neutral" isLoading={isLoading}/>
      </div>

      <Card className="shadow-md rounded-xl">
        <CardHeader>
          <CardTitle>Métricas de Rendimiento en Tiempo Real</CardTitle>
          <CardDescription>Valores clave del sistema. Estos datos serían actualizados en tiempo real desde la infraestructura.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.length > 0 ? metrics.map(metric => (
            <div key={metric.name} className="p-4 border rounded-lg bg-muted/30">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-medium text-foreground">{metric.name}</h4>
                {getStatusIcon(metric.status)}
              </div>
              <p className="text-2xl font-bold text-primary">
                {metric.value.toFixed(metric.unit === '%' ? 1 : 0)} {metric.unit}
              </p>
              <Progress value={metric.name.includes('Error') ? metric.value * 10 : metric.value} indicatorClassName={getStatusColor(metric.status)} className="h-2 mt-2" />
            </div>
          )) : (
            <div className="md:col-span-2 lg:col-span-3 text-center py-10 text-muted-foreground">
              <p>No hay datos de métricas para mostrar. Conecte un servicio de monitoreo.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="shadow-md rounded-xl">
        <CardHeader>
            <CardTitle>Mantenimiento y Acciones</CardTitle>
            <CardDescription>Herramientas para la administración del sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-lg">Limpieza de Caché</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <Button 
                        variant="outline" 
                        onClick={() => handleClearCache('CDN Cache')} 
                        disabled={isCleaningCache === 'CDN Cache'}
                    >
                        {isCleaningCache === 'CDN Cache' && <RotateCw className="mr-2 h-4 w-4 animate-spin" />}
                        Limpiar Caché CDN
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={() => handleClearCache('Report Cache')}
                        disabled={isCleaningCache === 'Report Cache'}
                    >
                        {isCleaningCache === 'Report Cache' && <RotateCw className="mr-2 h-4 w-4 animate-spin" />}
                        Limpiar Caché de Reportes
                    </Button>
                    <Button 
                        variant="destructive" 
                        onClick={() => handleClearCache('Full System Cache')}
                        disabled={isCleaningCache === 'Full System Cache'}
                    >
                        {isCleaningCache === 'Full System Cache' && <RotateCw className="mr-2 h-4 w-4 animate-spin" />}
                        <Trash2 className="mr-2 h-4 w-4" /> Limpiar Todo el Caché
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-md rounded-xl">
        <CardHeader>
            <CardTitle>Gráficos de Monitoreo (Placeholder)</CardTitle>
            <CardDescription>Visualización del rendimiento a lo largo del tiempo.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px]">
            <div className="text-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 text-primary/30" />
                <p>Este es un placeholder. Aquí irían gráficos de uso de CPU, memoria, tráfico de red, etc.</p>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
