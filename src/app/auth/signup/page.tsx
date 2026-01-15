import { AuthLeftPanel } from "@/components/auth/AuthLeftPanel";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { AuthFooter } from "@/components/auth/AuthFooter";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex relative">
      {/* Left Panel - Branding */}
      <AuthLeftPanel />

      {/* Right Panel - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <SignUpForm />
        <AuthFooter />
      </div>
    </div>
  );
}
