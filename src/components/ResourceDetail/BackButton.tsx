
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BackButton = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleBack = () => {
    console.group('🔙 BackButton - Navigation Logic');
    console.log('📋 Current search params:', Object.fromEntries(searchParams.entries()));
    
    // Check if we have search context preserved in URL
    const fromPage = searchParams.get('from');
    console.log('📋 From page:', fromPage);
    
    if (fromPage === 'buscar') {
      // ✅ CORRIGIDO: Preservar TODOS os parâmetros, incluindo filtros e paginação
      const searchUrl = new URLSearchParams(searchParams);
      searchUrl.delete('from'); // Remove apenas o parâmetro 'from'
      
      const targetUrl = `/buscar?${searchUrl.toString()}`;
      console.log('🔙 Returning to search with ALL preserved state:', targetUrl);
      console.log('📋 Preserved params:', Object.fromEntries(searchUrl.entries()));
      
      // ✅ CORREÇÃO: Garantir que todos os parâmetros são preservados
      const preservedParams = Object.fromEntries(searchUrl.entries());
      console.log('✅ Final preserved state:', {
        query: preservedParams.q || 'none',
        filtros: searchUrl.getAll('filtros'),
        pagina: preservedParams.pagina || '1',
        ordenar: preservedParams.ordenar || 'relevance'
      });
      
      console.groupEnd();
      navigate(targetUrl);
    } else {
      console.log('🔙 No search context - using fallback navigation');
      console.groupEnd();
      
      // Fallback to browser history or default search page
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/buscar");
      }
    }
  };

  return (
    <button 
      onClick={handleBack}
      className="inline-flex items-center text-lsb-primary hover:text-lsb-primary/80 mb-6"
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Voltar aos resultados
    </button>
  );
};

export default BackButton;
