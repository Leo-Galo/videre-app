
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, Percent, AlertCircle, FileDown, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { VidereSubscription } from '@/types/superadmin'; 
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getSubscriptions } from '@/services/superadmin/subscription-service'; // Import the service

// Mock data for costs
const mockMonthlyFinancialDataUSD: { month: string; costs: number; }[] = [];

export function FinancialSummaryReport() {
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<VidereSubscription[]>([]);
  const { toast } = useToast();
  
  const estimatedCostsUSD = mockMonthlyFinancialDataUSD.reduce((sum, d) => sum + d.costs, 0);

  useEffect(() => {
    async function loadData() {
        setIsLoading(true);
        const subs = await getSubscriptions();
        setSubscriptions(subs);
        setIsLoading(false);
    }
    loadData();
  }, []);

  const totalRevenueUSD = useMemo(() => {
    return subscriptions
      .filter(sub => sub.status === 'Active' && sub.currency === 'USD') 
      .reduce((sum, sub) => sub.billingCycle === 'Annually' ? sum + (sub.amount / 12) : sum + sub.amount, 0);
  }, [subscriptions]);

  const grossMarginUSD = totalRevenueUSD - estimatedCostsUSD;
  const marginPercentage = totalRevenueUSD > 0 ? (grossMarginUSD / totalRevenueUSD) * 100 : 0;

  const formatCurrencyUSD = (value: number) => 
    `$${new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
  
  // Create chart data based on real revenue and mock costs
  const chartData = useMemo(() => {
    const revenueData = { month: 'Actual', revenue: totalRevenueUSD, costs: estimatedCostsUSD };
    return [revenueData].map(d => ({
        ...d,
        margin: d.revenue - d.costs,
    }));
  }, [totalRevenueUSD, estimatedCostsUSD]);

  const handleExportCsv = () => {
    toast({
      title: "Exportación CSV Iniciada",
      description: "Se generará el archivo `Resumen_Financiero_Plataforma_USD.csv`.",
    });
  };

  const handleExportPdf = () => {
    toast({
        title: "Generando PDF",
        description: "Se generará un PDF con el resumen financiero en USD.",
    });
  };

  const handlePrintReport = () => {
    toast({
      title: `Imprimiendo Reporte`,
      description: "Se preparará el resumen financiero en USD para impresión.",
    });
  };


  if (isLoading) {
    return (
      <Card className="shadow-md rounded-xl col-span-1 lg:col-span-2">
        <CardHeader>
            <Skeleton className="h-7 w-3/4 mb-1" />
            <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_,i) => <Skeleton key={i} className="h-24 rounded-lg"/>)}
            </div>
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-64 w-full" />
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-end gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-28" />
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-md rounded-xl col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <DollarSign className="h-6 w-6 text-primary" />
          Resumen Financiero de la Plataforma (Mensual, en USD)
        </CardTitle>
        <CardDescription>
          Ingresos por suscripciones (MRR) vs. costos operativos estimados (USD).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg bg-background">
            <Label className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3"/>Ingresos (MRR - USD)</Label>
            <p className="text-2xl font-bold text-green-600">{formatCurrencyUSD(totalRevenueUSD)}</p>
          </div>
          <div className="p-4 border rounded-lg bg-background">
            <Label className="text-xs text-muted-foreground">Costos Operativos Estimados (USD)</Label>
            <p className="text-2xl font-bold text-red-600">{formatCurrencyUSD(estimatedCostsUSD)}</p>
          </div>
          <div className="p-4 border rounded-lg bg-background">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              {grossMarginUSD >= 0 ? <TrendingUp className="h-3 w-3"/> : <TrendingDown className="h-3 w-3"/>}
              Margen Bruto (USD)
            </Label>
            <p className={`text-2xl font-bold ${grossMarginUSD >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatCurrencyUSD(grossMarginUSD)}
            </p>
          </div>
          <div className="p-4 border rounded-lg bg-background">
            <Label className="text-xs text-muted-foreground flex items-center gap-1"><Percent className="h-3 w-3"/>% Margen Bruto</Label>
            <p className={`text-2xl font-bold ${marginPercentage >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {marginPercentage.toFixed(1)}%
            </p>
          </div>
        </div>
        
        <div>
          <h4 className="text-md font-semibold mb-2 mt-4">Evolución Mensual (Datos de Ejemplo, en USD)</h4>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip
                    formatter={(value, name) => [formatCurrencyUSD(value as number), name === 'revenue' ? 'Ingresos' : name === 'costs' ? 'Costos' : 'Margen']}
                    labelStyle={{ fontWeight: 'bold' }}
                    wrapperClassName="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-sm"
                />
                <Legend formatter={(value) => value === 'revenue' ? 'Ingresos' : value === 'costs' ? 'Costos' : 'Margen'}/>
                <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Ingresos" />
                <Bar dataKey="costs" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Costos"/>
                <Bar dataKey="margin" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Margen"/>
                </BarChart>
            </ResponsiveContainer>
            ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No hay datos de evolución para mostrar.
                </div>
            )}
        </div>
        <div className="text-xs text-muted-foreground">
            <AlertCircle className="inline h-3 w-3 mr-1"/>
            Los ingresos se calculan sumando los montos de suscripciones mensuales activas en USD. Los costos son un valor fijo de ejemplo.
        </div>
      </CardContent>
      <CardFooter className="border-t pt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={handleExportCsv}>
          <FileDown className="mr-2 h-4 w-4" /> Exportar CSV
        </Button>
        <Button variant="outline" onClick={handleExportPdf}>
          <FileDown className="mr-2 h-4 w-4" /> Guardar PDF
        </Button>
        <Button variant="outline" onClick={handlePrintReport}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir Reporte
        </Button>
      </CardFooter>
    </Card>
  );
}
