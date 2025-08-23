"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArchiveRestore, CheckCircle2, DollarSign, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCashBoxStore } from '@/hooks/use-cash-register-store';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function CashRegisterOpeningPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { cashBoxStatus, openCashBox } = useCashBoxStore();
  const { currentUser } = useCurrentUser();
  
  const [initialCash, setInitialCash] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenBox = () => {
    const amount = parseFloat(initialCash);
    if (isNaN(amount) || amount < 0) {
      toast({ title: "Monto Inválido", description: "Ingrese un monto de apertura válido.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setTimeout(() => { // Simulate API call
      openCashBox();
      // In a real app, you'd save the opening record to the backend here.
      console.log(`Cash box opened by ${currentUser.name} with ¢${amount.toLocaleString('es-CR')}`);
      toast({ title: "Caja Abierta", description: `La sesión de caja ha comenzado con ¢${amount.toLocaleString('es-CR')}.` });
      setIsLoading(false);
      router.push('/dashboard/sales'); // Redirect to sales page after opening
    }, 1000);
  };
  
  if (cashBoxStatus === 'open') {
      return (
        <Card className="shadow-lg rounded-xl text-center">
             <CardHeader>
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-3" />
                <CardTitle className="text-2xl font-headline text-primary">La Caja ya está Abierta</CardTitle>
                <CardDescription>Actualmente hay una sesión de caja activa.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">Puedes proceder a facturar o ir al cierre de caja si has terminado el turno.</p>
                <div className="flex gap-4 justify-center">
                    <Button asChild>
                        <Link href="/dashboard/sales">Ir a Facturación</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/closures/daily">Ir a Cierre de Caja</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
      );
  }

  return (
    <div className="space-y-6 flex justify-center items-center min-h-[50vh]">
      <Card className="shadow-lg rounded-xl w-full max-w-md">
        <CardHeader className="text-center">
          <ArchiveRestore className="mx-auto h-10 w-10 text-primary mb-3" />
          <CardTitle className="text-2xl font-headline text-primary">Apertura de Caja</CardTitle>
          <CardDescription>
            Ingresa el monto inicial en efectivo para comenzar una nueva sesión de ventas para el usuario: <strong>{currentUser.name}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <Label htmlFor="initialCash" className="text-base">Monto Inicial en Efectivo (¢)</Label>
                <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="initialCash"
                        type="number"
                        className="pl-9 text-lg"
                        placeholder="Ej: 50000"
                        value={initialCash}
                        onChange={(e) => setInitialCash(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>
            <Alert variant="default">
                <AlertTitle>Confirmación</AlertTitle>
                <AlertDescription>
                    Este monto será la base para el próximo cierre de caja. Asegúrate de que el conteo sea correcto.
                </AlertDescription>
            </Alert>
        </CardContent>
         <CardFooter>
            <Button onClick={handleOpenBox} disabled={isLoading || !initialCash} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Confirmar y Abrir Caja
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
