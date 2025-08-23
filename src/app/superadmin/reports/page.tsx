
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { FinancialSummaryReport } from "@/components/superadmin/financial-summary-report";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { BarChart3, TrendingUp, Users, PieChart as PieChartIcon, AlertTriangle, Layers, FileDown, Printer, DollarSign, Percent, UserMinus, TrendingDown } from "lucide-react"; 
import { Skeleton } from "@/components/ui/skeleton"; 
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react"; 
import { format, parseISO } from 'date-fns'; 
import { es } from 'date-fns/locale'; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; 
import { KpiCard } from "@/components/dashboard/kpi-card"; 
import { Badge } from "@/components/ui/badge"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function SuperAdminReportsPage() {
  const { toast } = useToast(); 
  const [isLoadingPlaceholders, setIsLoadingPlaceholders] = useState(true); 
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [isLoadingFinancials, setIsLoadingFinancials] = useState(true); 

  useEffect(() => {
    // Simulating loading delays for different sections
    const timerPlaceholders = setTimeout(() => setIsLoadingPlaceholders(false), 1200);
    const timerInventory = setTimeout(() => setIsLoadingInventory(false), 900);
    const timerFinancials = setTimeout(() => setIsLoadingFinancials(false), 1000);
    return () => {
      clearTimeout(timerPlaceholders);
      clearTimeout(timerInventory);
      clearTimeout(timerFinancials);
    };
  }, []);

  const handleGenericExportCsv = (reportName: string) => {
    console.log(`Simulating CSV export for ${reportName}`);
    toast({
      title: "Exportación CSV Iniciada",
      description: `Se está generando el archivo ${reportName}.csv.`,
    });
  };
  
  const handleGenericExportPdf = (reportName: string) => {
    console.log(`Simulating PDF export for ${reportName}`);
    toast({
      title: "Generando PDF",
      description: `Se está generando un PDF para el reporte "${reportName}".`,
    });
  };

  const handleGenericPrint = (reportName: string) => {
    toast({
      title: `Imprimiendo Reporte`,
      description: `Se preparará el reporte "${reportName}" para impresión.`,
    });
  };

  const formatCurrencyCRC = (value: number) => 
    `¢${new Intl.NumberFormat('es-CR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
  
  const formatCurrencyUSD = (value: number) =>
    `$${new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;

  const formatDateSafe = (dateString?: string, dateFormat: string = 'dd MMM, yyyy') => {
    if (!dateString) return 'N/A';
    try { return format(parseISO(dateString), dateFormat, { locale: es }); }
    catch { return 'Fecha Inválida'; }
  };
  
  const totalInventoryValueCRC = 0;


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <BarChart3 className="h-7 w-7" /> Centro de Reportes Globales (SuperAdmin)
        </h1>
        <p className="text-muted-foreground">
          Analiza el rendimiento general de la plataforma Videre, el crecimiento de clínicas y las finanzas.
        </p>
      </div>
      
      <Tabs defaultValue="main_summary" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-4 h-auto">
          <TabsTrigger value="main_summary">Resumen Principal</TabsTrigger>
          <TabsTrigger value="growth_plans">Crecimiento y Planes</TabsTrigger>
          <TabsTrigger value="platform_financials">Finanzas Plataforma (USD)</TabsTrigger>
        </TabsList>

        <TabsContent value="main_summary">
            {/* FinancialSummaryReport will show platform revenue in USD */}
            <FinancialSummaryReport /> 
            <Card className="shadow-md rounded-xl col-span-1 lg:col-span-2 mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl"><Layers className="h-5 w-5 text-primary"/>Valoración Global de Inventario (Costo, CRC)</CardTitle>
                    <CardDescription>Resumen del valor del inventario total de todas las clínicas (basado en costo, en colones).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <KpiCard title="Valor Total del Inventario (Costo)" value={formatCurrencyCRC(totalInventoryValueCRC)} icon={DollarSign} description="Suma del valor de costo de todo el stock de la plataforma." isLoading={isLoadingInventory} />
                    {isLoadingInventory ? <Skeleton className="h-[200px] w-full" /> : (
                         <div className="text-center py-10 text-muted-foreground">
                                No hay datos de inventario para mostrar.
                            </div>
                    )}
                </CardContent>
                <CardFooter className="border-t pt-6 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => handleGenericExportCsv("Inventario_Global_SA_CRC")}>
                    <FileDown className="mr-2 h-4 w-4" /> Exportar CSV
                    </Button>
                    <Button variant="outline" onClick={() => handleGenericExportPdf("Inventario_Global_SA_CRC")}>
                    <FileDown className="mr-2 h-4 w-4" /> Guardar PDF
                    </Button>
                    <Button variant="outline" onClick={() => handleGenericPrint("Inventario Global CRC")}>
                    <Printer className="mr-2 h-4 w-4" /> Imprimir
                    </Button>
                </CardFooter>
            </Card>
        </TabsContent>

        <TabsContent value="growth_plans">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-md rounded-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl"><TrendingUp className="h-5 w-5 text-primary"/>Crecimiento de Clínicas</CardTitle>
                        <CardDescription>Nuevas clínicas registradas mensualmente.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingPlaceholders ? <Skeleton className="h-[300px] w-full" /> : (
                        <div className="h-[300px]">
                            <p className="text-muted-foreground text-center pt-10 flex flex-col items-center">
                                <TrendingUp className="h-12 w-12 mb-2 text-primary/30"/>
                                No hay datos de crecimiento para mostrar.
                            </p>
                        </div>
                        )}
                    </CardContent>
                    <CardFooter className="border-t pt-6 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => handleGenericExportCsv("Crecimiento_Clinicas_SA")}>
                        <FileDown className="mr-2 h-4 w-4" /> Exportar CSV
                        </Button>
                        <Button variant="outline" onClick={() => handleGenericExportPdf("Crecimiento_Clinicas_SA")}>
                        <FileDown className="mr-2 h-4 w-4" /> Guardar PDF
                        </Button>
                        <Button variant="outline" onClick={() => handleGenericPrint("Crecimiento de Clínicas")}>
                        <Printer className="mr-2 h-4 w-4" /> Imprimir
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="shadow-md rounded-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl"><Layers className="h-5 w-5 text-primary"/>Distribución de Planes</CardTitle>
                        <CardDescription>Porcentaje de clínicas por tipo de plan de suscripción.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingPlaceholders ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : (
                            <div className="h-[300px] flex items-center justify-center">
                                <p className="text-muted-foreground text-center pt-10 flex flex-col items-center">
                                    <PieChartIcon className="h-12 w-12 mb-2 text-primary/30"/>
                                    No hay datos de planes para mostrar.
                                </p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="border-t pt-6 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => handleGenericExportCsv("Distribucion_Planes_SA")}>
                        <FileDown className="mr-2 h-4 w-4" /> Exportar CSV
                        </Button>
                        <Button variant="outline" onClick={() => handleGenericExportPdf("Distribucion_Planes_SA")}>
                        <FileDown className="mr-2 h-4 w-4" /> Guardar PDF
                        </Button>
                        <Button variant="outline" onClick={() => handleGenericPrint("Distribución de Planes")}>
                        <Printer className="mr-2 h-4 w-4" /> Imprimir
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </TabsContent>
        
        <TabsContent value="platform_financials">
            <Card className="shadow-md rounded-xl">
                <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <DollarSign className="h-5 w-5 text-primary" /> Métricas Financieras de la Plataforma (USD)
                </CardTitle>
                <CardDescription>
                    KPIs clave sobre la salud financiera y el rendimiento de Videre como negocio (en Dólares Americanos).
                </CardDescription>
                </CardHeader>
                <CardContent>
                {isLoadingFinancials ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard
                        title="MRR Total (USD)"
                        value={formatCurrencyUSD(0)} 
                        icon={DollarSign}
                        description="Ingreso Mensual Recurrente de todas las suscripciones."
                    />
                    <KpiCard
                        title="ARPU (USD)"
                        value={formatCurrencyUSD(0)} 
                        icon={Users}
                        description="Ingreso Promedio por Clínica Activa."
                    />
                    <KpiCard
                        title="Tasa de Abandono (Churn Mensual)"
                        value="0.0%"
                        icon={UserMinus}
                        description="Porcentaje de clínicas que cancelaron este mes."
                    />
                    <KpiCard
                        title="Costo Adquisición Cliente (CAC - USD)"
                        value={formatCurrencyUSD(0)}
                        icon={TrendingDown} 
                        description="Costo promedio para adquirir una nueva clínica."
                    />
                    </div>
                )}
                </CardContent>
                <CardFooter className="border-t pt-6 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => handleGenericExportCsv("Metricas_Financieras_Plataforma_USD")} disabled={isLoadingFinancials}>
                    <FileDown className="mr-2 h-4 w-4" /> Exportar CSV
                    </Button>
                    <Button variant="outline" onClick={() => handleGenericExportPdf("Metricas_Financieras_Plataforma_USD")} disabled={isLoadingFinancials}>
                    <FileDown className="mr-2 h-4 w-4" /> Guardar PDF
                    </Button>
                    <Button variant="outline" onClick={() => handleGenericPrint("Métricas Financieras Plataforma USD")} disabled={isLoadingFinancials}>
                    <Printer className="mr-2 h-4 w-4" /> Imprimir
                    </Button>
                </CardFooter>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
