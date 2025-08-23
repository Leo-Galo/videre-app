// src/hooks/use-current-user.ts
"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import React, { useEffect, useState } from 'react';

interface SessionState {
  isAuthenticated: boolean;
  userName: string;
  userRole: string;
  email: string;
  plan: string;
  status: string;
  isSuperAdmin: boolean;
  actions: {
    setSession: (user: any, subscription?: { plan?: string; status?: string; trialStartDate?: string, trialDurationDays?: number }) => void;
    clearSession: () => void;
  };
}

const initialState: Omit<SessionState, 'actions'> = {
    isAuthenticated: false,
    userName: "Invitado",
    userRole: "Invitado",
    email: "",
    plan: "Básico",
    status: "unknown",
    isSuperAdmin: false,
};

// Create a persistent store that syncs with localStorage
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      ...initialState,
      actions: {
        setSession: (user, subscription) => {
            const plan = subscription?.plan || 'Básico';
            const status = subscription?.status || 'unknown';

            set({
                isAuthenticated: true,
                userName: user.name,
                userRole: user.role,
                email: user.email,
                isSuperAdmin: user.role === 'SuperAdmin',
                plan,
                status,
            });
             if (typeof window !== 'undefined') {
                localStorage.setItem('subscriptionPlan', plan);
                localStorage.setItem('subscriptionStatus', status);

                if (subscription?.trialStartDate && subscription?.trialDurationDays) {
                    localStorage.setItem('trialStartDate', subscription.trialStartDate);
                    localStorage.setItem('trialDurationDays', String(subscription.trialDurationDays));
                }
            }
        },
        clearSession: () => {
            if (typeof window !== 'undefined') {
                // Clear all relevant keys
                const keysToRemove = [
                    'videre-user-session',
                    'subscriptionPlan', 
                    'subscriptionStatus',
                    'trialStartDate',
                    'trialDurationDays',
                    'onboardingCompleted'
                ];
                keysToRemove.forEach(key => localStorage.removeItem(key));
            }
            set({ ...initialState, isAuthenticated: false });
        },
      },
    }),
    {
      name: 'videre-user-session', 
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !['actions'].includes(key))
        ),
    }
  )
);


export const useCurrentUser = () => useSessionStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    userName: state.userName,
    userRole: state.userRole,
    email: state.email,
    plan: state.plan,
    status: state.status,
    isSuperAdmin: state.isSuperAdmin,
}));


export const useSessionActions = () => useSessionStore((state) => state.actions);

// Hook to ensure that we only render components that use the store on the client
// after Zustand has rehydrated its state from localStorage.
// This prevents hydration mismatches.
export function useHasHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Zustand's persist middleware gives us a way to check if rehydration is done.
    if (useSessionStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    
    // Subscribe to onFinishHydration for cases where hydration happens after this effect.
    const unsubFinishHydration = useSessionStore.persist.onFinishHydration(() =>
      setHydrated(true)
    );
    
    return () => {
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
}
