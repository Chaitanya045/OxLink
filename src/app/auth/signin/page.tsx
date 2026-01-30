import { AuthLeftPanel } from "@/components/auth/AuthLeftPanel";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex relative">
      <AuthLeftPanel />

      <div className="flex-1 flex items-center justify-center p-8 relative">
        {await import("@/components/auth/LoginForm").then((m) => (
          <m.LoginForm />
        ))}
        <AuthFooter />
      </div>
    </div>
  );
}
