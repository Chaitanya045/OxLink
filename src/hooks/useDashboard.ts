import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Url, Session } from "@/types/dashboard";
import { usePagination } from "./usePagination";

interface DashboardStats {
  totalClicks: number;
  topPerforming: Url | null;
}

interface UseDashboardReturn {
  session: Session | null;
  loading: boolean;
  urls: Url[];
  fetchingUrls: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  pagination: ReturnType<typeof usePagination>;
  checkSession: () => Promise<void>;
  fetchUrls: (page: number) => Promise<void>;
  clearCacheAndRefresh: () => void;
  lastUpdated: Date | null;
  stats: DashboardStats;
}

const URLS_PER_PAGE = 10;

export function useDashboard(): UseDashboardReturn {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [urls, setUrls] = useState<Url[]>([]);
  const [fetchingUrls, setFetchingUrls] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalClicks: 0,
    topPerforming: null,
  });

  const pagination = usePagination({ itemsPerPage: URLS_PER_PAGE });
  const { setPaginationData, currentPage } = pagination;

  const pageCache = useRef<
    Map<number, { data: Url[]; totalPages: number; totalCount: number }>
  >(new Map());

  const fetchUrls = useCallback(
    async (page: number, silent = false) => {
      if (pageCache.current.has(page) && !silent) {
        const cached = pageCache.current.get(page)!;
        setUrls(cached.data);
        setPaginationData({
          page: page,
          limit: URLS_PER_PAGE,
          totalCount: cached.totalCount,
          totalPages: cached.totalPages,
        });
        return;
      }

      // Skip loading state for silent/background refreshes
      if (!silent) {
        setFetchingUrls(true);
      }
      try {
        const response = await fetch(
          `/api/urls?page=${page}&limit=${URLS_PER_PAGE}`,
          {
            credentials: "include",
          }
        );
        if (response.ok) {
          const data = await response.json();
          pageCache.current.set(page, {
            data: data.data,
            totalPages: data.pagination.totalPages,
            totalCount: data.pagination.totalCount,
          });
          setUrls(data.data);
          setPaginationData(data.pagination);
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error("Failed to fetch URLs", error);
      } finally {
        if (!silent) {
          setFetchingUrls(false);
        }
      }
    },
    [setPaginationData]
  );

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "include",
      });

      if (response.ok) {
        const data: Session = await response.json();
        setSession(data);
      } else {
        setSession(null);
        router.push("/auth/signin");
      }
    } catch {
      setSession(null);
      router.push("/auth/signin");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/urls/stats", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalClicks: data.totalClicks || 0,
          topPerforming: data.topPerforming || null,
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  }, []);

  const clearCacheAndRefresh = useCallback(() => {
    pageCache.current.clear();
    fetchUrls(currentPage);
  }, [fetchUrls, currentPage]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (session) {
      fetchUrls(currentPage);
      fetchStats();
    }
  }, [session, currentPage, fetchUrls, fetchStats]);

  // Polling interval (30 seconds) - silent refresh
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      pageCache.current.clear();
      fetchUrls(currentPage, true); // silent = true
      fetchStats(); // Also refresh stats silently
    }, 30000);

    return () => clearInterval(interval);
  }, [session, currentPage, fetchUrls, fetchStats]);

  return {
    session,
    loading,
    urls,
    fetchingUrls,
    searchQuery,
    setSearchQuery,
    pagination,
    checkSession,
    fetchUrls,
    clearCacheAndRefresh,
    lastUpdated,
    stats,
  };
}
