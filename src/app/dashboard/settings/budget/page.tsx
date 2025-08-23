
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PiggyBank, Save, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { format, getYear, getMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { ExpenseCategory } from '@/types/finance';
import { expenseCategories } from '@/types/finance';
import { getBudget, saveBudget } from '@/services/budget-service';

const currentYear = getYear(new Date());
const years = Array.from({length: 5}, (_, i) => (currentYear - i).toString());
const months = Array.from({length: 12}, (_, i) => ({ value: i.toString(), label: format(new Date(0, i), 'MMMM', {locale: es})}));

type BudgetData = Record<ExpenseCategory, number>;

export default function BudgetSettingsPage() {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState<string>(getMonth(new Date()).toString());
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [budgetData, setBudgetData] = useState<Partial<BudgetData>>({});

  useEffect(() => {
    setIsLoading(true);
    const plan = localStorage.getItem('subscriptionPlan');
    const premium = plan?.toLowerCase() === 'premium';
    setIsPremiumUser(premium);
    
    if (premium) {
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);
      getBudget(year, month).then(storedBudget => {
        setBudgetData(storedBudget || {});
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  const handleBudgetInputChange = (category: ExpenseCategory, value: string) => {
    const amount = parseFloat(value);
    setBudgetData(prev => ({
      ...prev,
      [category]: isNaN(amount) || amount < 0 ? 0 : amount,
    }));
  };

  const handleSaveBudget = async () => {
    setIsSaving(true);
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    const success = await saveBudget(year, month, budgetData as BudgetData);
    if (success) {
      toast({ title: "Presupuesto Guardado", description: `Tu presupuesto para ${months[month].label} ${year} ha sido guardado.` });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el presupuesto.' });
    }
    setIsSaving(false);
  };
  
  if (isLoading) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  if (!isPremiumUser) {
    return (
      <Card className="shadow-lg rounded-xl border-dashed border-primary/50 bg-primary/5">
        <CardHeader className="text-center">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-3" />
          <CardTitle className="text-2xl">Gestión de Presupuestos</CardTitle>
          <CardDescription className="text-lg">Esta es una funcionalidad Premium.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">Define presupuestos de gastos mensuales y compara tu rendimiento real para tomar decisiones financieras informadas.</p>
          <Button asChild size="lg"><Link href="/dashboard/subscription">Actualizar a Premium</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <PiggyBank className="h-7 w-7" /> Gestión de Presupuestos
        </h1>
        <Button variant="outline" asChild><Link href="/dashboard/settings"><ArrowLeft className="mr-2 h-4 w-4" /> Volver a Configuración</Link></Button>
       </div>
       <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle>Presupuesto de Gastos Mensual</CardTitle>
          <CardDescription>Define tu presupuesto para el período seleccionado. Los datos se guardan por mes y se usarán en el reporte financiero.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {expenseCategories.map(category => (
                    <div key={category} className="space-y-1">
                        <Label htmlFor={`budget-${category}`} className="text-sm">{category}</Label>
                        <Input
                            id={`budget-${category}`}
                            type="number"
                            placeholder="0.00"
                            value={budgetData[category] || ''}
                            onChange={(e) => handleBudgetInputChange(category, e.target.value)}
                            className="h-9"
                        />
                    </div>
                ))}
            </div>
        </CardContent>
        <CardFooter className="justify-end border-t pt-6">
            <Button onClick={handleSaveBudget} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                <Save className="mr-2 h-4 w-4"/>
                Guardar Presupuesto para {months[parseInt(selectedMonth)].label}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
