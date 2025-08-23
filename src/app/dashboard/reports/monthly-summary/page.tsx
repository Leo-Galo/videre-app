
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { CalendarIcon, Printer, FileDown, DollarSign, ShoppingCart, Users, TrendingUp, BarChart3, ArrowLeft } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, subDays, getDaysInMonth, getYear, getMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { Order, OrderItem } from '@/types/pos'; 
import type { Patient } from '@/types/patient';
import { KpiCard } from '@/components/dashboard/kpi-card';
import Link from 'next/link';
import { getOrders } from '@/services/order-service';
import { getPatients } from '@/services/patient-service';


// Mock data is now empty. Data will be fetched from services.
const mockSalesHistoryOrders: Order[] = [];
const mockPatients: Patient[] = [];


const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F', '#FFBB28', '#FF8042'];

const currentYear = getYear(new Date());
const years = Array.from({length: 5}, (_, i) => (currentYear - i).toString());
const months = Array.from({length: 12}, (_, i) => ({ value: i.toString(), label: format(new Date(0, i), 'MMMM', {locale: es})}));


export default function MonthlySummaryPage() {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState<string>(getMonth(new Date()).toString());
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);

  useEffect(() => {
    async function loadData() {
        setIsLoading(true);
        const [orders, patients] = await Promise.all([getOrders(), getPatients()]);
        setAllOrders(orders);
        setAllPatients(patients);
        setIsLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (isLoading) return; // Wait for initial data load

    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    const monthStart = startOfMonth(new Date(year, month));
    const monthEnd = endOfMonth(monthStart);

    const salesForMonth = allOrders.filter(order => 
        order.status === 'completed' && isWithinInterval(parseISO(order.createdAt), { start: monthStart, end: monthEnd })
    );
    const newPatientsForMonth = allPatients.filter(patient => 
        isWithinInterval(parseISO(patient.registrationDate), { start: monthStart, end: monthEnd })
    );

    const salesByDayOfMonth = Array.from({length: getDaysInMonth(monthStart)}, (_, i) => ({
        day: (i + 1).toString(),
        sales: 0,
    }));
    salesForMonth.forEach(order => {
        const day = parseISO(order.createdAt).getDate();
        salesByDayOfMonth[day-1].sales += order.totalCRC;
    });
    
    const salesByPaymentMethod = salesForMonth.reduce((acc, order) => {
      const payment = order.payments[0] || { method: 'desconocido' };
      const methodName = payment.method === 'card' ? 'Tarjeta' : payment.method === 'cash' ? 'Efectivo' : payment.method === 'sinpe' ? 'SINPE' : payment.method === 'transfer' ? 'Transfer.' : 'Otro';
      acc[methodName] = (acc[methodName] || 0) + order.totalCRC;
      return acc;
    }, {} as Record<string, number>);
    
    const salesByCategory = salesForMonth.flatMap(o => o.items).reduce((acc, item) => {
        const category = item.product.category || 'Sin Categoría';
        acc[category] = (acc[category] || 0) + item.subtotal;
        return acc;
    }, {} as Record<string, number>);


    setMonthlyData({
      totalSales: salesForMonth.reduce((sum, order) => sum + order.totalCRC, 0),
      transactionCount: salesForMonth.length,
      averageTicket: salesForMonth.length > 0 ? salesForMonth.reduce((sum, order) => sum + order.totalCRC, 0) / salesForMonth.length : 0,
      newPatients: newPatientsForMonth.length,
      salesTrend: salesByDayOfMonth,
      salesByPaymentMethod: Object.entries(salesByPaymentMethod).map(([name, value]) => ({ name, value })),
      salesByCategory: Object.entries(salesByCategory).map(([name, value]) => ({ name, value })),
    });
  }, [selectedMonth, selectedYear, allOrders, allPatients, isLoading]);

  const formatCurrency = (amount: number) => `¢${new Intl.NumberFormat('es-CR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
  const formatCurrencyShort = (amount: number) => {
    if (amount >= 1000000) return `¢${(amount/1000000).toFixed(1)}M`;
    if (amount >= 1000) return `¢${(amount/1000).toFixed(0)}k`;
    return `¢${amount}`;
  }

  const handlePrint = () => toast({ title: "Imprimir Reporte (Simulado)", description: `Se prepararía el reporte de ${months.find(m=>m.value===selectedMonth)?.label} ${selectedYear} para impresión.` });
  const handleExportCsv = () => toast({ title: "Exportar CSV (Simulado)", description: `Se generaría un CSV para el ${months.find(m=>m.value===selectedMonth)?.label} ${selectedYear}.` });
  const handleExportPdf = () => toast({ title: "Exportar PDF (Simulado)", description: `Se generaría un PDF para ${months.find(m=>m.value===selectedMonth)?.label} ${selectedYear}.` });

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <BarChart3 className="h-7 w-7" /> Resumen Mensual
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
            <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
              <BarChart3 className="h-6 w-6" /> Resumen de Operaciones
            </CardTitle>
            <CardDescription>
              Analiza el rendimiento de la óptica para el mes y año seleccionados.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
             <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Seleccione mes"/></SelectTrigger>
                <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Año"/></SelectTrigger>
                <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        {isLoading || !monthlyData ? (
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg"/>)}
                </div>
                <Skeleton className="h-80 rounded-lg"/>
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-72 rounded-lg"/>
                    <Skeleton className="h-72 rounded-lg"/>
                </div>
            </CardContent>
        ) : monthlyData ? (
          <>
          <CardContent className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard title="Ventas Totales del Mes" value={formatCurrency(monthlyData.totalSales)} icon={DollarSign} isLoading={isLoading} />
              <KpiCard title="Nº Transacciones del Mes" value={monthlyData.transactionCount} icon={ShoppingCart} isLoading={isLoading} />
              <KpiCard title="Ticket Promedio del Mes" value={formatCurrency(monthlyData.averageTicket)} icon={DollarSign} isLoading={isLoading} />
              <KpiCard title="Nuevos Pacientes del Mes" value={monthlyData.newPatients} icon={Users} isLoading={isLoading} />
            </div>

            <Card>
                <CardHeader><CardTitle className="text-lg">Tendencia de Ventas Diarias del Mes</CardTitle></CardHeader>
                <CardContent className="h-[350px]">
                {monthlyData.salesTrend.filter((d:any) => d.sales > 0).length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyData.salesTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                        <XAxis dataKey="day" tickFormatter={(day) => `${day}`}/>
                        <YAxis tickFormatter={(value) => formatCurrencyShort(value)}/>
                        <Tooltip formatter={(value:number) => [formatCurrency(value), "Ventas"]}/>
                        <Legend />
                        <Line type="monotone" dataKey="sales" name="Ventas" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{r:3}} activeDot={{r:5}}/>
                        </LineChart>
                    </ResponsiveContainer>
                ): <p className="text-muted-foreground text-center pt-10">No hay datos de ventas para graficar este mes.</p>}
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-5">
              <Card className="md:col-span-2">
                <CardHeader><CardTitle className="text-lg">Ventas por Método de Pago</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                    {monthlyData.salesByPaymentMethod.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                            <Pie data={monthlyData.salesByPaymentMethod} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                            {monthlyData.salesByPaymentMethod.map((entry:any, index:number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            </Pie>
                            <Tooltip formatter={(value:number) => formatCurrency(value)} />
                            <Legend />
                        </RechartsPieChart>
                        </ResponsiveContainer>
                    ) : <p className="text-muted-foreground text-center pt-10">No hay ventas este mes.</p>}
                </CardContent>
              </Card>
              <Card className="md:col-span-3">
                <CardHeader><CardTitle className="text-lg">Ventas por Categoría</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                  {monthlyData.salesByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData.salesByCategory} layout="vertical" margin={{left:30, bottom: 5, right: 20}}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                        <XAxis type="number" tickFormatter={(value) => formatCurrencyShort(value)}/>
                        <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 12}} interval={0}/>
                        <Tooltip formatter={(value:number) => [formatCurrency(value), "Ventas"]}/>
                        <Legend />
                        <Bar dataKey="value" name="Ventas" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                   ) : <p className="text-muted-foreground text-center pt-10">No hay ventas por categoría.</p>}
                </CardContent>
              </Card>
            </div>
            
          </CardContent>
          <CardFooter className="border-t pt-6 flex flex-col sm:flex-row justify-end gap-3">
            <Button variant="outline" onClick={handleExportCsv} disabled={isLoading}><FileDown className="mr-2 h-4 w-4"/> Exportar CSV</Button>
            <Button variant="outline" onClick={handleExportPdf} disabled={isLoading}><FileDown className="mr-2 h-4 w-4"/> Guardar PDF</Button>
            <Button variant="outline" onClick={handlePrint} disabled={isLoading}><Printer className="mr-2 h-4 w-4"/> Imprimir Reporte</Button>
          </CardFooter>
          </>
        ) : (
            <CardContent className="text-center py-10 text-muted-foreground">
                No hay datos disponibles para {months.find(m=>m.value===selectedMonth)?.label} de {selectedYear}.
            </CardContent>
        )}
      </Card>
    </div>
  );
}
