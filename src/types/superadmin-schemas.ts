
import { z } from 'zod';

// --- Blog Post Schema ---
export const blogPostFormSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  slug: z.string().min(3, "El slug debe tener al menos 3 caracteres.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido (solo minúsculas, números y guiones)."),
  author: z.string().min(2, "El autor es requerido."),
  content: z.string().min(50, "El contenido debe tener al menos 50 caracteres."),
  image: z.string().url({ message: "Debe ser una URL válida." }).optional().or(z.literal('')),
  dataAiHint: z.string().max(50, "Máximo 50 caracteres.").optional(),
  tagsInput: z.string().optional(),
  status: z.enum(['Draft', 'Published', 'Archived'], { required_error: "El estado es requerido." }),
});
export type BlogPostFormValues = z.infer<typeof blogPostFormSchema>;


// --- Clinic Schema ---
const clinicPlans = ["Basic", "Pro", "Premium"] as const;
const clinicStatuses = ["Active", "Suspended", "Trialing", "Expired", "Cancelled"] as const;

export const editClinicFormSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  plan: z.enum(clinicPlans, { required_error: "Debe seleccionar un plan." }),
  status: z.enum(clinicStatuses, { required_error: "Debe seleccionar un estado." }),
  adminEmail: z.string().email("Formato de correo inválido.").optional(),
  nextBillingDate: z.date().optional(),
  trialEndDate: z.date().optional(),
});
export type EditClinicFormValues = z.infer<typeof editClinicFormSchema>;


// --- Testimonial Schema ---
export const testimonialFormSchema = z.object({
  name: z.string().min(2, "El nombre es requerido."),
  title: z.string().min(2, "El título/cargo es requerido."),
  quote: z.string().min(10, "La cita debe tener al menos 10 caracteres.").max(500, "Máximo 500 caracteres."),
  initials: z.string().min(1, "Las iniciales son requeridas.").max(3, "Máximo 3 caracteres para iniciales."),
});
export type TestimonialFormValues = z.infer<typeof testimonialFormSchema>;

// --- Global Settings Schema ---
export const globalSettingsSchema = z.object({
  platformName: z.string().min(2, "El nombre de la plataforma es requerido."),
  defaultLogoUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
  defaultPrimaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Debe ser un código hexadecimal válido.").optional().or(z.literal('')),
  heroImageUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
  aboutPageImageUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
  adminNotificationEmail: z.string().email("Correo inválido.").optional().or(z.literal('')),
  defaultSenderEmail: z.string().email("Correo inválido.").optional().or(z.literal('')),
  welcomeEmailTemplate: z.string().optional(),
  basicPlanPrice: z.coerce.number().positive("El precio debe ser positivo.").optional(),
  proPlanPrice: z.coerce.number().positive("El precio debe ser positivo.").optional(),
  premiumPlanPrice: z.coerce.number().positive("El precio debe ser positivo.").optional(),
  annualDiscount: z.coerce.number().min(0).max(100, "El descuento debe estar entre 0 y 100.").optional(),
  paypalClientId: z.string().optional(),
  paypalClientSecret: z.string().optional(),
  haciendaApiUser: z.string().optional(),
  haciendaApiKey: z.string().optional(),
  smsGatewayApiKey: z.string().optional(),
  enableManualSubscriptionPayments: z.boolean().default(false),
  manualPaymentInstructions: z.string().optional(),
  socialInstagramUrl: z.string().url("URL inválida.").optional().or(z.literal('')),
  socialFacebookUrl: z.string().url("URL inválida.").optional().or(z.literal('')),
  socialYoutubeUrl: z.string().url("URL inválida.").optional().or(z.literal('')),
  force2FA: z.boolean().default(false),
  dataRetentionDays: z.coerce.number().int().min(30, "La retención debe ser de al menos 30 días.").optional(),
});
export type GlobalSettingsFormValues = z.infer<typeof globalSettingsSchema>;

// --- SuperAdmin Password Schema ---
export const superAdminPasswordSchema = z.object({
    currentPassword: z.string().min(1, { message: "La contraseña actual es requerida." }),
    newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
    confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmNewPassword"],
});
export type SuperAdminPasswordFormValues = z.infer<typeof superAdminPasswordSchema>;
