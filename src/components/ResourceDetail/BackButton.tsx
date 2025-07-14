
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BackButton = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleBack = () => {
    // Check if we have search context preserved in URL
    const fromPage = searchParams.get('from');
    
    if (fromPage === 'buscar') {
      // Reconstruct the search URL with all parameters
      const searchUrl = new URLSearchParams(searchParams);
      searchUrl.delete('from'); // Remove the 'from' parameter
      
      const targetUrl = `/buscar?${searchUrl.toString()}`;
      console.log('🔙 Returning to search with preserved state:', targetUrl);
      navigate(targetUrl);
    } else {
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
