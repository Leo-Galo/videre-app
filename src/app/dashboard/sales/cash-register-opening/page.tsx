
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is now a redirector. The opening logic is in a modal on the main sales page.
export default function OpenCashRegisterRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/sales');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <p className="text-muted-foreground">Redirigiendo a la página de facturación...</p>
        </div>
    );
}

    