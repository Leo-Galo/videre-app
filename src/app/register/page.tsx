import { Suspense } from "react";
// Importamos el componente sin llaves {}
import RegisterForm from "@/components/auth/register-form";
import { SiteLogo } from "@/components/shared/site-logo";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary/30 p-4 py-12">
      <div className="absolute top-8 left-8">
        <SiteLogo />
      </div>
      <Suspense fallback={<div>Cargando...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
