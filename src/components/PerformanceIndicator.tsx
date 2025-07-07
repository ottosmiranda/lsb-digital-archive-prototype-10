
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, Filter } from 'lucide-react';

interface PerformanceIndicatorProps {
  isOptimized: boolean;
  loading: boolean;
  responseTime?: number;
  className?: string;
  isFastFilter?: boolean; // NOVO: Para indicar filtro rápido
}

const PerformanceIndicator = ({ 
  isOptimized, 
  loading, 
  responseTime,
  className = "",
  isFastFilter = false
}: PerformanceIndicatorProps) => {
  if (loading) {
    return (
      <Badge variant="outline" className={`${className} animate-pulse`}>
        <Clock className="h-3 w-3 mr-1" />
        {isFastFilter ? 'Carregando todos...' : 'Buscando...'}
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
