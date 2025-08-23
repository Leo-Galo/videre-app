
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, Sparkles, Lock } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import type { DateRange } from "react-day-picker";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { generateReportSchema, reportGroups } from "@/types/report-schema";
import { Badge } from "@/components/ui/badge";

interface GenerateReportDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSubmit: (values: z.infer<typeof generateReportSchema>) => Promise<void>;
    isGenerating: boolean;
    currentPlan: string | null;
}

export function GenerateReportDialog({ isOpen, onOpenChange, onSubmit, isGenerating, currentPlan }: GenerateReportDialogProps) {
    const form = useForm<z.infer<typeof generateReportSchema>>({
        resolver: zodResolver(generateReportSchema),
        defaultValues: {
          reportType: "detailed_sales",
          dateRange: {
            from: subDays(new Date(), 29),
            to: new Date(),
          }
        },
    });

    const setDateRangePreset = (preset: 'last7' | 'last30' | 'thisMonth' | 'lastMonth') => {
        const today = new Date();
        let fromDate: Date;
        let toDate: Date = today;

        switch (preset) {
            case 'last7':
                fromDate = subDays(today, 6);
                break;
            case 'last30':
                fromDate = subDays(today, 29);
                break;
            case 'thisMonth':
                fromDate = startOfMonth(today);
                break;
            case 'lastMonth':
                const lastMonthStart = startOfMonth(subDays(today, today.getDate()));
                fromDate = lastMonthStart;
                toDate = endOfMonth(lastMonthStart);
                break;
        }
        form.setValue('dateRange', { from: fromDate, to: toDate }, { shouldValidate: true });
    };

    const handleFormSubmit = (values: z.infer<typeof generateReportSchema>) => {
      // Adapt the structure for the parent component if needed
      const submissionValues = {
        ...values,
        startDate: values.dateRange.from,
        endDate: values.dateRange.to,
      } as any; // Use 'any' to bypass strict type checking for the intermediate step
      delete submissionValues.dateRange;

      onSubmit(submissionValues);
    };

    const checkPlanAccess = (reportPlan?: 'Pro' | 'Premium'): boolean => {
      if (!currentPlan) return false;
      if (!reportPlan) return true; // No plan required, public access

      const planHierarchy = { basic: 1, pro: 2, premium: 3 };
      const userPlanLevel = planHierarchy[currentPlan.toLowerCase() as keyof typeof planHierarchy] || 0;
      const requiredLevel = planHierarchy[reportPlan.toLowerCase() as keyof typeof planHierarchy];

      return userPlanLevel >= requiredLevel;
    };


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Generar Reporte Personalizado</DialogTitle>
                    <DialogDescription>
                        Selecciona el tipo de reporte y el rango de fechas para generar una vista previa.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
                        <FormField
                            control={form.control}
                            name="reportType"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Tipo de Reporte *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Selecciona un reporte" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {reportGroups.map(group => (
                                          <SelectGroup key={group.group}>
                                              <SelectLabel>{group.group}</SelectLabel>
                                              {group.reports.map(rt => {
                                                  const hasAccess = checkPlanAccess(rt.plan);
                                                  const planLabel = rt.plan;

                                                  return (
                                                      <SelectItem key={rt.value} value={rt.value} disabled={!hasAccess} onSelect={(e) => {if (!hasAccess) e.preventDefault()}}>
                                                          <div className="flex items-center justify-between w-full">
                                                          <span>{rt.label}</span>
                                                          {planLabel && (
                                                              <Badge variant={planLabel === 'Premium' ? 'default' : 'secondary'} className="ml-2 bg-yellow-400/80 text-yellow-900 text-xs">
                                                              <Sparkles className="mr-1 h-3 w-3" />
                                                              {planLabel}
                                                              </Badge>
                                                          )}
                                                          {!hasAccess && <Lock className="h-3 w-3 ml-2 text-muted-foreground" />}
                                                          </div>
                                                      </SelectItem>
                                                  )
                                              })}
                                          </SelectGroup>
                                      ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="dateRange"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Rango de Fechas *</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value.from && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value?.from ? (
                                      field.value.to ? (
                                        <>
                                          {format(field.value.from, "LLL dd, y", { locale: es })} -{" "}
                                          {format(field.value.to, "LLL dd, y", { locale: es })}
                                        </>
                                      ) : (
                                        format(field.value.from, "LLL dd, y", { locale: es })
                                      )
                                    ) : (
                                      <span>Selecciona un rango</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={field.value?.from}
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    numberOfMonths={2}
                                    locale={es}
                                  />
                                </PopoverContent>
                              </Popover>
                               <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div>
                            <FormLabel className="text-sm font-medium">Rangos Rápidos</FormLabel>
                            <div className="flex flex-wrap items-center gap-1 pt-1">
                                <Button type="button" variant="ghost" size="sm" onClick={() => setDateRangePreset('last7')}>Últ. 7 Días</Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setDateRangePreset('last30')}>Últ. 30 Días</Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setDateRangePreset('thisMonth')}>Este Mes</Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setDateRangePreset('lastMonth')}>Mes Pasado</Button>
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <DialogClose asChild><Button type="button" variant="outline" disabled={isGenerating}>Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={isGenerating || !form.formState.isValid}>
                                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Ver Vista Previa
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
