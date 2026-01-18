"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { DashboardUrlList } from "@/components/dashboard/DashboardUrlList";
import { Pagination } from "@/components/dashboard/Pagination";
import type { Url } from "@/types/dashboard";

export default function DashboardPage() {
  const {
    session,
    loading,
    urls,
    fetchingUrls,
    searchQuery,
    setSearchQuery,
    pagination,
  } = useDashboard();

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
  const totalClicks = urls.reduce((sum, url) => sum + (url.clickCount ?? 0), 0);
  
  // Find top performing URL (highest click count)
  const topPerforming = urls.reduce((top, url) => {
    const urlClicks = url.clickCount ?? 0;
    const topClicks = top?.clickCount ?? 0;
    return urlClicks > topClicks ? url : top;
  }, null as Url | null);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <DashboardHeader />

        <DashboardStats
          totalCount={pagination.totalCount}
          totalClicks={totalClicks}
          topPerforming={topPerforming}
        />

        <DashboardSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <DashboardUrlList urls={urls} fetchingUrls={fetchingUrls} />

        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          pageNumbers={pagination.getPageNumbers()}
          onPageChange={pagination.setCurrentPage}
          onNextPage={pagination.goToNextPage}
          onPreviousPage={pagination.goToPreviousPage}
        />
      </div>
    </div>
  );
}
