import { useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import { useRecentUrls } from "@/hooks/useRecentUrls";
import { usePendingUrl } from "./usePendingUrl";
import type { Session } from "@/types/dashboard";

interface PendingUrlData {
  originalUrl: string;
  customAlias?: string;
  expiryDate?: string;
}

interface UseHomeReturn {
  session: Session | null;
  sessionLoading: boolean;
  recentUrls: ReturnType<typeof useRecentUrls>["recentUrls"];
  urlsLoading: boolean;
  pendingUrlData: PendingUrlData | null;
  fetchRecentUrls: () => Promise<void>;
  handleUrlCreated: () => void;
  onPendingDataHandled: () => void;
  onRecentUrlUpdated: () => void;
}

export function useHome(): UseHomeReturn {
  const { session, loading: sessionLoading, checkSession } = useSession();
  const { recentUrls, loading: urlsLoading, fetchRecentUrls } = useRecentUrls();
  const { pendingUrlData, clearPendingUrl } = usePendingUrl(
    session as Session | null,
    sessionLoading
  );

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (session) {
      fetchRecentUrls();
    }
  }, [session, fetchRecentUrls]);

  const handleUrlCreated = () => {
    if (session) {
      fetchRecentUrls();
    }
  };

  const onRecentUrlUpdated = () => {
    fetchRecentUrls();
  };

  return {
    session: session as Session | null,
    sessionLoading,
    recentUrls,
    urlsLoading,
    pendingUrlData,
    fetchRecentUrls,
    handleUrlCreated,
    onPendingDataHandled: clearPendingUrl,
    onRecentUrlUpdated,
  };
}
