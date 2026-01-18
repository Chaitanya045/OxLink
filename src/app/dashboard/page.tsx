"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { DashboardUrlList } from "@/components/dashboard/DashboardUrlList";
import { Pagination } from "@/components/dashboard/Pagination";

export default function DashboardPage() {
  const {
    session,
    loading,
    urls,
    fetchingUrls,
    searchQuery,
    setSearchQuery,
    pagination,
    lastUpdated,
    stats,
    clearCacheAndRefresh,
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <DashboardHeader lastUpdated={lastUpdated} />

        <DashboardStats
          totalCount={pagination.totalCount}
          totalClicks={stats.totalClicks}
          topPerforming={stats.topPerforming}
        />

        <DashboardSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <DashboardUrlList 
          urls={urls} 
          fetchingUrls={fetchingUrls}
          onUrlUpdated={clearCacheAndRefresh}
        />

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
