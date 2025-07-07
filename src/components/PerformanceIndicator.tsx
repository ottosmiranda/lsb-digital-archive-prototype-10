
import { Badge } from '@/components/ui/badge';
import { Zap, Clock } from 'lucide-react';

interface PerformanceIndicatorProps {
  isOptimized: boolean;
  loading: boolean;
  responseTime?: number;
  className?: string;
}

const PerformanceIndicator = ({ 
  isOptimized, 
  loading, 
  responseTime,
  className = "" 
}: PerformanceIndicatorProps) => {
  if (loading) {
    return (
      <Badge variant="outline" className={`${className} animate-pulse`}>
        <Clock className="h-3 w-3 mr-1" />
        Buscando...
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
