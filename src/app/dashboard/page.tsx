"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Copy,
  Link as LinkIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Edit,
  Trash2,
  QrCode,
  TrendingUp,
  Star,
  Search,
  Filter,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "@/lib/auth-client";

type Session = {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
};

type Url = {
  id: number;
  shortCode: string;
  originalUrl: string;
  customAlias: string | null;
  shortUrl: string;
  expiryDate: string | null;
  createdAt: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [urls, setUrls] = useState<Url[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [fetchingUrls, setFetchingUrls] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const urlsPerPage = 10;

  // Cache for storing fetched pages
  const pageCache = useRef<
    Map<number, { data: Url[]; totalPages: number; totalCount: number }>
  >(new Map());

  const fetchUrls = useCallback(
    async (page: number) => {
      // Check if page is already cached
      if (pageCache.current.has(page)) {
        const cached = pageCache.current.get(page)!;
        setUrls(cached.data);
        setTotalPages(cached.totalPages);
        setTotalCount(cached.totalCount);
        return;
      }

      setFetchingUrls(true);
      try {
        const response = await fetch(
          `/api/urls?page=${page}&limit=${urlsPerPage}`,
          {
            credentials: "include",
          }
        );
        if (response.ok) {
          const data = await response.json();
          // Store in cache
          pageCache.current.set(page, {
            data: data.data,
            totalPages: data.pagination.totalPages,
            totalCount: data.pagination.totalCount,
          });
          setUrls(data.data);
          setTotalPages(data.pagination.totalPages);
          setTotalCount(data.pagination.totalCount);
        }
      } catch (error) {
        console.error("Failed to fetch URLs", error);
      } finally {
        setFetchingUrls(false);
      }
    },
    [urlsPerPage]
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

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (session) {
      fetchUrls(currentPage);
    }
  }, [session, currentPage, fetchUrls]);

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          setSession(null);
          setUrls([]);
          router.push("/");
        },
      },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isUrlActive = (expiryDate: string | null) => {
    if (!expiryDate) return true;
    return new Date(expiryDate) > new Date();
  };

  const clearCacheAndRefresh = () => {
    pageCache.current.clear();
    fetchUrls(currentPage);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getIconForUrl = (url: Url) => {
    // Simple logic to assign icons based on URL content
    if (
      url.originalUrl.includes("marketing") ||
      url.originalUrl.includes("campaign")
    ) {
      return "📢";
    } else if (
      url.originalUrl.includes("wiki") ||
      url.originalUrl.includes("docs")
    ) {
      return "📄";
    } else if (
      url.originalUrl.includes("social") ||
      url.originalUrl.includes("bio")
    ) {
      return "👤";
    } else if (
      url.originalUrl.includes("shop") ||
      url.originalUrl.includes("offer")
    ) {
      return "🎁";
    }
    return "🔗";
  };

  const getTimeSince = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60)
      return `Created ${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
    if (diffHours < 24)
      return `Created ${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    return `Created ${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Calculate stats
  const totalClicks = 1240; // This would come from analytics API
  const topPerforming = urls.length > 0 ? urls[0] : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Links</h1>
            <p className="text-muted-foreground">
              Manage and track your shortened URLs performance.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground hidden sm:block">
              Last updated: Just now
            </p>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Links */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm text-muted-foreground">TOTAL LINKS</div>
                <LinkIcon className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold">{totalCount}</div>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +2
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Clicks */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm text-muted-foreground">
                  TOTAL CLICKS
                </div>
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold">
                  {totalClicks.toLocaleString()}
                </div>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +15%
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm text-muted-foreground">
                  TOP PERFORMING
                </div>
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="text-xl font-bold truncate">
                {topPerforming
                  ? `ox.link/${
                      topPerforming.customAlias || topPerforming.shortCode
                    }`
                  : "N/A"}
              </div>
              <div className="text-sm text-muted-foreground">
                {topPerforming ? "45 clicks in last 24h" : "No data"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, URL, or short link..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <span className="mr-2">Status: Active</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <span className="mr-2">Sort: Date Created</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* URLs List */}
        <div className="space-y-3">
          {fetchingUrls ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading URLs...</p>
            </div>
          ) : urls.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  You haven't created any short URLs yet.
                </p>
                <Link href="/">
                  <Button>Create Your First URL</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            urls.map((url) => {
              const isActive = isUrlActive(url.expiryDate);
              return (
                <Card
                  key={url.id}
                  className="hover:bg-accent/50 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                        {getIconForUrl(url)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-1">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1">
                              {url.customAlias || `Link ${url.id}`}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {url.originalUrl}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Link
                              href={`/analytics/${
                                url.customAlias || url.shortCode
                              }`}
                            >
                              <span className="text-primary font-medium hover:underline">
                                ox.link/{url.customAlias || url.shortCode}
                              </span>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => copyToClipboard(url.shortUrl)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {getTimeSince(url.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={`/analytics/${
                            url.customAlias || url.shortCode
                          }`}
                        >
                          <Button variant="ghost" size="sm">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            <span className="font-semibold">842</span>
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon">
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (() => {
          // Calculate which page numbers to show
          const getPageNumbers = () => {
            const pages: (number | string)[] = [];
            const maxVisible = 5;
            
            if (totalPages <= maxVisible) {
              // Show all pages if total is 5 or less
              for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
              }
            } else {
              // Always show first page
              pages.push(1);
              
              let startPage = Math.max(2, currentPage - 1);
              let endPage = Math.min(totalPages - 1, currentPage + 1);
              
              // Adjust window if we're near the start
              if (currentPage <= 3) {
                endPage = Math.min(4, totalPages - 1);
              }
              
              // Adjust window if we're near the end
              if (currentPage >= totalPages - 2) {
                startPage = Math.max(2, totalPages - 3);
              }
              
              // Add ellipsis after first page if needed
              if (startPage > 2) {
                pages.push("...");
              }
              
              // Add pages in the window
              for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
              }
              
              // Add ellipsis before last page if needed
              if (endPage < totalPages - 1) {
                pages.push("...");
              }
              
              // Always show last page
              pages.push(totalPages);
            }
            
            return pages;
          };
          
          const pageNumbers = getPageNumbers();
          
          return (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {pageNumbers.map((page, index) => {
                if (page === "...") {
                  return (
                    <span key={`ellipsis-${index}`} className="text-muted-foreground px-2">
                      ...
                    </span>
                  );
                }
                
                const pageNum = page as number;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="icon"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
