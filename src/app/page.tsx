import { HeroSection } from "@/components/home/HeroSection";
import { Footer } from "@/components/home/Footer";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { headers } = await import("next/headers");
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <HeroSection />

        <div id="url-shortener-form">
          {await import("./HomePageClient").then((m) => (
            <m.default initialSession={session || null} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
