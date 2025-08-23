
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CalendarDays, AlertTriangle, Printer, FileDown, DollarSign, CheckCircle, Loader2 } from 'lucide-react';
import { format, getYear, getMonth, parseISO, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import * as service from '@/services/petty-cash-service';
import type { PettyCashLiquidation } from '@/types/petty-cash';
import { cn } from '@/lib/utils';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { useToast } from '@/hooks/use-toast';

const currentYear = getYear(new Date());
const years = Array.from({length: 5}, (_, i) => (currentYear - i).toString());
const months = Array.from({length: 12}, (_, i) => ({ value: i.toString(), label: format(new Date(0, i), 'MMMM', {locale: es})}));

export default function MonthlyClosurePage() {
  const [liquidations, setLiquidations] = useState<PettyCashLiquidation[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(getMonth(new Date()).toString());
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [isLoading, setIsLoading] = useState(true);
  const [isClosureConfirmOpen, setIsClosureConfirmOpen] = useState(false);
  const [isProcessingClosure, setIsProcessingClosure] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadHistory = async () => {
        setIsLoading(true);
        const data = await service.getLiquidationHistory();
        setLiquidations(data);
        setIsLoading(false);
    };
    loadHistory();
  }, []);
  
  const filteredLiquidations = useMemo(() => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    const monthStart = startOfMonth(new Date(year, month));
    const monthEnd = endOfMonth(monthStart);

    return liquidations.filter(liq => 
        isWithinInterval(parseISO(liq.liquidationDate), { start: monthStart, end: monthEnd })
    );
  }, [liquidations, selectedMonth, selectedYear]);
  
  const summaryMetrics = useMemo(() => {
    return filteredLiquidations.reduce((acc, liq) => {
        acc.totalExpenses += liq.totalExpenses;
        const difference = liq.finalBalance - (liq.initialAmount - liq.totalExpenses);
        if (difference < 0) acc.totalShortage += Math.abs(difference);
        if (difference > 0) acc.totalSurplus += difference;
        return acc;
    }, { totalExpenses: 0, totalShortage: 0, totalSurplus: 0 });
  }, [filteredLiquidations]);

  const handleConfirmClosure = async () => {
    setIsProcessingClosure(true);
    // Simular proceso de cierre (generar reportes, marcar periodo como cerrado, etc.)
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessingClosure(false);
    setIsClosureConfirmOpen(false);
    toast({
        title: "Cierre Mensual Realizado",
        description: `El cierre para ${months.find(m => m.value === selectedMonth)?.label} de ${selectedYear} se ha completado exitosamente.`,
    });
  };

  const formatCurrency = (amount: number) => `¢${new Intl.NumberFormat('es-CR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
  const formatDate = (dateString: string) => format(parseISO(dateString), 'dd MMM, yyyy HH:mm', { locale: es });
  
  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-1/3" />
            </div>
            <Card className="shadow-lg rounded-xl">
                <CardHeader>
                    <Skeleton className="h-7 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="pt-6">
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
                <CalendarDays className="h-7 w-7" /> Cierre Mensual Consolidado
            </h1>
        </div>

        <Card className="shadow-lg rounded-xl">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <CardTitle>Reporte de Cierres de Caja del Mes</CardTitle>
                    <CardDescription>Selecciona un período para ver el resumen consolidado de liquidaciones de caja.</CardDescription>
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
            <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KpiCard title="Gastos Totales (Caja Chica)" value={formatCurrency(summaryMetrics.totalExpenses)} icon={DollarSign} trendDirection="down" />
                    <KpiCard title="Faltantes Acumulados" value={formatCurrency(summaryMetrics.totalShortage)} icon={DollarSign} trendDirection="down" />
                    <KpiCard title="Sobrantes Acumulados" value={formatCurrency(summaryMetrics.totalSurplus)} icon={DollarSign} trendDirection="up" />
                </div>
                
                {filteredLiquidations.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader><TableRow>
                                <TableHead>Fecha Liquidación</TableHead>
                                <TableHead>Responsable</TableHead>
                                <TableHead className="text-right">Monto Inicial (¢)</TableHead>
                                <TableHead className="text-right">Total Gastos (¢)</TableHead>
                                <TableHead className="text-right">Saldo Esperado (¢)</TableHead>
                                <TableHead className="text-right">Conteo Final (¢)</TableHead>
                                <TableHead className="text-right">Diferencia (¢)</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                                {filteredLiquidations.map(liq => {
                                    const expectedBalance = liq.initialAmount - liq.totalExpenses;
                                    const difference = liq.finalBalance - expectedBalance;
                                    return (
                                        <TableRow key={liq.id}>
                                            <TableCell className="text-xs">{formatDate(liq.liquidationDate)}</TableCell>
                                            <TableCell>{liq.responsibleUser}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(liq.initialAmount)}</TableCell>
                                            <TableCell className="text-right text-red-600">-{formatCurrency(liq.totalExpenses)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(expectedBalance)}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatCurrency(liq.finalBalance)}</TableCell>
                                            <TableCell className={cn("text-right font-bold", difference !== 0 ? (difference > 0 ? "text-yellow-600" : "text-destructive") : "text-green-600")}>
                                                {formatCurrency(difference)}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
                        <p className="font-semibold">Sin Datos para el Período</p>
                        <p>No se encontraron liquidaciones de caja para {months.find(m => m.value === selectedMonth)?.label} de {selectedYear}.</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-between items-center gap-2">
                 <div className="flex gap-2">
                    <Button variant="outline" disabled><FileDown className="mr-2 h-4 w-4"/>Exportar PDF</Button>
                    <Button variant="outline" disabled><Printer className="mr-2 h-4 w-4"/>Imprimir</Button>
                </div>
                <Button onClick={() => setIsClosureConfirmOpen(true)} disabled={filteredLiquidations.length === 0}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Realizar Cierre Mensual
                </Button>
            </CardFooter>
        </Card>

        <AlertDialog open={isClosureConfirmOpen} onOpenChange={setIsClosureConfirmOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Cierre Mensual</AlertDialogTitle>
                <AlertDialogDescription>
                Estás a punto de realizar el cierre para <span className="font-bold">{months.find(m => m.value === selectedMonth)?.label} de {selectedYear}</span>. Esta acción es definitiva y consolidará los reportes del período. No se podrán realizar más ajustes para este mes. ¿Deseas continuar?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isProcessingClosure}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmClosure} disabled={isProcessingClosure}>
                    {isProcessingClosure && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sí, realizar cierre
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
