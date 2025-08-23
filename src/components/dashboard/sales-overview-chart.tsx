
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartTooltipContent, ChartContainer, ChartTooltip } from "@/components/ui/chart" 
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { getOrders } from "@/services/order-service"
import { getAppointments } from "@/services/appointment-service"
import { format, parseISO, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

const chartConfig = {
  sales: {
    label: "Ventas (¢)",
    color: "hsl(var(--chart-1))",
  },
  appointments: {
    label: "Citas",
    color: "hsl(var(--chart-2))",
  },
}

export function SalesOverviewChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
        setIsLoading(true);
        const [orders, appointments] = await Promise.all([getOrders(), getAppointments()]);

        const monthlyData: { [key: string]: { sales: number; appointments: number } } = {};

        // Initialize last 12 months
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthKey = format(startOfMonth(d), 'yyyy-MM');
            monthlyData[monthKey] = { sales: 0, appointments: 0 };
        }

        orders.forEach(order => {
            if (order.status === 'completed') {
                const monthKey = format(parseISO(order.createdAt), 'yyyy-MM');
                if (monthlyData[monthKey]) {
                    monthlyData[monthKey].sales += order.totalCRC;
                }
            }
        });

        appointments.forEach(appt => {
            const monthKey = format(parseISO(appt.dateTime), 'yyyy-MM');
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].appointments += 1;
            }
        });

        const formattedChartData = Object.keys(monthlyData).map(key => ({
            month: format(new Date(key), 'MMM', { locale: es }),
            ...monthlyData[key]
        }));

        setChartData(formattedChartData);
        setIsLoading(false);
    }
    loadData();
  }, []);

  const formatCurrencyCRCShort = (value: number) => {
    if (value >= 1000000) return `¢${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `¢${(value / 1000).toFixed(0)}k`;
    return `¢${value}`;
  };


  if (isLoading) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
        <CardHeader>
          <Skeleton className="h-6 w-1/2 mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="pb-4">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow rounded-xl">
      <CardHeader>
        <CardTitle>Resumen de Ventas y Citas</CardTitle>
        <CardDescription>Ingresos mensuales por ventas y número de citas de los últimos 12 meses.</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--chart-1))" tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrencyCRCShort(value)} />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" tickLine={false} axisLine={false} />
              <ChartTooltip 
                cursor={false} 
                content={<ChartTooltipContent 
                    formatter={(value, name) => name === 'Ventas (¢)' ? formatCurrencyCRCShort(value as number) : value}
                />} 
              />
              <Legend />
              <Bar yAxisId="left" dataKey="sales" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Ventas (¢)" />
              <Bar yAxisId="right" dataKey="appointments" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Citas" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
