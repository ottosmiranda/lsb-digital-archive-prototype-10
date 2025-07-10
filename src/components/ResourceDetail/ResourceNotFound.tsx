
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Home, Search } from "lucide-react";
import { ResourceIdValidator } from "@/services/resourceIdValidator";

const ResourceNotFound = () => {
  const { id } = useParams<{ id: string }>();
  
  const handleRefresh = () => {
    window.location.reload();
  };

  // Determine if ID is invalid based on validation
  const validation = id ? ResourceIdValidator.validateResourceId(id) : null;
  const isInvalidId = validation && validation.suggestedAction === 'redirect';
  const isKnownInvalidId = id ? ResourceIdValidator.isKnownInvalidId(id) : false;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {isKnownInvalidId ? 'ID de Recurso Inválido' : 'Recurso não encontrado'}
            </h1>
            <p className="text-gray-600">
              {isKnownInvalidId 
                ? 'Este ID não corresponde a nenhum recurso válido em nossa plataforma.'
                : isInvalidId 
                  ? 'O formato do ID fornecido não é reconhecido. Verifique se o link está correto.'
                  : 'O recurso que você está procurando pode não estar disponível ou ainda estar carregando.'
              }
            </p>
            
            {id && (
              <div className="bg-gray-100 p-3 rounded-lg text-sm text-gray-500 font-mono break-all">
                ID: {id}
              </div>
            )}
            
            {validation && (
              <div className="text-xs text-gray-500 mt-2">
                Status: {validation.isValid ? '✅ Formato válido' : '❌ Formato inválido'} • 
                Tipo detectado: {validation.type} • 
                Confiança: {validation.confidence}
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {!isKnownInvalidId && (
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            )}
            
            <Link to="/buscar">
              <Button variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Buscar Recursos
              </Button>
            </Link>
            
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
            <p>
              💡 Dica: {isInvalidId || isKnownInvalidId 
                ? 'Verifique se o link está correto ou navegue pela busca para encontrar o recurso desejado.'
                : 'Se o problema persistir, tente atualizar a página ou navegue de volta à página inicial.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceNotFound;
