
"use client";

import type { NextPage } from 'next';
import { useState, useEffect } from 'react'; // Added useEffect
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, FileDown, TrendingUp, DollarSign, Wallet, Sparkles } from 'lucide-react'; // Added Sparkles
import * as z from 'zod';
import * as reportService from '@/services/report-service';
import { useToast } from '@/hooks/use-toast';
import { GenerateReportDialog } from '@/components/dashboard/reports/generate-report-dialog';
import { ReportPreviewModal } from '@/components/dashboard/reports/report-preview-modal';
import { generateReportSchema, reportGroups } from '@/types/report-schema';
import { formatCurrencyCRC, formatDateSafe, calculateMargin } from '@/lib/utils';
import { getReports } from 'recharts/types/util/ChartUtils';
import { Badge } from '@/components/ui/badge'; // Added Badge

// Mock data for mini charts - in a real app, this would be fetched
const mockDailySales = { today: 0, yesterday: 0 };
const mockMonthlySalesTrend: any[] = [];
const mockMonthlyProfit = { revenue: 0, expenses: 0 };

const ReportsPage: NextPage = () => {
  const { toast } = useToast();
  const [isGenerateReportDialogOpen, setIsGenerateReportDialogOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewColumns, setPreviewColumns] = useState<any[]>([]);
  const [previewTitle, setPreviewTitle] = useState("");
  const [currentPlan, setCurrentPlan] = useState<string | null>(null); // Added state for plan

  useEffect(() => {
    const plan = localStorage.getItem('subscriptionPlan');
    setCurrentPlan(plan ? plan.toLowerCase() : 'basic');
  }, []);

  const isPremiumUser = currentPlan === 'premium';

  async function onGenerateReportSubmit(values: z.infer<typeof generateReportSchema>) {
    setIsGeneratingReport(true);
    setIsGenerateReportDialogOpen(false); 
    
    const reportTypeDefinition = reportGroups.flatMap(g => g.reports).find(rt => rt.value === values.reportType);
    const title = reportTypeDefinition ? reportTypeDefinition.label : "Reporte Personalizado";

    if (reportTypeDefinition) {
        const requiredPlanLabel = reportTypeDefinition.plan;
        if (requiredPlanLabel) {
            const planHierarchy = { basic: 1, pro: 2, premium: 3 };
            const userPlanLevel = planHierarchy[currentPlan as keyof typeof planHierarchy || 'basic'];
            const requiredLevel = planHierarchy[requiredPlanLabel.toLowerCase() as keyof typeof planHierarchy];

            if (userPlanLevel < requiredLevel) {
                toast({
                    variant: 'default',
                    className: 'bg-yellow-400/80 border-yellow-500 text-yellow-900',
                    title: `Funcionalidad ${requiredPlanLabel} Requerida`,
                    description: `Para generar el reporte "${title}", necesitas el plan ${requiredPlanLabel} o superior.`,
                    action: <Button asChild size="sm"><Link href="/dashboard/subscription">Actualizar Plan</Link></Button>
                });
                setIsGeneratingReport(false);
                return;
            }
        }
    }
    
    toast({ title: "Generando Reporte...", description: "Por favor espera mientras procesamos tu solicitud." });
    
    await new Promise(resolve => setTimeout(resolve, 500)); 

    let data: any[] = [];
    let columns: any[] = [];
    
    try {
        switch(values.reportType) {
            case 'detailed_sales':
                data = await reportService.getDetailedSalesReport(values); 
                columns = [ { key: 'id', label: 'ID Factura' }, { key: 'date', label: 'Fecha', format: (d: string) => formatDateSafe(d) }, { key: 'customer', label: 'Cliente' }, { key: 'asesor', label: 'Asesor' }, { key: 'total', label: 'Total (CRC)', format: (v: number) => formatCurrencyCRC(v) }, ];
                break;
            case 'sales_by_salesperson':
                data = await reportService.getSalesBySalespersonReport(values);
                columns = [ { key: 'name', label: 'Asesor' }, { key: 'totalSalesCRC', label: 'Ventas Totales (CRC)', format: (v: number) => formatCurrencyCRC(v) }, { key: 'numTransactions', label: 'Nº Transacciones' }, ];
                break;
            case 'inventory_summary':
                data = await reportService.getInventorySummaryReport(values);
                columns = [ { key: 'sku', label: 'SKU' }, { key: 'name', label: 'Nombre Producto' }, { key: 'stock', label: 'Stock' }, { key: 'value', label: 'Valor Stock (CRC)', format: (v: number) => formatCurrencyCRC(v) }, ];
                break;
            case 'inventory_pricing':
                data = await reportService.getInventoryPricingReport(values);
                columns = [ { key: 'sku', label: 'SKU' }, { key: 'name', label: 'Producto' }, { key: 'costPrice', label: 'Costo (CRC)', format: (v: number) => formatCurrencyCRC(v) }, { key: 'sellingPrice', label: 'Venta (CRC)', format: (v: number) => formatCurrencyCRC(v) }, { key: 'margin', label: 'Margen', format: (_: any, row: any) => calculateMargin(row.costPrice, row.sellingPrice)}, ];
                break;
            case 'patient_list':
                data = await reportService.getPatientListReport(values);
                columns = [ { key: 'firstName', label: 'Nombre' }, { key: 'lastName', label: 'Apellido' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Teléfono' }, { key: 'registrationDate', label: 'Registro', format: (d: string) => formatDateSafe(d) }, ];
                break;
            case 'patient_prescriptions':
                data = await reportService.getPrescriptionReport(values);
                columns = [ { key: 'patientName', label: 'Paciente' }, { key: 'date', label: 'Fecha', format: (d: string) => formatDateSafe(d, 'dd/MM/yyyy') }, { key: 'lensType', label: 'Tipo Lente' }, { key: 'optometristName', label: 'Optómetra' }, ];
                break;
            case 'patient_visit_frequency':
                data = await reportService.getPatientVisitFrequencyReport(values);
                columns = [ { key: 'patientName', label: 'Paciente' }, { key: 'lastVisitDate', label: 'Últ. Visita', format: (d: string) => formatDateSafe(d) }, { key: 'totalVisitsLastYear', label: 'Visitas (Últ. Año)' }, { key: 'nextRecommendedVisitDate', label: 'Próx. Rec.', format: (d: string) => formatDateSafe(d)}, ];
                break;
            case 'popular_products':
                data = await reportService.getTopProductsReport(values);
                columns = [ { key: 'name', label: 'Producto/Servicio' }, { key: 'category', label: 'Categoría' }, { key: 'quantitySold', label: 'Cant. Vendida' }, { key: 'uniqueCustomers', label: 'Clientes Únicos' }, ];
                break;
            case 'marketing_birthdays':
                data = await reportService.getBirthdayReport(values); 
                columns = [ { key: 'firstName', label: 'Nombre' }, { key: 'lastName', label: 'Apellido' }, { key: 'dateOfBirth', label: 'Fecha Nacimiento', format: (d: string) => formatDateSafe(d, 'dd MMMM') }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Teléfono' }, ];
                break;
            case 'marketing_follow_ups':
                data = await reportService.getFollowUpReport(values);
                columns = [ { key: 'firstName', label: 'Nombre' }, { key: 'lastName', label: 'Apellido' }, { key: 'overallNextRecommendedVisitDate', label: 'Fecha Seguimiento', format: (d: string) => formatDateSafe(d) }, { key: 'overallReasonForNextVisit', label: 'Motivo' }, { key: 'phone', label: 'Teléfono' }, ];
                break;
            case 'financial_expenses':
                data = await reportService.getFinancialExpensesReport(values);
                columns = [ { key: 'date', label: 'Fecha', format: (d:string) => formatDateSafe(d)}, { key: 'description', label: 'Descripción' }, { key: 'category', label: 'Categoría' }, { key: 'amount', label: 'Monto (CRC)', format: (v: number) => formatCurrencyCRC(v) }, ];
                break;
            case 'supplier_purchases':
                data = await reportService.getPurchasesBySupplierReport(values);
                columns = [ { key: 'supplierName', label: 'Proveedor' }, { key: 'receiptCount', label: 'Nº Ingresos' }, { key: 'totalCost', label: 'Costo Total (CRC)', format: (v:number) => formatCurrencyCRC(v)}, ];
                break;
            case 'monthly_goal_compliance':
                data = await reportService.getMonthlyGoalComplianceReport(values);
                columns = [
                    { key: 'period', label: 'Periodo' },
                    { key: 'salesperson', label: 'Vendedor/General' },
                    { key: 'goal', label: 'Meta (CRC)', format: (v: number) => formatCurrencyCRC(v) },
                    { key: 'actual', label: 'Venta Real (CRC)', format: (v: number) => formatCurrencyCRC(v) },
                    { key: 'compliance', label: '% Cumplimiento', format: (_: any, row: any) => {
                        if (!row.goal || row.goal === 0) return 'N/A';
                        const compliance = (row.actual / row.goal) * 100;
                        return `${compliance.toFixed(1)}%`;
                    }},
                ];
                break;
            default: 
                data = [];
                columns = [{key: 'info', label: 'Info'}];
                toast({ variant: "destructive", title: "Tipo de Reporte no Implementado", description: "La lógica para este tipo de reporte aún no ha sido creada." });
                break;
        }

        setPreviewData(data);
        setPreviewColumns(columns);
        setPreviewTitle(title);
        setIsPreviewOpen(true);
    } catch (error) {
        console.error("Error generating report:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo generar el reporte." });
    } finally {
        setIsGeneratingReport(false);
    }
  }

  const dailySalesTrend = ((mockDailySales.today - mockDailySales.yesterday) / (mockDailySales.yesterday || 1)) * 100;
  const monthlyProfit = mockMonthlyProfit.revenue - mockMonthlyProfit.expenses;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Centro de Reportes</h1>
          <p className="text-muted-foreground">Genera reportes personalizados para analizar el rendimiento de tu óptica.</p>
        </div>
        <Button onClick={() => setIsGenerateReportDialogOpen(true)} size="lg">
          <FileDown className="mr-2 h-5 w-5" /> Generar Reporte Personalizado
        </Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Reportes Principales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Resumen Diario</CardTitle>
              <CardDescription>Ventas y actividad de hoy.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-3xl font-bold">{formatCurrencyCRC(mockDailySales.today)}</p>
              <p className={`text-sm ${dailySalesTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {dailySalesTrend >= 0 ? '+' : ''}{dailySalesTrend.toFixed(1)}% vs ayer
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" asChild>
                 <Link href="/dashboard/reports/daily-summary">Ver Reporte Completo</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Resumen Mensual</CardTitle>
              <CardDescription>Tendencia de ventas semanales del mes.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={mockMonthlySalesTrend} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `¢${value/1000}k`}/>
                  <Tooltip
                    cursor={{fill: 'transparent'}}
                    formatter={(value: number) => [formatCurrencyCRC(value), "Ventas"]}
                    labelStyle={{fontSize: '12px'}}
                    contentStyle={{fontSize: '12px', padding: '4px 8px', borderRadius: 'var(--radius)'}}
                  />
                  <Bar dataKey="sales" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
            <CardFooter>
               <Button variant="outline" size="sm" asChild>
                 <Link href="/dashboard/reports/monthly-summary">Ver Reporte Completo</Link>
              </Button>
            </CardFooter>
          </Card>

           <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl flex flex-col">
              <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Resumen Financiero</span>
                    {!isPremiumUser && (
                        <Badge variant="secondary" className="bg-yellow-400/80 text-yellow-900 hover:bg-yellow-400 text-xs">
                            <Sparkles className="mr-1 h-3 w-3" />
                            Premium
                        </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Rentabilidad y comparación con presupuesto del mes actual.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                  <p className="text-3xl font-bold text-primary">{formatCurrencyCRC(monthlyProfit)}</p>
                  <p className="text-sm text-muted-foreground">Utilidad Bruta (Ingresos - Gastos)</p>
              </CardContent>
              <CardFooter>
                  <Button variant="outline" size="sm" asChild>
                     <Link href={isPremiumUser ? "/dashboard/reports/financial-summary" : "/dashboard/subscription"}>
                        {isPremiumUser ? 'Ver Reporte Completo' : 'Actualizar a Premium'}
                     </Link>
                  </Button>
              </CardFooter>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Otros Reportes</h2>
        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle>Reportes Personalizados</CardTitle>
            <CardDescription>Utiliza el generador para crear reportes a la medida con filtros específicos.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="w-full justify-start text-base h-auto py-3" onClick={() => onGenerateReportSubmit({reportType: 'inventory_summary', startDate: new Date(), endDate: new Date()})}>
              Valoración de Inventario
            </Button>
            <Button variant="outline" className="w-full justify-start text-base h-auto py-3" onClick={() => onGenerateReportSubmit({reportType: 'sales_by_salesperson', startDate: new Date(), endDate: new Date()})}>
              Ranking de Ventas por Asesor
            </Button>
            <Button variant="outline" className="w-full justify-start text-base h-auto py-3" onClick={() => onGenerateReportSubmit({reportType: 'monthly_goal_compliance', startDate: new Date(), endDate: new Date()})}>
              <TrendingUp className="mr-2 h-4 w-4 text-green-600"/> Cumplimiento de Meta Mensual
            </Button>
             <Button variant="outline" className="w-full justify-start text-base h-auto py-3" asChild>
                <Link href="/dashboard/reports/petty-cash-summary">
                    <Wallet className="mr-2 h-4 w-4 text-indigo-500" /> Liquidaciones de Caja Chica
                </Link>
            </Button>
            <Button variant="default" className="w-full justify-start text-base h-auto py-3 bg-primary/90" onClick={() => setIsGenerateReportDialogOpen(true)}>
              <FileDown className="mr-2 h-4 w-4"/> Ver más reportes...
            </Button>
          </CardContent>
        </Card>
      </div>

      <GenerateReportDialog
        isOpen={isGenerateReportDialogOpen}
        onOpenChange={setIsGenerateReportDialogOpen}
        onSubmit={onGenerateReportSubmit}
        isGenerating={isGeneratingReport}
        currentPlan={currentPlan}
      />
      <ReportPreviewModal
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        title={previewTitle}
        data={previewData}
        columns={previewColumns}
      />
    </div>
  );
};

export default ReportsPage;
