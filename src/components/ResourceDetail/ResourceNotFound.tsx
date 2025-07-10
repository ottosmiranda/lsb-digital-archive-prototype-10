
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Home, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { idValidationService } from "@/services/idValidationService";

const ResourceNotFound = () => {
  const [invalidIdTrackings, setInvalidIdTrackings] = useState<any[]>([]);

  useEffect(() => {
    // ✅ Carregar trackings de IDs inválidos para debug
    const trackings = idValidationService.getInvalidIdTrackings();
    setInvalidIdTrackings(trackings.slice(-5)); // Últimos 5 trackings
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleClearTrackings = () => {
    idValidationService.clearTrackings();
    setInvalidIdTrackings([]);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Recurso não encontrado</h1>
            <p className="text-gray-600">
              O recurso que você está procurando pode não estar disponível ou o ID pode ser inválido.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            
            <Link to="/buscar">
              <Button variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Buscar Recursos
              </Button>
            </Link>
            
            <Link to="/">
              <Button>
                <Home className="h-4 w-4 mr-2" />
                Página Inicial
              </Button>
            </Link>
          </div>
          
          {/* ✅ NOVA SEÇÃO: Debug de IDs inválidos (apenas em desenvolvimento) */}
          {process.env.NODE_ENV === 'development' && invalidIdTrackings.length > 0 && (
            <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-sm font-semibold text-red-800 mb-2">Debug: IDs Inválidos Recentes</h3>
              <div className="space-y-2 text-xs text-red-700">
                {invalidIdTrackings.map((tracking, index) => (
                  <div key={index} className="bg-white p-2 rounded border">
                    <div><strong>ID:</strong> {tracking.id}</div>
                    <div><strong>Origem:</strong> {tracking.origin}</div>
                    <div><strong>Timestamp:</strong> {new Date(tracking.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearTrackings}
                className="mt-2 text-red-600 border-red-300"
              >
                Limpar Trackings
              </Button>
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-8">
            <p>💡 Dica: Se o problema persistir, tente buscar pelo nome do recurso na página de busca.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceNotFound;
