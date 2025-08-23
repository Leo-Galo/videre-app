// src/services/auth-service.ts
'use server';

import type { RegisterFormValues, LoginFormValues } from '@/types/auth-schemas';
import type { ClinicUser } from '@/types/user';

interface LoginResponse {
  user: ClinicUser;
  token: string;
  subscription?: {
    plan?: string;
    status?: string;
    trialStartDate?: string;
    trialDurationDays?: number;
  };
}

// Habilitando un usuario temporal para revisión
const mockUsers: Record<string, LoginResponse> = {
    'admin@videre.cr': {
        user: {
            id: 'user-admin-01',
            name: 'Admin Videre',
            email: 'admin@videre.cr',
            role: 'Admin',
            status: 'Active',
            createdAt: new Date().toISOString(),
        },
        token: `mock-token-admin-${Date.now()}`,
        subscription: {
            plan: 'Premium',
            status: 'active',
        }
    }
};


export async function login(credentials: LoginFormValues): Promise<LoginResponse> {
    console.log("Attempting mock login for:", credentials.email);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // NOTE: The password is not checked in this mock implementation.
            const userData = mockUsers[credentials.email];
            if (userData) {
                console.log("Mock login successful for:", credentials.email);
                resolve(userData);
            } else {
                console.log("Mock login failed for:", credentials.email);
                reject(new Error("Correo o contraseña incorrectos."));
            }
        }, 500);
    });
}

export async function register(formData: RegisterFormValues, plan: string): Promise<LoginResponse> {
     console.log("Attempting mock registration for:", formData.email);
    return new Promise((resolve, reject) => {
         setTimeout(() => {
            if (mockUsers[formData.email]) {
                reject(new Error("Este correo electrónico ya está registrado."));
                return;
            }
            const newUser: ClinicUser = {
                id: `user-${Date.now()}`,
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                role: 'Admin',
                status: 'Active',
                createdAt: new Date().toISOString(),
            };
            const subscription = {
                plan: plan || 'Premium',
                status: 'trialing',
                trialStartDate: new Date().toISOString(),
                trialDurationDays: 3,
            }
            const newLoginResponse: LoginResponse = {
                user: newUser,
                token: `mock-token-${Date.now()}`,
                subscription
            };
            // Add to mock users so they can log in next time
            mockUsers[formData.email] = newLoginResponse;
            console.log("Mock registration successful:", newUser);
            resolve(newLoginResponse);
        }, 500);
    });
}

export async function logout(): Promise<void> {
  // Client-side logic in useCurrentUser store will handle clearing state.
  return Promise.resolve();
}
