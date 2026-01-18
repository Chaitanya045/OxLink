"use client";

import { useState } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { DashboardUrlList } from "@/components/dashboard/DashboardUrlList";
import { Pagination } from "@/components/dashboard/Pagination";
import { CreateUrlModal } from "@/components/dashboard/CreateUrlModal";

export default function DashboardPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [prefilledAlias, setPrefilledAlias] = useState("");

  const {
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
    lastUpdated,
    stats,
    clearCacheAndRefresh,
  } = useDashboard();

  const handleCreateWithAlias = (alias: string) => {
    setPrefilledAlias(alias);
    setCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    clearCacheAndRefresh();
    setCreateModalOpen(false);
    setPrefilledAlias("");
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <DashboardHeader lastUpdated={lastUpdated} />

        <DashboardStats
          totalCount={pagination.totalCount}
          totalClicks={stats.totalClicks}
          topPerforming={stats.topPerforming}
        />

        <DashboardSearch 
          searchQuery={searchQuery} 
          onSearchChange={setSearchQuery}
          isSearching={isSearching || fetchingUrls}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
        />

        <DashboardUrlList 
          urls={urls} 
          fetchingUrls={fetchingUrls}
          searchQuery={searchQuery}
          onCreateWithAlias={handleCreateWithAlias}
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

        <CreateUrlModal
          prefilledAlias={prefilledAlias}
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSuccess={handleCreateSuccess}
        />
      </div>
    </div>
  );
}
