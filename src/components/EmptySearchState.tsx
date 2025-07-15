
import { Search, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptySearchStateProps {
  query: string;
  onClearFilters: () => void;
  isTransitioning?: boolean;
}

const EmptySearchState = ({ query, onClearFilters, isTransitioning = false }: EmptySearchStateProps) => {
  // ✅ Show loading state during filter transitions
  if (isTransitioning) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 bg-lsb-section rounded-full flex items-center justify-center">
            <Loader2 className="h-12 w-12 text-lsb-primary animate-spin" />
          </div>
          
          <h3 className="text-xl font-semibold lsb-primary mb-4">
            Carregando conteúdo...
          </h3>
          
          <p className="text-gray-600 mb-6">
            Aguarde um momento enquanto buscamos os melhores resultados para você.
          </p>
        </div>
      </div>
    );
  }

  // ✅ Original empty state when no results found
  return (
    <div className="text-center py-16">
      <div className="max-w-md mx-auto">
        <div className="w-24 h-24 mx-auto mb-6 bg-lsb-section rounded-full flex items-center justify-center">
          <Search className="h-12 w-12 text-gray-400" />
        </div>
        
        <h3 className="text-xl font-semibold lsb-primary mb-4">
          Nenhum resultado encontrado
        </h3>
        
        <p className="text-gray-600 mb-6">
          {query 
            ? `Não encontramos nada para "${query}". Tente ajustar sua busca ou usar filtros diferentes.`
            : 'Não encontramos resultados com os filtros aplicados. Tente ajustar os critérios de busca.'
          }
        </p>

        <div className="space-y-3">
          <Button 
            variant="outline" 
            onClick={onClearFilters}
            className="border-lsb-primary text-lsb-primary hover:bg-lsb-primary hover:text-white"
          >
            <Filter className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
          
          <div className="text-sm text-gray-500">
            <p className="mb-2">Sugestões:</p>
            <ul className="space-y-1">
              <li>• Verifique a ortografia das palavras-chave</li>
              <li>• Use termos mais gerais</li>
              <li>• Remova alguns filtros</li>
              <li>• Explore nossas coleções em destaque</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptySearchState;
