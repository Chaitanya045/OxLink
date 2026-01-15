import { useState, useCallback, useRef } from "react";
import type { PaginationData } from "@/types/dashboard";

interface UsePaginationOptions {
  itemsPerPage: number;
}

interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  setCurrentPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  setPaginationData: (data: PaginationData) => void;
  getPageNumbers: () => (number | string)[];
}

export function usePagination({ itemsPerPage }: UsePaginationOptions): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const setPaginationData = useCallback((data: PaginationData) => {
    setTotalPages(data.totalPages);
    setTotalCount(data.totalCount);
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const getPageNumbers = useCallback((): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        endPage = Math.min(4, totalPages - 1);
      }

      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3);
      }

      if (startPage > 2) {
        pages.push("...");
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages]);

  return {
    currentPage,
    totalPages,
    totalCount,
    setCurrentPage,
    goToNextPage,
    goToPreviousPage,
    setPaginationData,
    getPageNumbers,
  };
}
