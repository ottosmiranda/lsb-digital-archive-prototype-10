
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BackButton = () => (
  <Link to="/buscar?filtros=video" className="inline-flex items-center text-lsb-primary hover:text-lsb-primary/80 mb-6">
    <ArrowLeft className="h-4 w-4 mr-2" />
    Voltar aos resultados
  </Link>
);

export default BackButton;
