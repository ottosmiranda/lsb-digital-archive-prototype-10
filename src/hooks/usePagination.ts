
import { useState, useCallback } from 'react';

interface UsePaginationProps {
  initialPage?: number;
  onPageChange?: (page: number) => void;
}

export const usePagination = ({ initialPage = 1, onPageChange }: UsePaginationProps = {}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const handlePageChange = useCallback((page: number) => {
    console.log('📄 Page changed to:', page);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onPageChange?.(page);
  }, [onPageChange]);

  const resetToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    setCurrentPage,
    handlePageChange,
    resetToFirstPage
  };
};
