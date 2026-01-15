import { AuthLeftPanel } from "@/components/auth/AuthLeftPanel";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthFooter } from "@/components/auth/AuthFooter";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex relative">
      {/* Left Panel - Branding */}
      <AuthLeftPanel />

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <LoginForm />
        <AuthFooter />
      </div>
    </div>
  );
}
