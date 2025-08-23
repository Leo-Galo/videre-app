"use client";

import { Toaster } from "@/components/ui/toaster";

/**
 * Este componente envuelve todos los componentes globales del lado del cliente
 * que necesitan estar disponibles en cada página.
 */
export function GlobalClientComponents() {
  return (
    <>
      <Toaster />
    </>
  );
}
