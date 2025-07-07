
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import PageJumpInput from "@/components/PageJumpInput";

interface SearchPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const SearchPagination = ({ currentPage, totalPages, onPageChange }: SearchPaginationProps) => {
  // CORREÇÃO CRÍTICA: Sempre mostrar paginação quando há mais de 1 página
  console.log('🔄 SearchPagination render:', { currentPage, totalPages, shouldShow: totalPages > 1 });
  
  if (totalPages <= 1) {
    console.log('📄 Ocultando paginação: apenas 1 página');
    return null;
  }

  console.log('📊 Renderizando paginação REAL:', { currentPage, totalPages });

  // Input de navegação direta para muitas páginas
  const showPageJump = totalPages > 10;

  // Função para determinar páginas visíveis
  const getVisiblePages = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // 7 páginas ou menos: mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica com ellipsis
      if (currentPage <= 4) {
        // Início: 1, 2, 3, 4, 5, ..., last
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Final: 1, ..., last-4, last-3, last-2, last-1, last
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Meio: 1, ..., current-1, current, current+1, ..., last
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  const handlePageClick = (page: number) => {
    console.log('🔄 Clique na página (PAGINAÇÃO REAL):', { from: currentPage, to: page });
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const handlePreviousClick = () => {
    const prevPage = Math.max(1, currentPage - 1);
    console.log('⬅️ Página anterior (PAGINAÇÃO REAL):', { from: currentPage, to: prevPage });
    if (prevPage !== currentPage) {
      onPageChange(prevPage);
    }
  };

  const handleNextClick = () => {
    const nextPage = Math.min(totalPages, currentPage + 1);
    console.log('➡️ Próxima página (PAGINAÇÃO REAL):', { from: currentPage, to: nextPage });
    if (nextPage !== currentPage) {
      onPageChange(nextPage);
    }
  };

  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      {showPageJump && (
        <div className="flex items-center justify-center">
          <PageJumpInput
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageClick}
          />
        </div>
      )}
      
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={handlePreviousClick}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-100"}
            />
          </PaginationItem>
          
          {visiblePages.map((page, index) => (
            <PaginationItem key={index}>
              {page === 'ellipsis' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => handlePageClick(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer hover:bg-gray-100"
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext 
              onClick={handleNextClick}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-100"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      
      {/* Debug info apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-2">
          Página {currentPage} de {totalPages} (Paginação Real da API)
        </div>
      )}
    </div>
  );
};

export default SearchPagination;
