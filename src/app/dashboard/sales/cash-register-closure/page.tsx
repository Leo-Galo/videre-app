"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is now a redirector to the new closures module.
export default function CashRegisterClosureRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/closures/daily');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <p className="text-muted-foreground">Redirigiendo a la nueva sección de cierres...</p>
        </div>
    );
}
