
import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z.string().email({ message: "Dirección de correo inválida." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }), // Simple validation for login
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z.object({
  clinicName: z.string().min(2, { message: "El nombre de la clínica debe tener al menos 2 caracteres." }),
  firstName: z.string().min(2, { message: "Tu nombre es requerido." }),
  lastName: z.string().min(2, { message: "Tus apellidos son requeridos." }),
  email: z.string().email({ message: "Dirección de correo inválida." }),
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres." })
    .regex(/[a-z]/, { message: "Debe contener al menos una letra minúscula." })
    .regex(/[A-Z]/, { message: "Debe contener al menos una letra mayúscula." })
    .regex(/[0-9]/, { message: "Debe contener al menos un número." })
    .regex(/[^a-zA-Z0-9]/, { message: "Debe contener al menos un carácter especial." }),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, { message: "Debes aceptar los términos y condiciones." }),
  referrerId: z.string().optional(), // New field to hold the userId from URL
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Dirección de correo inválida." }),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
