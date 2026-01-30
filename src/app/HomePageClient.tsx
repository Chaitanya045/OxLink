"use client";

import { UrlShortenerForm } from "@/components/home/UrlShortenerForm";
import { RecentLinks } from "@/components/home/RecentLinks";
import { useHome } from "@/hooks/useHome";
import type { Session } from "@/types/dashboard";

interface HomePageClientProps {
  initialSession: Session | null;
}

export default function HomePageClient({ initialSession }: HomePageClientProps) {
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

  const effectiveSession = sessionLoading ? initialSession : session;

  return (
    <>
      <UrlShortenerForm
        session={effectiveSession}
        onUrlCreated={handleUrlCreated}
        pendingUrlData={pendingUrlData}
        onPendingDataHandled={onPendingDataHandled}
      />

      {effectiveSession && (
        <RecentLinks urls={recentUrls} loading={urlsLoading} onUrlUpdated={onRecentUrlUpdated} />
      )}
    </>
  );
}
