// src/services/auth-service.ts

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

const API_BASE_URL = 'https://us-central1-videre-saas-26178.cloudfunctions.net/api';


export async function login(credentials: LoginFormValues): Promise<LoginResponse> {
    console.log("Attempting login for:", credentials.email);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
        }),
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error("Login failed:", errorData);
        throw new Error("Correo o contraseña incorrectos.");
    }

    const data = await response.json();
    
    // Store the authentication token for future API calls
    if (data.token && typeof window !== 'undefined') {
        localStorage.setItem('authToken', data.token);
    }
    
    console.log("Login successful for:", credentials.email);
    return data;
}

export async function register(formData: RegisterFormValues, plan: string): Promise<LoginResponse> {
    console.log("Attempting registration for:", formData.email);
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            clinicName: formData.clinicName,
            userName: `${formData.firstName} ${formData.lastName}`,
        }),
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error("Registration failed:", errorData);
        
        // Handle common registration errors
        if (response.status === 409) {
            throw new Error("Este correo electrónico ya está registrado.");
        }
        throw new Error("Error en el registro. Por favor intenta de nuevo.");
    }

    const data = await response.json();
    
    // Store the authentication token for future API calls
    if (data.token && typeof window !== 'undefined') {
        localStorage.setItem('authToken', data.token);
    }
    
    console.log("Registration successful for:", formData.email);
    return data;
}

export async function logout(): Promise<void> {
  // Clear the authentication token
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
  
  // Client-side logic in useCurrentUser store will handle clearing other state.
  return Promise.resolve();
}
