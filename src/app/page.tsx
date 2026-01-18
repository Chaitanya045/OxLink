"use client";

import { HeroSection } from "@/components/home/HeroSection";
import { UrlShortenerForm } from "@/components/home/UrlShortenerForm";
import { RecentLinks } from "@/components/home/RecentLinks";
import { Footer } from "@/components/home/Footer";
import { useHome } from "@/hooks/useHome";

export default function HomePage() {
  const {
    session,
    sessionLoading,
    recentUrls,
    urlsLoading,
    pendingUrlData,
    handleUrlCreated,
    onPendingDataHandled,
    onRecentUrlUpdated,
  } = useHome();

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />

        {/* URL Shortener Form */}
        <div id="url-shortener-form">
          <UrlShortenerForm
            session={session}
            onUrlCreated={handleUrlCreated}
            pendingUrlData={pendingUrlData}
            onPendingDataHandled={onPendingDataHandled}
          />
        </div>

        {/* Recent Links */}
        {session && <RecentLinks urls={recentUrls} loading={urlsLoading} onUrlUpdated={onRecentUrlUpdated} />}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
