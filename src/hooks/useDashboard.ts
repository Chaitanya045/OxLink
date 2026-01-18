import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Url, Session, StatusFilter, SortBy, SortOrder } from "@/types/dashboard";
import { usePagination } from "./usePagination";
import { useDebounce } from "./useDebounce";

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
  isSearching: boolean;
  statusFilter: StatusFilter;
  setStatusFilter: (status: StatusFilter) => void;
  sortBy: SortBy;
  setSortBy: (sortBy: SortBy) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  pagination: ReturnType<typeof usePagination>;
  checkSession: () => Promise<void>;
  fetchUrls: (page: number, search?: string, status?: StatusFilter, sortBy?: SortBy, sortOrder?: SortOrder, silent?: boolean) => Promise<void>;
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalClicks: 0,
    topPerforming: null,
  });

  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Track if we're waiting for search to debounce
  const isSearching = searchQuery !== debouncedSearchQuery;

  const pagination = usePagination({ itemsPerPage: URLS_PER_PAGE });
  const { setPaginationData, currentPage, setCurrentPage } = pagination;

  const pageCache = useRef<
    Map<number, { data: Url[]; totalPages: number; totalCount: number }>
  >(new Map());

  const fetchUrls = useCallback(
    async (
      page: number, 
      search: string = "", 
      status: StatusFilter = "all", 
      sort: SortBy = "date", 
      order: SortOrder = "desc", 
      silent = false
    ) => {
      // Don't use cache when searching, filtering, or using non-default sort
      const isDefaultSort = sort === "date" && order === "desc";
      const shouldUseCache = !search && status === "all" && isDefaultSort;
      
      if (shouldUseCache && pageCache.current.has(page) && !silent) {
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
        const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
        const statusParam = status !== "all" ? `&status=${encodeURIComponent(status)}` : "";
        const sortParam = `&sortBy=${encodeURIComponent(sort)}&sortOrder=${encodeURIComponent(order)}`;
        const response = await fetch(
          `/api/urls?page=${page}&limit=${URLS_PER_PAGE}${searchParam}${statusParam}${sortParam}`,
          {
            credentials: "include",
          }
        );
        if (response.ok) {
          const data = await response.json();
          // Only cache default sort, non-search, non-filtered results
          if (shouldUseCache) {
            pageCache.current.set(page, {
              data: data.data,
              totalPages: data.pagination.totalPages,
              totalCount: data.pagination.totalCount,
            });
          }
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
    fetchUrls(currentPage, debouncedSearchQuery, statusFilter, sortBy, sortOrder);
    fetchStats();
  }, [fetchUrls, fetchStats, currentPage, debouncedSearchQuery, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Track previous debounced search to detect changes
  const prevDebouncedSearchRef = useRef<string>("");
  // Track previous status filter to detect changes
  const prevStatusFilterRef = useRef<StatusFilter>("all");
  // Track previous sort settings to detect changes
  const prevSortByRef = useRef<SortBy>("date");
  const prevSortOrderRef = useRef<SortOrder>("desc");
  // Track previous page to detect page-only changes
  const prevPageRef = useRef<number>(1);
  // Track if initial stats have been fetched
  const initialStatsFetchedRef = useRef<boolean>(false);
  // Track if we're fetching due to a filter/sort/page change (for silent updates)
  const isSilentFetchRef = useRef<boolean>(false);

  // Handle search changes, status filter changes, sort changes, and page changes
  useEffect(() => {
    if (!session) return;

    const searchChanged = prevDebouncedSearchRef.current !== debouncedSearchQuery;
    const statusChanged = prevStatusFilterRef.current !== statusFilter;
    const sortByChanged = prevSortByRef.current !== sortBy;
    const sortOrderChanged = prevSortOrderRef.current !== sortOrder;
    const pageChanged = prevPageRef.current !== currentPage;
    const needsInitialStatsFetch = !initialStatsFetchedRef.current;
    
    // If search, status, or sort changed, reset to page 1 and clear cache
    if (searchChanged || statusChanged || sortByChanged || sortOrderChanged) {
      if (searchChanged) {
        prevDebouncedSearchRef.current = debouncedSearchQuery;
        isSilentFetchRef.current = false; // Reset flag on search change
      }
      if (statusChanged) {
        prevStatusFilterRef.current = statusFilter;
        isSilentFetchRef.current = true; // Mark for silent fetch
      }
      if (sortByChanged) {
        prevSortByRef.current = sortBy;
        isSilentFetchRef.current = true; // Mark for silent fetch
      }
      if (sortOrderChanged) {
        prevSortOrderRef.current = sortOrder;
        isSilentFetchRef.current = true; // Mark for silent fetch
      }
      pageCache.current.clear();
      if (currentPage !== 1) {
        setCurrentPage(1);
        return; // Will trigger another effect when page changes
      }
    }

    // If only page changed (not search/status/sort), mark for silent fetch
    if (pageChanged && !searchChanged && !statusChanged && !sortByChanged && !sortOrderChanged) {
      prevPageRef.current = currentPage;
      isSilentFetchRef.current = true; // Mark for silent fetch on page change
    } else if (pageChanged) {
      prevPageRef.current = currentPage;
    }

    // Fetch URLs with current search, status, sort, and page
    // Fetch silently if this is a filter/sort/page change (not initial load or search change)
    const shouldFetchSilently = isSilentFetchRef.current && !needsInitialStatsFetch && !searchChanged;
    fetchUrls(currentPage, debouncedSearchQuery, statusFilter, sortBy, sortOrder, shouldFetchSilently);
    
    // Reset the silent fetch flag after fetching
    if (isSilentFetchRef.current) {
      isSilentFetchRef.current = false;
    }
    
    // Fetch stats on initial load OR when search changes
    if (needsInitialStatsFetch || searchChanged) {
      initialStatsFetchedRef.current = true;
      fetchStats();
    }
  }, [session, debouncedSearchQuery, statusFilter, sortBy, sortOrder, currentPage, fetchUrls, fetchStats, setCurrentPage]);

  // Polling interval (30 seconds) - silent refresh
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      pageCache.current.clear();
      fetchUrls(currentPage, debouncedSearchQuery, statusFilter, sortBy, sortOrder, true); // silent = true
      fetchStats(); // Also refresh stats silently
    }, 30000);

    return () => clearInterval(interval);
  }, [session, currentPage, debouncedSearchQuery, statusFilter, sortBy, sortOrder, fetchUrls, fetchStats]);

  return {
    session,
    loading,
    urls,
    fetchingUrls,
    searchQuery,
    setSearchQuery,
    isSearching,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    pagination,
    checkSession,
    fetchUrls,
    clearCacheAndRefresh,
    lastUpdated,
    stats,
  };
}
