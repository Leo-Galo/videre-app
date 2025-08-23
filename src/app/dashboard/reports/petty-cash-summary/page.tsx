"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, DollarSign, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import * as service from '@/services/petty-cash-service';
import type { PettyCashLiquidation } from '@/types/petty-cash';
import { cn } from '@/lib/utils';

export default function PettyCashSummaryPage() {
    const [history, setHistory] = useState<PettyCashLiquidation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            setIsLoading(true);
            const data = await service.getLiquidationHistory();
            setHistory(data);
            setIsLoading(false);
        };
        loadHistory();
    }, []);

    const formatCurrency = (amount: number) => `¢${new Intl.NumberFormat('es-CR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
    const formatDate = (dateString: string) => format(parseISO(dateString), 'dd MMM, yyyy HH:mm', { locale: es });

    if (isLoading) {
        return <div className="space-y-6"><Skeleton className="h-40 w-full" /><Skeleton className="h-64 w-full" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
                    <DollarSign className="h-7 w-7" /> Historial de Liquidaciones de Caja Chica
                </h1>
                <Button variant="outline" asChild>
                    <Link href="/dashboard/reports"><ArrowLeft className="mr-2 h-4 w-4" /> Volver a Reportes</Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Liquidaciones Recientes</CardTitle>
                    <CardDescription>Consulta el historial de cierres de caja chica.</CardDescription>
                </CardHeader>
                <CardContent>
                    {history.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader><TableRow>
                                    <TableHead>Período</TableHead>
                                    <TableHead className="text-right">Monto Inicial</TableHead>
                                    <TableHead className="text-right">Total Gastos</TableHead>
                                    <TableHead className="text-right">Saldo Esperado</TableHead>
                                    <TableHead className="text-right">Conteo Final</TableHead>
                                    <TableHead className="text-right">Diferencia</TableHead>
                                    <TableHead>Notas</TableHead>
                                </TableRow></TableHeader>
                                <TableBody>
                                    {history.map(liq => {
                                        const expectedBalance = liq.initialAmount - liq.totalExpenses;
                                        const difference = liq.finalBalance - expectedBalance;
                                        return (
                                            <TableRow key={liq.id}>
                                                <TableCell className="text-xs">{formatDate(liq.startDate)} - {formatDate(liq.endDate)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(liq.initialAmount)}</TableCell>
                                                <TableCell className="text-right text-red-600">-{formatCurrency(liq.totalExpenses)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(expectedBalance)}</TableCell>
                                                <TableCell className="text-right font-semibold">{formatCurrency(liq.finalBalance)}</TableCell>
                                                <TableCell className={cn("text-right font-bold", difference !== 0 ? (difference > 0 ? "text-yellow-600" : "text-destructive") : "text-green-600")}>
                                                    {formatCurrency(difference)}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={liq.notes}>{liq.notes || 'N/A'}</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <Alert>
                            <AlertCircle className="h-4 w-4"/>
                            <AlertTitle>Sin Historial</AlertTitle>
                            <AlertDescription>No se han realizado liquidaciones de caja chica todavía.</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
