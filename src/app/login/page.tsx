import { LoginForm } from "@/components/auth/login-form";
import { SiteLogo } from "@/components/shared/site-logo";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary/30 p-4">
      <div className="absolute top-8 left-8">
        <SiteLogo />
      </div>
      <LoginForm />
    </div>
  );
}
