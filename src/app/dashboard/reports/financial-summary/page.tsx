
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Percent, ArrowLeft, Printer, FileDown, Sparkles, AlertCircle, PiggyBank } from 'lucide-react';
import { format, getYear, getMonth, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { KpiCard } from '@/components/dashboard/kpi-card';
import type { Order } from '@/types/pos';
import type { Expense, ExpenseCategory } from '@/types/finance';
import { expenseCategories } from '@/types/finance'; // Import categories
import { getBudget } from '@/services/budget-service';
import { getExpenses } from '@/services/expense-service'; // To get actual expenses
import { getOrders } from '@/services/order-service';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// Mock data simulation - Now empty, will be fetched.
const mockMonthlySales: Order[] = [];

const currentYear = getYear(new Date());
const years = Array.from({length: 5}, (_, i) => (currentYear - i).toString());
const months = Array.from({length: 12}, (_, i) => ({ value: i.toString(), label: format(new Date(0, i), 'MMMM', {locale: es})}));

type BudgetData = Record<ExpenseCategory, number>;

export default function FinancialSummaryPage() {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState<string>(getMonth(new Date()).toString());
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  
  // Budget state
  const [budgetData, setBudgetData] = useState<Partial<BudgetData>>({});

  useEffect(() => {
    setIsLoading(true);
    const plan = localStorage.getItem('subscriptionPlan');
    const isPremium = plan?.toLowerCase() === 'premium';
    setIsPremiumUser(isPremium);

    if (!isPremium) {
        setIsLoading(false);
        return;
    }
    
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);

    async function loadData() {
        const monthStart = startOfMonth(new Date(year, month));
        const monthEnd = endOfMonth(monthStart);

        // Fetch all data in parallel
        const [salesForMonth, expensesForMonth, storedBudget] = await Promise.all([
             getOrders().then(orders => orders.filter(order => order.status === 'completed' && isWithinInterval(parseISO(order.createdAt), { start: monthStart, end: monthEnd }))),
             getExpenses(),
             getBudget(year, month),
        ]);
        
        const filteredExpenses = expensesForMonth.filter(expense => 
            isWithinInterval(parseISO(expense.date), { start: monthStart, end: monthEnd })
        );

        setBudgetData(storedBudget || {});

        const totalRevenue = salesForMonth.reduce((sum, order) => sum + order.totalCRC, 0);
        const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const profit = totalRevenue - totalExpenses;
        const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
        
        const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {} as Record<string, number>);

        const topExpenses = Object.entries(expensesByCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value)
        .slice(0, 5);

        setReportData({
            totalRevenue,
            totalExpenses,
            profit,
            margin,
            chartData: [{ name: format(monthStart, 'MMMM', {locale: es}), ingresos: totalRevenue, gastos: totalExpenses, utilidad: profit }],
            topExpenses,
            actualExpensesByCategory: expensesByCategory,
        });
        setIsLoading(false);
    }
    
    loadData();

  }, [selectedMonth, selectedYear]);
  
  const comparisonData = useMemo(() => {
    if (!reportData) return [];
    return expenseCategories.map(category => {
        const budgeted = budgetData[category] || 0;
        const actual = reportData.actualExpensesByCategory[category] || 0;
        const variance = budgeted - actual;
        return { category, budgeted, actual, variance };
    }).filter(item => item.budgeted > 0 || item.actual > 0);
  }, [reportData, budgetData]);


  const formatCurrency = (amount: number) => `¢${new Intl.NumberFormat('es-CR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
  const handlePrint = () => toast({ title: "Imprimir Reporte (Simulado)" });
  const handleExportCsv = () => toast({ title: "Exportar CSV (Simulado)" });
  const handleExportPdf = () => toast({ title: "Exportar PDF (Simulado)" });

  if (isLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg"/>)}</div>
            <div className="grid gap-6 md:grid-cols-2"><Skeleton className="h-80 rounded-lg"/><Skeleton className="h-80 rounded-lg"/></div>
        </div>
    );
  }

  if (!isPremiumUser) {
    return (
      <Card className="shadow-lg rounded-xl border-dashed border-primary/50 bg-primary/5">
        <CardHeader className="text-center">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-3" />
          <CardTitle className="text-2xl">Resumen Financiero y Presupuestos</CardTitle>
          <CardDescription className="text-lg">Esta es una funcionalidad Premium.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            Obtén una visión clara de la rentabilidad de tu óptica, define presupuestos mensuales y compara tus gastos reales para tomar decisiones financieras informadas.
          </p>
          <Button asChild size="lg"><Link href="/dashboard/subscription">Actualizar a Premium</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <TrendingUp className="h-7 w-7" /> Resumen Financiero y Presupuestos
        </h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard/reports">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Centro de Reportes
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg rounded-xl">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <CardTitle>Análisis de Rentabilidad y Presupuesto</CardTitle>
                <CardDescription>Selecciona un período para analizar ingresos, gastos y comparar con tu presupuesto.</CardDescription>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
            </div>
        </CardHeader>
        
        {reportData && (
          <>
          <CardContent className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard title="Ingresos Totales (¢)" value={formatCurrency(reportData.totalRevenue)} icon={DollarSign} />
              <KpiCard title="Gastos Totales (¢)" value={formatCurrency(reportData.totalExpenses)} icon={TrendingDown} />
              <KpiCard title="Utilidad Bruta (¢)" value={formatCurrency(reportData.profit)} icon={reportData.profit >= 0 ? TrendingUp : TrendingDown} trendDirection={reportData.profit >= 0 ? "up" : "down"}/>
              <KpiCard title="% Margen Bruto" value={`${reportData.margin.toFixed(1)}%`} icon={Percent} />
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Análisis Presupuesto vs. Real</CardTitle>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/dashboard/settings/budget"><PiggyBank className="mr-2 h-4 w-4"/>Gestionar Presupuesto</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comparisonData} margin={{left: 20}}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="category" angle={-15} textAnchor="end" height={60} tick={{fontSize: 10}}/>
                                <YAxis tickFormatter={(value) => formatCurrency(value).replace('¢','').replace(',00','')}/>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                                <Bar dataKey="budgeted" name="Presupuestado" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="actual" name="Real" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader><TableRow><TableHead>Categoría</TableHead><TableHead className="text-right">Presupuestado (¢)</TableHead><TableHead className="text-right">Gasto Real (¢)</TableHead><TableHead className="text-right">Varianza (¢)</TableHead><TableHead className="text-right">% Varianza</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {comparisonData.map(item => (
                                    <TableRow key={item.category}>
                                        <TableCell>{item.category}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.budgeted)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.actual)}</TableCell>
                                        <TableCell className={cn("text-right font-semibold", item.variance < 0 ? 'text-destructive' : 'text-green-600')}>
                                            {formatCurrency(item.variance)}
                                        </TableCell>
                                        <TableCell className={cn("text-right font-semibold", item.variance < 0 ? 'text-destructive' : 'text-green-600')}>
                                            {item.budgeted > 0 ? `${((item.variance / item.budgeted) * 100).toFixed(1)}%` : 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

          </CardContent>
          <CardFooter className="border-t pt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={handleExportCsv}><FileDown className="mr-2 h-4 w-4"/>Exportar CSV</Button>
              <Button variant="outline" onClick={handleExportPdf}><FileDown className="mr-2 h-4 w-4"/>Guardar PDF</Button>
              <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Imprimir</Button>
          </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
