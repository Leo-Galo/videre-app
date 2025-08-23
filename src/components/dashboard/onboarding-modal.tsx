"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Rocket, Settings, PackagePlus, UserPlus, Store } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicName: string;
}

const onboardingSteps = [
  { 
    title: "1. Configura los Datos de tu Clínica", 
    description: "Personaliza la información básica y de facturación.",
    href: "/dashboard/settings",
    icon: <Settings className="h-5 w-5 text-primary" />
  },
  { 
    title: "2. Añade tus Primeros Productos", 
    description: "Comienza a poblar tu inventario de armazones, lentes, etc.",
    href: "/dashboard/inventory/new",
    icon: <PackagePlus className="h-5 w-5 text-primary" />
  },
  { 
    title: "3. Registra tus Primeros Pacientes", 
    description: "Crea los perfiles de tus pacientes para un seguimiento óptimo.",
    href: "/dashboard/patients/new",
    icon: <UserPlus className="h-5 w-5 text-primary" />
  },
  { 
    title: "4. Explora el Punto de Venta", 
    description: "Familiarízate con el proceso de ventas y facturación.",
    href: "/dashboard/sales",
    icon: <Store className="h-5 w-5 text-primary" />
  },
];

export function OnboardingModal({ isOpen, onClose, clinicName }: OnboardingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg md:max-w-xl">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Rocket className="h-10 w-10 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-headline">
            ¡Bienvenido a Videre, {clinicName}!
          </DialogTitle>
          <DialogDescription className="text-md text-foreground/80 px-4">
            Estamos emocionados de tenerte. Aquí tienes algunos pasos recomendados para configurar tu óptica y empezar a aprovechar al máximo la plataforma.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4 max-h-[50vh] overflow-y-auto px-2">
          {onboardingSteps.map((step, index) => (
            <Link 
              href={step.href} 
              key={index}
              onClick={onClose} // Close modal when a step is clicked
              className="block p-4 border rounded-lg hover:bg-muted/50 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                {step.icon}
                <div>
                  <h4 className="font-semibold text-foreground group-hover:text-primary">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>

        <DialogFooter className="sm:justify-center pt-4">
          <Button onClick={onClose} size="lg" className="w-full sm:w-auto">
            ¡Entendido, a Explorar!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
