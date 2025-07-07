
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
  // Debug info
  console.log('SearchPagination render:', { currentPage, totalPages, shouldRender: totalPages > 1 });
  
  // Não mostrar paginação se há apenas 1 página ou menos
  if (totalPages <= 1) {
    console.log('❌ Paginação não renderizada: totalPages <=1');
    return null;
  }

  // Mostrar input de navegação direta apenas quando há muitas páginas
  const showPageJump = totalPages > 10;

  // Função para determinar quais páginas mostrar
  const getVisiblePages = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Se tem 7 páginas ou menos, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para mostrar páginas com ellipsis
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

  console.log('✅ Renderizando paginação:', { 
    currentPage, 
    totalPages, 
    visiblePages: visiblePages.length,
    showPageJump
  });

  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      {showPageJump && (
        <div className="flex items-center justify-center">
          <PageJumpInput
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
      
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => currentPage > 1 && onPageChange(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-100"}
            />
          </PaginationItem>
          
          {visiblePages.map((page, index) => (
            <PaginationItem key={index}>
              {page === 'ellipsis' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => onPageChange(page)}
                  isActive={currentPage === page}
                  className={`cursor-pointer ${
                    currentPage === page 
                      ? 'bg-lsb-primary text-white hover:bg-lsb-primary/90' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => currentPage < totalPages && onPageChange(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-100"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      
      <div className="text-sm text-gray-600">
        Página {currentPage} de {totalPages}
      </div>
    </div>
  );
};

export default SearchPagination;
