

import { z } from 'zod';

const baseUserFormSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  email: z.string().email({ message: "Correo electrónico inválido." }),
  role: z.enum(["Admin", "Optómetra", "Asesor"], { required_error: "El rol es requerido." }),
});

const passwordSchema = z.object({
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres." })
    .regex(/[a-z]/, { message: "Debe contener al menos una minúscula." })
    .regex(/[A-Z]/, { message: "Debe contener al menos una mayúscula." })
    .regex(/[0-9]/, { message: "Debe contener al menos un número." })
    .regex(/[^a-zA-Z0-9]/, { message: "Debe contener al menos un carácter especial." }),
  confirmPassword: z.string(),
});

export const createUserFormSchema = baseUserFormSchema.merge(passwordSchema)
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: "custom",
        message: "Las contraseñas no coinciden.",
        path: ['confirmPassword']
      });
    }
});

export const editUserFormSchema = baseUserFormSchema.extend({
    disabledModules: z.array(z.string()).optional(),
}); 

// Schema for a user changing their own password where they don't provide the current one (e.g., from a reset link)
export const changePasswordSchema = passwordSchema.superRefine(({ confirmPassword, newPassword }, ctx) => {
    if (confirmNewPassword !== newPassword) { // Corrected logic to use the right names if they were different
      ctx.addIssue({
        code: "custom",
        message: "Las contraseñas no coinciden.",
        path: ['confirmNewPassword']
      });
    }
});

// Corrected base schema for password change that can be extended
const newPasswordBaseSchema = z.object({
  newPassword: z.string().min(8, { message: "La nueva contraseña debe tener al menos 8 caracteres." })
    .regex(/[a-z]/, { message: "Debe contener al menos una minúscula." })
    .regex(/[A-Z]/, { message: "Debe contener al menos una mayúscula." })
    .regex(/[0-9]/, { message: "Debe contener al menos un número." })
    .regex(/[^a-zA-Z0-9]/, { message: "Debe contener al menos un carácter especial." }),
    confirmNewPassword: z.string(),
});

// Schema for an admin changing another user's password
export const adminChangePasswordSchema = newPasswordBaseSchema
  .superRefine(({ confirmNewPassword, newPassword }, ctx) => {
    if (confirmNewPassword !== newPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Las contraseñas no coinciden.",
        path: ['confirmNewPassword']
      });
    }
  });


// Schema for a user changing their own password by providing the current one
export const clinicAdminPasswordSchema = newPasswordBaseSchema.extend({
    currentPassword: z.string().min(1, "La contraseña actual es requerida."),
}).superRefine(({ confirmNewPassword, newPassword }, ctx) => {
    if (confirmNewPassword !== newPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Las contraseñas no coinciden.",
        path: ['confirmNewPassword']
      });
    }
});


export type CreateUserFormValues = z.infer<typeof createUserFormSchema>;
export type EditUserFormValues = z.infer<typeof editUserFormSchema>;
export type ChangePasswordFormValues = z.infer<typeof adminChangePasswordSchema>; // Use the correct base
export type ClinicAdminPasswordFormValues = z.infer<typeof clinicAdminPasswordSchema>;



