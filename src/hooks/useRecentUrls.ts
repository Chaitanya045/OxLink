import { useState, useCallback } from "react";
import type { Url } from "@/types/dashboard";

export function useRecentUrls() {
  const [recentUrls, setRecentUrls] = useState<Url[]>([]);
  const [totalUrlCount, setTotalUrlCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchRecentUrls = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/urls?page=1&limit=3&sortBy=date&sortOrder=desc", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setRecentUrls(data.data);
        setTotalUrlCount(data.pagination.totalCount);
      }
    } catch (error) {
      console.error("Failed to fetch recent URLs", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    recentUrls,
    totalUrlCount,
    loading,
    fetchRecentUrls,
  };
}
