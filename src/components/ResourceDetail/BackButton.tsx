
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { navigationHistoryService } from "@/services/navigationHistoryService";

const BackButton = () => {
  const lastSearchUrl = navigationHistoryService.getLastSearchUrl();
  const backUrl = lastSearchUrl || navigationHistoryService.getDefaultVideoSearchUrl();
  
  console.log('🔙 BackButton using URL:', backUrl);

  return (
    <Link to={backUrl} className="inline-flex items-center text-lsb-primary hover:text-lsb-primary/80 mb-6">
      <ArrowLeft className="h-4 w-4 mr-2" />
      Voltar aos resultados
    </Link>
  );
};

export default BackButton;
