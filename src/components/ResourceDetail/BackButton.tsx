
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BackButton = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Tenta voltar ao estado anterior preservando filtros e paginação
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback para /buscar se não há histórico
      navigate("/buscar");
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
