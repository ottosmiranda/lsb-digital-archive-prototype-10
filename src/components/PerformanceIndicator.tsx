
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, Filter, Globe } from 'lucide-react';

interface PerformanceIndicatorProps {
  isOptimized: boolean;
  loading: boolean;
  responseTime?: number;
  className?: string;
  isFastFilter?: boolean;
  isGlobalSearch?: boolean; // NOVO: Para indicar busca global "Todos"
}

const PerformanceIndicator = ({ 
  isOptimized, 
  loading, 
  responseTime,
  className = "",
  isFastFilter = false,
  isGlobalSearch = false
}: PerformanceIndicatorProps) => {
  if (loading) {
    return (
      <Badge variant="outline" className={`${className} animate-pulse`}>
        <Clock className="h-3 w-3 mr-1" />
        {isGlobalSearch ? 'Carregando todos...' : 
         isFastFilter ? 'Carregando filtro...' : 'Buscando...'}
      </Badge>
    );
  }

  // NOVO: Indicador para busca global "Todos"
  if (isGlobalSearch) {
    return (
      <Badge variant="default" className={`${className} bg-purple-500 hover:bg-purple-600`}>
        <Globe className="h-3 w-3 mr-1" />
        Busca global - Todos os resultados
        {responseTime && responseTime < 5000 && (
          <span className="ml-1 text-xs">• {Math.round(responseTime/1000)}s</span>
        )}
      </Badge>
    );
  }

  if (isFastFilter) {
    return (
      <Badge variant="default" className={`${className} bg-blue-500 hover:bg-blue-600`}>
        <Filter className="h-3 w-3 mr-1" />
        Filtro rápido - Todos os resultados
        {responseTime && responseTime < 5000 && (
          <span className="ml-1 text-xs">• {Math.round(responseTime/1000)}s</span>
        )}
      </Badge>
    );
  }

  if (isOptimized) {
    return (
      <Badge variant="default" className={`${className} bg-green-500 hover:bg-green-600`}>
        <Zap className="h-3 w-3 mr-1" />
        Busca otimizada
        {responseTime && responseTime < 3000 && (
          <span className="ml-1 text-xs">• {responseTime}ms</span>
        )}
      </Badge>
    );
  }

  return null;
};

export default PerformanceIndicator;
