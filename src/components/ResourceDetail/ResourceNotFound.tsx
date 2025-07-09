
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Home } from "lucide-react";

const ResourceNotFound = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Recurso não encontrado</h1>
            <p className="text-gray-600">
              O recurso que você está procurando pode não estar disponível ou ainda estar carregando.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            
            <Link to="/buscar">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar à Busca
              </Button>
            </Link>
            
            <Link to="/">
              <Button>
                <Home className="h-4 w-4 mr-2" />
                Página Inicial
              </Button>
            </Link>
          </div>
          
          <div className="text-xs text-gray-500 mt-8">
            <p>💡 Dica: Se o problema persistir, tente atualizar a página ou navegue de volta à página inicial.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceNotFound;
