
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CalendarIcon, Printer, FileDown, DollarSign, ShoppingCart, Users, Activity, ArrowLeft } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay, isWithinInterval, subDays } from 'date-fns';
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

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F'];

export default function DailySummaryPage() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [dailyData, setDailyData] = useState<any>(null); 
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
    if(allOrders.length === 0 && allPatients.length === 0 && !isLoading) {
        // If initial load is done and data is empty, just set empty data.
        setDailyData({
            totalSales: 0,
            transactionCount: 0,
            averageTicket: 0,
            newPatients: 0,
            salesByPaymentMethod: [],
            salesByCategory: [],
            topProducts: [],
        });
        return;
    }
    
    setIsLoading(true);
    const dateStart = startOfDay(selectedDate);
    const dateEnd = endOfDay(selectedDate);

    const salesForDay = allOrders.filter(order => 
        order.status === 'completed' && isWithinInterval(parseISO(order.createdAt), { start: dateStart, end: dateEnd })
    );
    const newPatientsForDay = allPatients.filter(patient => 
        isWithinInterval(parseISO(patient.registrationDate), { start: dateStart, end: dateEnd })
    );

    const salesByMethod = salesForDay.reduce((acc, order) => {
      const method = order.payments?.[0]?.method || 'desconocido';
      acc[method] = (acc[method] || 0) + order.totalCRC;
      return acc;
    }, {} as Record<string, number>);
    
    const salesByCategory = salesForDay.flatMap(o => o.items).reduce((acc, item) => {
        const category = item.product.category || 'Sin Categoría';
        acc[category] = (acc[category] || 0) + item.subtotal;
        return acc;
    }, {} as Record<string, number>);
    
    const topProductsAggregated = salesForDay.flatMap(o => o.items).reduce((acc, item) => {
        const existing = acc.find(p => p.id === item.product.id);
        if (existing) {
            existing.quantity += item.quantity;
            existing.total += item.subtotal;
        } else {
            acc.push({ id: item.product.id, name: item.product.name, quantity: item.quantity, total: item.subtotal });
        }
        return acc;
    }, [] as {id: string; name: string; quantity: number; total: number}[]).sort((a,b) => b.total - a.total).slice(0,5);

    setDailyData({
        totalSales: salesForDay.reduce((sum, order) => sum + order.totalCRC, 0),
        transactionCount: salesForDay.length,
        averageTicket: salesForDay.length > 0 ? salesForDay.reduce((sum, order) => sum + order.totalCRC, 0) / salesForDay.length : 0,
        newPatients: newPatientsForDay.length,
        salesByPaymentMethod: Object.entries(salesByMethod).map(([name, value]) => ({ name, value })),
        salesByCategory: Object.entries(salesByCategory).map(([name, value]) => ({ name, value })),
        topProducts: topProductsAggregated,
    });
    setIsLoading(false);

  }, [selectedDate, allOrders, allPatients, isLoading]);

  const formatCurrency = (amount: number) => `¢${new Intl.NumberFormat('es-CR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;

  const handlePrint = () => toast({ title: "Imprimir Reporte (Simulado)", description: `Se prepararía el reporte del ${format(selectedDate, 'PPP', { locale: es })} para impresión.` });
  const handleExportCsv = () => toast({ title: "Exportar CSV (Simulado)", description: `Se generaría un CSV para el ${format(selectedDate, 'PPP', { locale: es })}.` });
  const handleExportPdf = () => toast({ title: "Exportar PDF (Simulado)", description: `Se generaría un PDF para el ${format(selectedDate, 'PPP', { locale: es })}.` });


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <Activity className="h-7 w-7" /> Resumen Diario
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
              <Activity className="h-6 w-6" /> Resumen de Operaciones
            </CardTitle>
            <CardDescription>
              Visualiza las métricas clave y el rendimiento de la óptica para el día seleccionado.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="w-[280px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} initialFocus locale={es} disabled={(date) => date > new Date()} />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        
        {isLoading ? (
             <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg"/>)}
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-72 rounded-lg"/>
                    <Skeleton className="h-72 rounded-lg"/>
                </div>
                <Skeleton className="h-60 rounded-lg"/>
             </CardContent>
        ) : dailyData ? (
          <>
          <CardContent className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard title="Ventas Totales" value={formatCurrency(dailyData.totalSales)} icon={DollarSign} isLoading={isLoading} />
              <KpiCard title="Nº Transacciones" value={dailyData.transactionCount} icon={ShoppingCart} isLoading={isLoading} />
              <KpiCard title="Ticket Promedio" value={formatCurrency(dailyData.averageTicket)} icon={DollarSign} isLoading={isLoading} />
              <KpiCard title="Nuevos Pacientes" value={dailyData.newPatients} icon={Users} isLoading={isLoading} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-lg">Ventas por Método de Pago</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                  {dailyData.salesByPaymentMethod.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dailyData.salesByPaymentMethod} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                          {dailyData.salesByPaymentMethod.map((entry:any, index:number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value:number) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-muted-foreground text-center pt-10">No hay ventas para mostrar.</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Ventas por Categoría</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                 {dailyData.salesByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyData.salesByCategory} layout="vertical" margin={{left: 30}}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(value) => formatCurrency(value).replace('¢', '')}/>
                        <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 12}}/>
                        <Tooltip formatter={(value:number) => formatCurrency(value)}/>
                        <Legend />
                        <Bar dataKey="value" name="Ventas" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                 ) : <p className="text-muted-foreground text-center pt-10">No hay ventas por categoría.</p>}
                </CardContent>
              </Card>
            </div>

            <Card>
                <CardHeader><CardTitle className="text-lg">Top Productos Vendidos</CardTitle></CardHeader>
                <CardContent>
                {dailyData.topProducts.length > 0 ? (
                    <Table>
                        <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead className="text-center">Cantidad</TableHead><TableHead className="text-right">Total Vendido</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {dailyData.topProducts.map((prod:any, index:number) => (
                            <TableRow key={index}><TableCell>{prod.name}</TableCell><TableCell className="text-center">{prod.quantity}</TableCell><TableCell className="text-right">{formatCurrency(prod.total)}</TableCell></TableRow>
                        ))}
                        </TableBody>
                    </Table>
                ) : <p className="text-muted-foreground text-center py-4">No hay productos vendidos este día.</p>}
                </CardContent>
            </Card>
          </CardContent>
          <CardFooter className="border-t pt-6 flex flex-col sm:flex-row justify-end gap-3">
            <Button variant="outline" onClick={handleExportCsv} disabled={isLoading}><FileDown className="mr-2 h-4 w-4"/> Exportar CSV</Button>
            <Button variant="outline" onClick={handleExportPdf} disabled={isLoading}><FileDown className="mr-2 h-4 w-4"/> Guardar PDF</Button>
            <Button variant="outline" onClick={handlePrint} disabled={isLoading}><Printer className="mr-2 h-4 w-4"/> Imprimir Reporte</Button>
          </CardFooter>
          </>
        ) : (
             <CardContent className="text-center py-10 text-muted-foreground">
                No hay datos disponibles para el {format(selectedDate, 'PPP', { locale: es })}.
             </CardContent>
        )}
      </Card>
    </div>
  );
}
