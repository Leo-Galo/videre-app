
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Palette, Bell, Shield, DollarSign, Link as LinkIcon, Lock, BarChart3, CreditCard, Send, AlertCircle, Info, Share2, KeyRound, Eye, EyeOff, Image as ImageIconLucide, ShieldCheck, CalendarClock, FileText, UserCog, Gem, Building, Clock, UploadCloud, Trash2, AlertTriangle, Layers, Tag, Save, PlusCircle, X, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import NextImage from 'next/image'; 
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { format, addDays, differenceInDays, addMonths, addYears, parseISO } from 'date-fns'; 
import { es } from 'date-fns/locale'; 
import { Badge } from "@/components/ui/badge"; 
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { clinicAdminPasswordSchema, type ClinicAdminPasswordFormValues } from "@/types/user-schema";
import { getProductCategories, saveProductCategories, getDiscountTags, saveDiscountTags } from "@/services/settings-service";
import type { DiscountTagConfig } from "@/config/discounts";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { formatCurrencyCRC } from "@/lib/utils";

const inputVariantsClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

interface ClinicSettings {
  clinicName?: string;
  clinicPhone?: string;
  clinicAddress?: string;
  clinicEmail?: string;
  clinicWebsite?: string;
  clinicLogo?: string | null;
  billingLegalName?: string;
  billingIdType?: string;
  billingIdNumber?: string;
  billingTaxRegime?: string;
  billingDefaultNotes?: string;
  billingReturnsPolicy?: string; 
  billingIncludeReturnsPolicy?: boolean; 
  pettyCashDefaultAmount?: number;
  haciendaUser?: string;
  haciendaPassword?: string;
  haciendaPin?: string;
  haciendaKeyFileName?: string;
  emailNotifications?: boolean;
  appointmentReminders?: boolean;
  labApiKeyX?: string; 
  paymentGatewayTokenY?: string; 
  syncGoogleCalendar?: boolean; 
  clinicOpeningHours?: string; 
  optometristScheduleNotes?: string;
}

const plans = [
  { id: 'Básico', name: 'Básico', monthlyPrice: 49, annualDiscountPercent: 20 },
  { id: 'Pro', name: 'Pro', monthlyPrice: 99, annualDiscountPercent: 20 },
  { id: 'Premium', name: 'Premium', monthlyPrice: 139, annualDiscountPercent: 20 },
] as const;

type PlanName = typeof plans[number]['id'];

const spanishMonths = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function SettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<ClinicSettings>({
    emailNotifications: true,
    appointmentReminders: true,
    billingIncludeReturnsPolicy: false, 
    billingReturnsPolicy: "",
    syncGoogleCalendar: false,
    clinicOpeningHours: "",
    optometristScheduleNotes: "",
    labApiKeyX: "",
    paymentGatewayTokenY: "",
    haciendaKeyFileName: "",
    haciendaPin: "",
  });
  
  const [currentPlan, setCurrentPlan] = useState<PlanName | null>(null);
  const [currentSubscriptionStatus, setCurrentSubscriptionStatus] = useState<string | null>(null);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);
  
  const [selectedNewPlan, setSelectedNewPlan] = useState<PlanName | ''>('');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'annually'>('monthly');

  const [userRole, setUserRole] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isPremiumPlanForIntegrations, setIsPremiumPlanForIntegrations] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<DiscountTagConfig[]>([]);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ isNew: boolean, value: string, originalValue?: string }>({ isNew: false, value: '' });
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<{ isNew: boolean, value: DiscountTagConfig, originalValue?: DiscountTagConfig }>({ isNew: false, value: { name: '', discountPercentage: 0, badgeClass: '' } });

  const [monthlyGoals, setMonthlyGoals] = useState<Record<number, string>>({});
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [selectedYearForGoals, setSelectedYearForGoals] = useState<string>(currentYear.toString());

  const yearOptionsForGoals = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => (currentYear - 2 + i).toString());
  }, [currentYear]);


  const isAdmin = userRole === "Admin";
  const isPremiumPlan = currentPlan?.toLowerCase() === 'premium';

  const passwordForm = useForm<ClinicAdminPasswordFormValues>({
    resolver: zodResolver(clinicAdminPasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });


  useEffect(() => {
    const role = localStorage.getItem('mockUserRole');
    setUserRole(role);
    const savedSettings = localStorage.getItem("videreClinicSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.clinicLogo && typeof parsed.clinicLogo === 'string') {
          try {
            const url = new URL(parsed.clinicLogo);
            const allowedHosts = ['placehold.co', 'i.imgur.com'];
            if (!allowedHosts.includes(url.hostname)) {
              parsed.clinicLogo = null; 
            }
          } catch (e) {
             parsed.clinicLogo = null;
          }
        }
        setSettings(prev => ({...prev, ...parsed})); 
      } catch (e) {
        console.error("Failed to parse clinic settings from localStorage");
      }
    }
    
    const plan = localStorage.getItem('subscriptionPlan') as PlanName | null;
    const status = localStorage.getItem('subscriptionStatus');
    setCurrentPlan(plan);
    setCurrentSubscriptionStatus(status);
    setIsPremiumPlanForIntegrations(plan?.toLowerCase() === 'premium');

    if (status === 'trialing') {
      const trialStartStr = localStorage.getItem('trialStartDate');
      const trialDurationStr = localStorage.getItem('trialDurationDays');
      if (trialStartStr && trialDurationStr) {
        const trialStartDate = new Date(trialStartStr);
        const trialEndDate = addDays(trialStartDate, parseInt(trialDurationStr, 10));
        setSubscriptionEndDate(format(trialEndDate, "dd 'de' MMMM, yyyy", { locale: es }));
      }
    } else if (status === 'active') {
      const nextBill = addMonths(new Date(), 1); 
      setSubscriptionEndDate(format(nextBill, "dd 'de' MMMM, yyyy", { locale: es }));
    }

    getProductCategories().then(setCategories);
    getDiscountTags().then(setTags);

  }, []);
  
  useEffect(() => {
    const goalsKey = `videreSalesGoals_${selectedYearForGoals}`;
    const savedGoals = localStorage.getItem(goalsKey);
    if (savedGoals) {
      try {
        const parsedGoals = JSON.parse(savedGoals);
        const goalsForState = Object.entries(parsedGoals).reduce((acc, [key, value]) => {
          acc[Number(key)] = String(value);
          return acc;
        }, {} as Record<number, string>);
        setMonthlyGoals(goalsForState);
      } catch (e) {
        console.error(`Failed to parse monthly sales goals for ${selectedYearForGoals} from localStorage`, e);
        setMonthlyGoals({});
      }
    } else {
        setMonthlyGoals({});
    }
  }, [selectedYearForGoals]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setSettings(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
        setSettings(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
    } else {
        setSettings(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSwitchChange = (name: keyof ClinicSettings, checked: boolean) => {
    setSettings(prev => ({...prev, [name]: checked}));
  };

  const handleSaveSettings = async (sectionName: string, event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdmin) {
        toast({ variant: "destructive", title: "Permiso Denegado", description: "Solo los Administradores pueden modificar la configuración." });
        return;
    }
    setIsLoading(prev => ({ ...prev, [sectionName]: true }));
    
    const updatedSettings = { ...settings };

    console.log(`Simulating save for ${sectionName} settings:`, updatedSettings);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    localStorage.setItem("videreClinicSettings", JSON.stringify(updatedSettings));
    if (sectionName === "Información de la Clínica" && updatedSettings.clinicName) {
        localStorage.setItem("mockUserName", updatedSettings.clinicName); 
    }

    toast({
      title: "Configuración Guardada (Simulado)",
      description: `Los ajustes para "${sectionName}" han sido guardados exitosamente.`,
    });
    setIsLoading(prev => ({ ...prev, [sectionName]: false }));
  };

  const handleMonthlyGoalChange = (monthIndex: number, value: string) => {
    setMonthlyGoals(prev => ({ ...prev, [monthIndex]: value }));
  };

  const totalAnnualGoal = useMemo(() => {
    return Object.values(monthlyGoals).reduce((sum, goal) => sum + (parseFloat(goal) || 0), 0);
  }, [monthlyGoals]);


  const handleSaveGoals = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdmin) {
        toast({ variant: "destructive", title: "Permiso Denegado" });
        return;
    }
    setIsLoading(prev => ({ ...prev, goals: true }));
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const goalsToSave = Object.entries(monthlyGoals).reduce((acc, [key, value]) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0) {
            acc[Number(key)] = numValue;
        }
        return acc;
    }, {} as Record<number, number>);

    const goalsKey = `videreSalesGoals_${selectedYearForGoals}`;
    localStorage.setItem(goalsKey, JSON.stringify(goalsToSave));
    
    toast({ title: "Metas Guardadas" });
    setIsLoading(prev => ({ ...prev, goals: false }));
  };

  const handleCategorySave = async () => {
    const newName = editingCategory.value.trim();
    if (newName.length < 2) {
        toast({variant: 'destructive', title: 'Error', description: 'El nombre de la categoría debe tener al menos 2 caracteres.'});
        return;
    }
    if (categories.some(c => c.toLowerCase() === newName.toLowerCase() && c.toLowerCase() !== editingCategory.originalValue?.toLowerCase())) {
        toast({variant: 'destructive', title: 'Categoría Duplicada', description: 'Ya existe una categoría con ese nombre.'});
        return;
    }
    let updatedCategories;
    if (editingCategory.isNew) {
        updatedCategories = [...categories, newName];
    } else {
        updatedCategories = categories.map(c => c === editingCategory.originalValue ? newName : c);
    }
    await saveProductCategories(updatedCategories);
    setCategories(updatedCategories);
    toast({ title: "Categorías guardadas" });
    setIsCategoryDialogOpen(false);
  };
  
  const handleCategoryDelete = async (categoryName: string) => {
    if (categoryName.toLowerCase() === 'otro') {
      toast({variant: "destructive", title: "Acción no permitida", description: "La categoría por defecto 'Otro' no puede ser eliminada."});
      return;
    }
    const updatedCategories = categories.filter(c => c !== categoryName);
    await saveProductCategories(updatedCategories);
    setCategories(updatedCategories);
    toast({ title: "Categoría Eliminada", description: `La categoría "${categoryName}" fue eliminada. Los productos asociados deberán ser recategorizados.` });
  };
  
  const handleTagSave = async () => {
    const { name, discountPercentage, badgeClass } = editingTag.value;
    if (!name.trim() || discountPercentage <= 0 || !badgeClass.trim()) {
        toast({variant: 'destructive', title: 'Error', description: 'Todos los campos de la etiqueta son requeridos.'});
        return;
    }
    if (tags.some(t => t.name.toLowerCase() === name.trim().toLowerCase() && t.name.toLowerCase() !== editingTag.originalValue?.name.toLowerCase())) {
        toast({variant: 'destructive', title: 'Etiqueta Duplicada', description: 'Ya existe una etiqueta con ese nombre.'});
        return;
    }
    let updatedTags;
    if (editingTag.isNew) {
        updatedTags = [...tags, editingTag.value];
    } else {
        updatedTags = tags.map(t => t.name === editingTag.originalValue?.name ? editingTag.value : t);
    }
    await saveDiscountTags(updatedTags);
    setTags(updatedTags);
    toast({ title: "Etiquetas guardadas" });
    setIsTagDialogOpen(false);
  };

  const handleTagDelete = async (tagName: string) => {
    if (tagName === 'Ninguna') {
        toast({variant: 'destructive', title: 'Acción no permitida', description: 'La etiqueta "Ninguna" no puede ser eliminada.'});
        return;
    }
    const updatedTags = tags.filter(t => t.name !== tagName);
    await saveDiscountTags(updatedTags);
    setTags(updatedTags);
    toast({ title: "Etiqueta Eliminada" });
  };


  const SaveButtonWithTooltip = ({ sectionName, formId }: { sectionName: string, formId: string}) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                 <Button type="submit" form={formId} disabled={isLoading[sectionName] || isLoading['goals'] || !isAdmin}>
                    { (isLoading[sectionName] || isLoading['goals']) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar {sectionName.startsWith("Config") ? "Configuración" : sectionName}
                </Button>
            </TooltipTrigger>
            {!isAdmin && <TooltipContent><p>Requiere permisos de Administrador para guardar.</p></TooltipContent>}
        </Tooltip>
    </TooltipProvider>
  );

  async function onPasswordFormSubmit(values: ClinicAdminPasswordFormValues) {
    setIsPasswordLoading(true);
    console.log("Changing clinic admin password (simulated):", values.newPassword);
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (values.currentPassword !== "Videre.2025!!") { 
      passwordForm.setError("currentPassword", { type: "manual", message: "Contraseña actual incorrecta (simulado)." });
      toast({ variant: "destructive", title: "Error de Contraseña" });
      setIsPasswordLoading(false);
      return;
    }
    toast({ title: "Contraseña de Administrador Actualizada" });
    passwordForm.reset();
    setIsPasswordLoading(false);
  }

  const passwordRequirements = [
    "Al menos 8 caracteres", "Una letra mayúscula", "Una letra minúscula", "Un número", "Un carácter especial (!@#$...)",
  ];

  if (isLoading['page']) {
    return <Skeleton className="h-[800px] w-full" />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary">Configuración de la Clínica</h1>
        <p className="text-muted-foreground">
          Administra la configuración general de tu óptica y las preferencias de la aplicación.
        </p>
      </div>
      
      {isPremiumPlan && (
        <Card className="shadow-lg rounded-xl">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <BarChart3 className="h-5 w-5 text-primary" /> Metas de Venta
                        </CardTitle>
                        <CardDescription>
                            Define las metas de venta para cada mes del año seleccionado. El total anual se calculará automáticamente.
                        </CardDescription>
                    </div>
                    <Select value={selectedYearForGoals} onValueChange={setSelectedYearForGoals}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                            <SelectValue placeholder="Seleccionar año" />
                        </SelectTrigger>
                        <SelectContent>
                            {yearOptionsForGoals.map(year => (
                                <SelectItem key={year} value={year}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <form onSubmit={handleSaveGoals} id="goalsForm">
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                        {spanishMonths.map((month, index) => (
                            <div key={month} className="space-y-1.5">
                                <Label htmlFor={`goal-${index}`}>{month}</Label>
                                <Input 
                                    id={`goal-${index}`} 
                                    name={`goal-${index}`} 
                                    type="number" 
                                    placeholder="0" 
                                    value={monthlyGoals[index] || ''} 
                                    onChange={(e) => handleMonthlyGoalChange(index, e.target.value)}
                                    disabled={!isAdmin || isLoading['goals']}
                                    className="h-9"
                                />
                            </div>
                        ))}
                    </div>
                    <Separator className="my-6"/>
                    <div className="text-right space-y-1">
                        <Label>Meta Anual Total (Calculada)</Label>
                        <p className="text-3xl font-bold text-foreground">{formatCurrencyCRC(totalAnnualGoal)}</p>
                    </div>
                </CardContent>
                <CardFooter className="border-t pt-6 flex justify-end">
                    <SaveButtonWithTooltip sectionName="Metas" formId="goalsForm" />
                </CardFooter>
            </form>
        </Card>
      )}

      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building className="h-5 w-5 text-primary" />
            Información de la Clínica
          </CardTitle>
          <CardDescription>
            Detalles de tu óptica. Esta información puede aparecer en facturas o comunicaciones.
          </CardDescription>
        </CardHeader>
        <form onSubmit={(e) => handleSaveSettings("Información de la Clínica", e)} id="clinicInfoForm">
            <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                <Label htmlFor="clinicName">Nombre de la Clínica *</Label>
                <Input id="clinicName" name="clinicName" value={settings.clinicName || ""} onChange={handleInputChange} placeholder="Mi Clínica Óptica Principal" disabled={!isAdmin}/>
                </div>
                <div className="space-y-2">
                <Label htmlFor="clinicPhone">Teléfono de Contacto *</Label>
                <Input id="clinicPhone" name="clinicPhone" type="tel" value={settings.clinicPhone || ""} onChange={handleInputChange} placeholder="+506 2233-4455" disabled={!isAdmin}/>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="clinicAddress">Dirección Principal *</Label>
                <Input id="clinicAddress" name="clinicAddress" value={settings.clinicAddress || ""} onChange={handleInputChange} placeholder="Avenida Central, Calle 5, San José, Costa Rica" disabled={!isAdmin}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                <Label htmlFor="clinicEmail">Correo Electrónico Principal *</Label>
                <Input id="clinicEmail" name="clinicEmail" type="email" value={settings.clinicEmail || ""} onChange={handleInputChange} placeholder="contacto@miclinica.com" disabled={!isAdmin}/>
                </div>
                <div className="space-y-2">
                <Label htmlFor="clinicWebsite">Sitio Web (Opcional)</Label>
                <Input id="clinicWebsite" name="clinicWebsite" type="url" value={settings.clinicWebsite || ""} onChange={handleInputChange} placeholder="https://www.miclinica.com" disabled={!isAdmin}/>
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinicLogoUrl">URL del Logo de la Clínica</Label>
               <div className="flex items-center gap-4">
                  <div className="w-24 h-24 border-2 border-dashed rounded-md flex items-center justify-center bg-muted/30 relative">
                     {settings.clinicLogo ? (
                        <NextImage src={settings.clinicLogo} alt="Vista previa del logo" fill className="object-contain p-2" />
                     ) : (
                        <ImageIconLucide className="h-8 w-8 text-muted-foreground" />
                     )}
                  </div>
                   <div className="flex-grow space-y-1">
                      <Input id="clinicLogoUrl" name="clinicLogo" type="url" value={settings.clinicLogo || ""} onChange={handleInputChange} placeholder="https://i.imgur.com/logo.png" disabled={!isAdmin}/>
                      <p className="text-xs text-muted-foreground">Pega la URL de una imagen alojada externamente (ej: Imgur).</p>
                   </div>
               </div>
            </div>
            </CardContent>
            <CardContent className="pt-0 flex justify-end">
                 <SaveButtonWithTooltip sectionName="Información de la Clínica" formId="clinicInfoForm" />
            </CardContent>
        </form>
      </Card>
      
      <Separator/>

      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><Layers className="h-5 w-5 text-primary"/>Gestión de Inventario</CardTitle>
          <CardDescription>Administra las categorías y etiquetas de descuento para tus productos.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-foreground">Categorías de Productos</h4>
                <Button size="sm" variant="outline" onClick={() => { setEditingCategory({ isNew: true, value: '' }); setIsCategoryDialogOpen(true); }} disabled={!isAdmin}><PlusCircle className="mr-2 h-4 w-4"/>Añadir</Button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {categories.map(cat => (
                <div key={cat} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/30">
                  <span>{cat}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingCategory({ isNew: false, value: cat, originalValue: cat }); setIsCategoryDialogOpen(true); }} disabled={!isAdmin}><Edit className="h-4 w-4"/></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleCategoryDelete(cat)} disabled={!isAdmin || cat.toLowerCase() === 'otro'}><Trash2 className="h-4 w-4"/></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border rounded-lg space-y-3">
             <div className="flex justify-between items-center">
                <h4 className="font-semibold text-foreground">Etiquetas de Descuento</h4>
                <Button size="sm" variant="outline" onClick={() => { setEditingTag({ isNew: true, value: { name: '', discountPercentage: 0, badgeClass: 'bg-gray-400' } }); setIsTagDialogOpen(true); }} disabled={!isAdmin}><PlusCircle className="mr-2 h-4 w-4"/>Añadir</Button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {tags.map(tag => (
                <div key={tag.name} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded-full", tag.badgeClass)}></div>
                    <span>{tag.name} ({tag.discountPercentage}%)</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingTag({ isNew: false, value: {...tag}, originalValue: {...tag} }); setIsTagDialogOpen(true); }} disabled={!isAdmin}><Edit className="h-4 w-4"/></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleTagDelete(tag.name)} disabled={!isAdmin || tag.name === 'Ninguna'}><Trash2 className="h-4 w-4"/></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
       <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Configuración de Facturación (CR)
          </CardTitle>
          <CardDescription>
            Datos de tu clínica para la emisión de comprobantes electrónicos en Costa Rica (v4.4).
          </CardDescription>
        </CardHeader>
        <form onSubmit={(e) => handleSaveSettings("Configuración de Facturación", e)} id="billingConfigForm">
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="billingLegalName">Nombre Legal / Razón Social *</Label>
                        <Input id="billingLegalName" name="billingLegalName" value={settings.billingLegalName || ""} onChange={handleInputChange} placeholder="Mi Clínica Óptica Principal S.A." disabled={!isAdmin}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="billingIdType">Tipo de Identificación *</Label>
                        <select id="billingIdType" name="billingIdType" value={settings.billingIdType || "cedula_juridica"} onChange={handleInputChange} className={inputVariantsClassName} disabled={!isAdmin}>
                            <option value="cedula_fisica">Cédula Física</option>
                            <option value="cedula_juridica">Cédula Jurídica</option>
                            <option value="dimex">DIMEX</option>
                            <option value="nite">NITE</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="billingIdNumber">Número de Identificación *</Label>
                        <Input id="billingIdNumber" name="billingIdNumber" value={settings.billingIdNumber || ""} onChange={handleInputChange} placeholder="3-101-000000" disabled={!isAdmin}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="billingTaxRegime">Régimen Tributario *</Label>
                        <select id="billingTaxRegime" name="billingTaxRegime" value={settings.billingTaxRegime || "tradicional"} onChange={handleInputChange} className={inputVariantsClassName} disabled={!isAdmin}>
                            <option value="tradicional">Régimen Tradicional</option>
                            <option value="simplificado">Régimen Simplificado</option>
                        </select>
                    </div>
                </div>
                <Separator />
                <h4 className="font-medium text-foreground">Credenciales de Hacienda</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="haciendaUser">Usuario API Hacienda</Label>
                        <Input id="haciendaUser" name="haciendaUser" value={settings.haciendaUser || ""} onChange={handleInputChange} type="text" placeholder="Usuario para API de Hacienda" disabled={!isAdmin}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="haciendaPassword">Contraseña API Hacienda</Label>
                        <Input id="haciendaPassword" name="haciendaPassword" type="password" value={settings.haciendaPassword || ""} onChange={handleInputChange} placeholder="••••••••" disabled={!isAdmin}/>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label>Llave Criptográfica (.p12) y PIN</Label>
                    <Alert variant="warning">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>¡Atención! Proceso Sensible</AlertTitle>
                        <AlertDescription>
                          La llave criptográfica (.p12) y su PIN son datos altamente sensibles. En un sistema de producción, este proceso involucraría un método de carga segura y almacenamiento encriptado. Esto es una simulación de la interfaz.
                        </AlertDescription>
                    </Alert>
                    <div className="flex items-end gap-3 pt-2">
                        <div className="flex-grow space-y-1">
                            <Label htmlFor="haciendaKeyFile" className="text-xs text-muted-foreground">Archivo de Llave</Label>
                            <Input id="haciendaKeyFile" name="haciendaKeyFileName" value={settings.haciendaKeyFileName || "Ninguna llave cargada."} disabled />
                        </div>
                        <Button type="button" variant="outline" onClick={() => toast({title: "Simulación de Carga Segura", description: "Se abriría un diálogo para cargar el archivo .p12 de forma segura."})} disabled={!isAdmin}>
                            <UploadCloud className="mr-2 h-4 w-4" /> Cargar
                        </Button>
                        <Button type="button" variant="destructive" size="icon" onClick={() => setSettings(prev => ({...prev, haciendaKeyFileName: ""}))} disabled={!isAdmin || !settings.haciendaKeyFileName}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="space-y-1 mt-2">
                        <Label htmlFor="haciendaPin" className="text-xs text-muted-foreground">PIN de la Llave Criptográfica</Label>
                        <Input id="haciendaPin" name="haciendaPin" type="password" value={settings.haciendaPin || ""} onChange={handleInputChange} placeholder="PIN de 4 dígitos" disabled={!isAdmin}/>
                    </div>
                </div>
                <Separator />
                <h4 className="font-medium text-foreground">Notas en Factura</h4>
                 <div className="space-y-2">
                    <Label htmlFor="billingDefaultNotes">Notas Predeterminadas</Label>
                    <Textarea id="billingDefaultNotes" name="billingDefaultNotes" value={settings.billingDefaultNotes || ""} onChange={handleInputChange} rows={3} placeholder="Ej: 'Gracias por su compra. Garantía aplica según términos y condiciones.'" disabled={!isAdmin}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="billingReturnsPolicy">Política de Devoluciones y Garantías</Label>
                    <Textarea id="billingReturnsPolicy" name="billingReturnsPolicy" value={settings.billingReturnsPolicy || ""} onChange={handleInputChange} rows={4} placeholder="Escribe aquí tu política de devoluciones, cambios y garantías..." disabled={!isAdmin}/>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="billingIncludeReturnsPolicy" name="billingIncludeReturnsPolicy" checked={!!settings.billingIncludeReturnsPolicy} onCheckedChange={(checked) => handleSwitchChange('billingIncludeReturnsPolicy', checked)} disabled={!isAdmin}/>
                    <Label htmlFor="billingIncludeReturnsPolicy">Incluir esta política en las facturas</Label>
                </div>
            </CardContent>
            <CardContent className="pt-0 flex justify-end">
                 <SaveButtonWithTooltip sectionName="Configuración de Facturación" formId="billingConfigForm" />
            </CardContent>
        </form>
      </Card>
      
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{editingCategory.isNew ? "Añadir Nueva Categoría" : "Editar Categoría"}</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                  <Label htmlFor="category-name">Nombre de la Categoría</Label>
                  <Input id="category-name" value={editingCategory.value} onChange={(e) => setEditingCategory(prev => ({ ...prev, value: e.target.value }))} />
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCategorySave}>Guardar</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{editingTag.isNew ? "Añadir Nueva Etiqueta" : "Editar Etiqueta"}</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                   <div>
                        <Label htmlFor="tag-name">Nombre Etiqueta</Label>
                        <Input id="tag-name" value={editingTag.value.name} onChange={(e) => setEditingTag(prev => ({...prev, value: {...prev.value, name: e.target.value}}))} disabled={!editingTag.isNew && editingTag.value.name === 'Ninguna'} />
                   </div>
                   <div>
                        <Label htmlFor="tag-percentage">Porcentaje Descuento (%)</Label>
                        <Input id="tag-percentage" type="number" value={editingTag.value.discountPercentage} onChange={(e) => setEditingTag(prev => ({...prev, value: {...prev.value, discountPercentage: Number(e.target.value)}}))} />
                   </div>
                   <div>
                        <Label htmlFor="tag-color">Clase de Color (Tailwind)</Label>
                        <Input id="tag-color" value={editingTag.value.badgeClass} onChange={(e) => setEditingTag(prev => ({...prev, value: {...prev.value, badgeClass: e.target.value}}))} placeholder="Ej: bg-blue-500 hover:bg-blue-600" />
                   </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsTagDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleTagSave}>Guardar Etiqueta</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

    </div>
  );
}
