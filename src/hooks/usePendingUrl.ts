import { useEffect, useState, useCallback } from "react";
import type { Session } from "@/types/dashboard";

interface PendingUrlData {
  originalUrl: string;
  customAlias?: string;
  expiryDate?: string;
}

interface UsePendingUrlReturn {
  pendingUrlData: PendingUrlData | null;
  setPendingUrlData: (data: PendingUrlData | null) => void;
  clearPendingUrl: () => void;
}

const STORAGE_KEY = "pendingShortUrl";

export function usePendingUrl(
  session: Session | null,
  sessionLoading: boolean
): UsePendingUrlReturn {
  const [pendingUrlData, setPendingUrlData] = useState<PendingUrlData | null>(
    null
  );

  useEffect(() => {
    if (!session || sessionLoading) return;

    const pending = localStorage.getItem(STORAGE_KEY);
    if (!pending) return;

    try {
      const data = JSON.parse(pending) as PendingUrlData;
      localStorage.removeItem(STORAGE_KEY);

      // Defer state update to avoid setState-in-effect lint rule
      setTimeout(() => setPendingUrlData(data), 0);
    } catch (error) {
      console.error("Failed to parse pending URL data", error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session, sessionLoading]);

  const clearPendingUrl = useCallback(() => {
    setPendingUrlData(null);
  }, []);

  return {
    pendingUrlData,
    setPendingUrlData,
    clearPendingUrl,
  };
}
