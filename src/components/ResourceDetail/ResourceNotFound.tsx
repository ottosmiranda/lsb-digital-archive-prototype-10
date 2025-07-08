
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, RefreshCw, Lightbulb } from "lucide-react";
import { Resource } from "@/types/resourceTypes";
import { getTypeLabel, getTypeBadgeColor } from "@/utils/resourceUtils";

interface ResourceNotFoundProps {
  resourceId?: string;
  suggestions?: Resource[];
  onRetry?: () => void;
  loading?: boolean;
}

const ResourceNotFound = ({ 
  resourceId, 
  suggestions = [], 
  onRetry,
  loading = false 
}: ResourceNotFoundProps) => {

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header com informações do erro */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Recurso não encontrado
          </h1>
          {resourceId && (
            <p className="text-lg text-gray-600 mb-6">
              O recurso com ID <span className="font-mono bg-gray-100 px-2 py-1 rounded">{resourceId}</span> não foi localizado em nossa biblioteca.
            </p>
          )}
          
          {/* Botões de ação principais */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link to="/buscar">
              <Button variant="default" size="lg">
                <Search className="h-4 w-4 mr-2" />
                Fazer uma busca
              </Button>
            </Link>
            
            {onRetry && (
              <Button 
                variant="outline" 
                size="lg" 
                onClick={onRetry}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Tentar novamente
              </Button>
            )}
            
            <Link to="/">
              <Button variant="outline" size="lg">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Página inicial
              </Button>
            </Link>
          </div>
        </div>

        {/* Sugestões de recursos similares */}
        {suggestions.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                Recursos que podem interessar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestions.map((suggestion) => (
                  <Link 
                    key={suggestion.id} 
                    to={`/recurso/${suggestion.id}`}
                    className="block"
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          {suggestion.thumbnail && (
                            <img
                              src={suggestion.thumbnail}
                              alt={suggestion.title}
                              className="w-16 h-16 object-cover rounded flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.src = '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png';
                              }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <Badge className={`${getTypeBadgeColor(suggestion.type)} mb-2 text-xs`}>
                              {getTypeLabel(suggestion.type)}
                            </Badge>
                            <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                              {suggestion.title}
                            </h3>
                            <p className="text-xs text-gray-600 mb-1">
                              {suggestion.author}
                            </p>
                            {suggestion.year && (
                              <p className="text-xs text-gray-500">
                                {suggestion.year}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dicas para encontrar recursos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Como encontrar o que procura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Busca por texto</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Use palavras-chave relacionadas ao título, autor ou assunto do material que procura.
                </p>
                <Link to="/buscar">
                  <Button variant="outline" size="sm">
                    <Search className="h-4 w-4 mr-2" />
                    Buscar por texto
                  </Button>
                </Link>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Navegue por categoria</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Explore nosso acervo organizado por tipo de conteúdo e assunto.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link to="/buscar?filtros=podcast">
                    <Button variant="outline" size="sm">Podcasts</Button>
                  </Link>
                  <Link to="/buscar?filtros=video">
                    <Button variant="outline" size="sm">Vídeos</Button>
                  </Link>
                  <Link to="/buscar?filtros=titulo">
                    <Button variant="outline" size="sm">Livros</Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResourceNotFound;
