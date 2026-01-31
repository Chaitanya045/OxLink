import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth/signin");
  }

  const DashboardShell = await import("@/components/dashboard/DashboardShell").then(
    (m) => m.DashboardShell
  );

  return <DashboardShell />;
}
