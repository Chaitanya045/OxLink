import { HeroSection } from "@/components/home/HeroSection";
import { Footer } from "@/components/home/Footer";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { urls, urlClicks } from "@/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { headers } from "next/headers";
import type { Url } from "@/types/dashboard";

async function getRecentUrlsForUser(userId: string): Promise<Url[]> {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );

  const rows = await db
    .select()
    .from(urls)
    .where(and(eq(urls.createdBy, userId), eq(urls.isLatest, true)))
    .orderBy(desc(urls.createdAt))
    .limit(3);

  const clickCounts = new Map<number, number>();

  if (rows.length) {
    const counts = await db
      .select({
        urlId: urlClicks.urlId,
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(urlClicks)
      .where(inArray(urlClicks.urlId, rows.map((r) => r.id)))
      .groupBy(urlClicks.urlId);

    counts.forEach((c) => {
      clickCounts.set(c.urlId, Number(c.count));
    });
  }

  return rows.map((u) => ({
    id: u.id,
    shortCode: u.shortCode,
    originalUrl: u.originalUrl,
    customAlias: u.customAlias ?? null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt?.toISOString(),
    expiryDate: u.expiryDate?.toISOString() ?? null,
    shortUrl: `${baseUrl}/${u.customAlias || u.shortCode}`,
    clickCount: clickCounts.get(u.id) ?? 0,
  }));
}

export default async function HomePage() {
  const hdrs = await headers();

  const session = await auth.api.getSession({ headers: hdrs });

  const recentUrls = session ? await getRecentUrlsForUser(session.user.id) : [];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 overflow-x-hidden">
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
