
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Search, BookOpen, Play, Headphones } from "lucide-react";
import { SearchResult } from "@/types/searchTypes";
import { getTypeLabel, getTypeBadgeColor } from "@/utils/resourceUtils";

interface ResourceNotFoundProps {
  requestedId?: string;
  suggestions?: SearchResult[];
  onRetry?: () => void;
}

const ResourceNotFound = ({ requestedId, suggestions = [], onRetry }: ResourceNotFoundProps) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="h-4 w-4" />;
      case 'titulo': return <BookOpen className="h-4 w-4" />;
      case 'podcast': return <Headphones className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Recurso não encontrado
          </h1>
          
          {requestedId && (
            <p className="text-gray-600 mb-4">
              O recurso com ID <span className="font-mono bg-gray-100 px-2 py-1 rounded">{requestedId}</span> não foi encontrado.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/buscar">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar à busca
              </Button>
            </Link>
            
            {onRetry && (
              <Button onClick={onRetry} variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            )}
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recursos que podem interessar:
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <img
                          src={suggestion.thumbnail || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png'}
                          alt={suggestion.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(suggestion.type)}`}>
                            {getTypeIcon(suggestion.type)}
                            <span className="ml-1">{getTypeLabel(suggestion.type)}</span>
                          </span>
                        </div>
                        
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                          {suggestion.title}
                        </h3>
                        
                        <p className="text-xs text-gray-500">
                          {suggestion.author}
                        </p>
                        
                        <Link
                          to={`/recurso/${suggestion.id}`}
                          className="inline-flex items-center text-xs text-lsb-primary hover:text-lsb-primary/80 mt-2"
                        >
                          Ver detalhes
                          <ArrowLeft className="h-3 w-3 ml-1 rotate-180" />
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Não encontrou o que procurava?
          </p>
          <Link to="/buscar" className="text-lsb-primary hover:text-lsb-primary/80">
            Experimente fazer uma nova busca
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResourceNotFound;
