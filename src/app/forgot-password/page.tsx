import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { SiteLogo } from "@/components/shared/site-logo";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary/30 p-4">
      <div className="absolute top-8 left-8">
        <SiteLogo />
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
