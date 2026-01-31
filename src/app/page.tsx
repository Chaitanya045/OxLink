import { HeroSection } from "@/components/home/HeroSection";
import { Footer } from "@/components/home/Footer";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { Url } from "@/types/dashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const hdrs = await headers();
  const session = await auth.api.getSession({
    headers: hdrs,
  });

  let recentUrls: Url[] = [];

  if (session) {
    const origin = `${hdrs.get("x-forwarded-proto") ?? "http"}://${hdrs.get("host") ?? "localhost:3000"}`;

    const res = await fetch(
      `${origin}/api/urls?page=1&limit=3&sortBy=date&sortOrder=desc`,
      {
        headers: {
          cookie: hdrs.get("cookie") ?? "",
        },
        cache: "no-store",
      }
    );

    if (res.ok) {
      const data = (await res.json().catch(() => null)) as { data?: Url[] } | null;
      recentUrls = data?.data ?? [];
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <HeroSection />

        <div id="url-shortener-form">
          {await import("./HomePageClient").then((m) => (
            <m.default initialSession={session || null} />
          ))}
        </div>

        {session &&
          (await import("@/components/home/RecentLinksRSC").then((m) => (
            <m.RecentLinksRSC urls={recentUrls} />
          )))}
      </main>

      <Footer />
    </div>
  );
}
