
"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ClinicUser, UserRole } from '@/types/user';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserFormSchema, editUserFormSchema, type CreateUserFormValues, type EditUserFormValues } from '@/types/user-schema';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

interface UserFormProps {
  user?: ClinicUser; 
  onSuccess: (data: CreateUserFormValues | EditUserFormValues) => void;
  isLoading?: boolean;
}

const userRoles: UserRole[] = ["Admin", "Optómetra", "Asesor"];

const mainModules = [
  { id: '/dashboard/sales', label: 'Facturación' },
  { id: '/dashboard/inventory', label: 'Inventario' },
  { id: 'clinical_area', label: 'Área Clínica (Pacientes, Citas, Historial)', subModules: ['/dashboard/patients', '/dashboard/appointments', '/dashboard/clinical-history'] },
  { id: '/dashboard/reports', label: 'Reportes' },
  { id: '/dashboard/suppliers', label: 'Proveedores' },
  { id: '/dashboard/expenses', label: 'Control de Gastos (Premium)' },
];

const RoleDescription = () => (
    <div className="text-xs text-muted-foreground mt-2 space-y-1">
        <p><strong>Admin:</strong> Acceso total, incluyendo configuración, finanzas y gestión de usuarios.</p>
        <p><strong>Optómetra:</strong> Enfocado en pacientes, historial clínico y citas. Sin acceso a finanzas o configuración crítica.</p>
        <p><strong>Asesor:</strong> Acceso al punto de venta, inventario y gestión de citas. Vista limitada de la información clínica.</p>
    </div>
);


export function UserForm({ user, onSuccess, isLoading: initialIsLoading = false }: UserFormProps) {
  const router = useRouter();
  const [isLoadingForm, setIsLoadingForm] = useState(initialIsLoading);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isEditing = !!user;

  const formSchema = isEditing ? editUserFormSchema : createUserFormSchema;

  const form = useForm<CreateUserFormValues | EditUserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditing
      ? { name: user.name, email: user.email, role: user.role, disabledModules: user.disabledModules || [] }
      : { name: "", email: "", role: "Asesor", password: "", confirmPassword: "", disabledModules: [] },
  });

  async function onSubmit(data: CreateUserFormValues | EditUserFormValues) {
    setIsLoadingForm(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    onSuccess(data);
    setIsLoadingForm(false);
  }
  
  const passwordRequirements = [
    "Al menos 8 caracteres",
    "Una letra mayúscula",
    "Una letra minúscula",
    "Un número",
    "Un carácter especial (!@#$%^&*()_+-=[]{};':\"|,.<>/?).",
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo *</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Juan Pérez" {...field} disabled={isLoadingForm} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico (será el usuario) *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="juan.perez@example.com" {...field} disabled={isLoadingForm || isEditing} />
              </FormControl>
              {isEditing && <FormDescription className="text-xs">El correo no se puede cambiar una vez creado.</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol del Usuario *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingForm}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un rol" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {userRoles.map(roleValue => (
                    <SelectItem key={roleValue} value={roleValue}>{roleValue}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <RoleDescription /> 
              <FormMessage />
            </FormItem>
          )}
        />
        
        {isEditing && (
            <div className="space-y-4">
                <Separator />
                <div>
                    <h3 className="text-lg font-medium text-primary flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        Permisos de Módulos
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Habilita o deshabilita el acceso a módulos específicos para este usuario.
                    </p>
                </div>
                 <FormField
                    control={form.control}
                    name="disabledModules"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        {mainModules.map((module) => {
                            const allSubmodules = module.subModules || [module.id];
                            const isDisabled = allSubmodules.every(sub => field.value?.includes(sub));
                            return (
                            <div key={module.id} className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel>{module.label}</FormLabel>
                                </div>
                                <FormControl>
                                <Switch
                                    checked={!isDisabled}
                                    onCheckedChange={(checked) => {
                                        const currentDisabled = field.value || [];
                                        let newDisabled: string[];
                                        if (checked) {
                                            // Enable module: remove its key(s) from disabled list
                                            newDisabled = currentDisabled.filter(
                                            (disabledId) => !allSubmodules.includes(disabledId)
                                            );
                                        } else {
                                            // Disable module: add its key(s) to disabled list
                                            newDisabled = [...new Set([...currentDisabled, ...allSubmodules])];
                                        }
                                        field.onChange(newDisabled);
                                    }}
                                />
                                </FormControl>
                            </div>
                            )
                        })}
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        )}

        {!isEditing && (
          <>
            <Separator />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} disabled={isLoadingForm} />
                       <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5 mt-1">
                      {passwordRequirements.map(req => <li key={req}>{req}</li>)}
                  </ul>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Contraseña *</FormLabel>
                  <FormControl>
                     <div className="relative">
                      <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} disabled={isLoadingForm} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoadingForm}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoadingForm}>
            {isLoadingForm && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Actualizar Usuario" : "Crear Usuario"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
