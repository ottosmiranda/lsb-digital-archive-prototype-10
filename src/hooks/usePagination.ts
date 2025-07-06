
import { useState, useCallback, useEffect } from 'react';

interface UsePaginationProps {
  initialPage?: number;
  externalCurrentPage?: number;
  onPageChange?: (page: number) => void;
}

export const usePagination = ({ 
  initialPage = 1, 
  externalCurrentPage,
  onPageChange 
}: UsePaginationProps = {}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Sincronizar com página externa (da resposta da busca)
  useEffect(() => {
    if (externalCurrentPage !== undefined && externalCurrentPage !== currentPage) {
      setCurrentPage(externalCurrentPage);
    }
  }, [externalCurrentPage, currentPage]);

  const handlePageChange = useCallback((page: number) => {
    console.log('📄 Page changed to:', page);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onPageChange?.(page);
  }, [onPageChange]);

  const resetToFirstPage = useCallback(() => {
    setCurrentPage(1);
    onPageChange?.(1);
  }, [onPageChange]);

  return {
    currentPage: externalCurrentPage !== undefined ? externalCurrentPage : currentPage,
    setCurrentPage,
    handlePageChange,
    resetToFirstPage
  };
};
