import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { UrlClick, UrlInfo } from "@/types/analytics";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ short_code: string }>;
}) {
  const hdrs = await headers();

  const session = await auth.api.getSession({ headers: hdrs });

  if (!session) {
    redirect("/auth/signin");
  }

  const { short_code } = await params;

  const origin = `${hdrs.get("x-forwarded-proto") ?? "http"}://${hdrs.get("host") ?? "localhost:3000"}`;

  const res = await fetch(`${origin}/oxlink/api/urls/${short_code}/analytics`, {
    headers: {
      cookie: hdrs.get("cookie") ?? "",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 404) {
      redirect("/dashboard");
    }
  }

  const data = (await res.json().catch(() => null)) as
    | { urlClicksData?: UrlClick[]; urlInfo?: UrlInfo }
    | null;

  const initialClicks = data?.urlClicksData ?? [];
  const initialUrlInfo = data?.urlInfo ?? null;

  return await import("@/components/analytics/AnalyticsShell").then((m) => (
    <m.default
      shortCode={short_code}
      initialClicks={initialClicks}
      initialUrlInfo={initialUrlInfo}
    />
  ));
}
