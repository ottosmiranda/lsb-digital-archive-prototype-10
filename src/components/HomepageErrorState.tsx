

import { RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HomepageErrorStateProps {
  error: string | null;
  onRetry: () => void;
  isUsingFallback?: boolean;
  apiStatus?: any;
}

const HomepageErrorState = ({ error, onRetry, isUsingFallback, apiStatus }: HomepageErrorStateProps) => {
  // Don't show anything if using fallback (removes the "Using Alternative Data Source" section)
  if (isUsingFallback) return null;
  
  // Only show if there's an actual error
  if (!error) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'unhealthy': return 'bg-red-100 text-red-800';
      default: return 'bg-[#FEC641]/10 text-[#B78A00]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <Wifi className="h-4 w-4" />;
      case 'unhealthy': return <WifiOff className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="my-8 bg-orange-50 border-orange-200">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          {/* Status indicators */}
          <div className="flex flex-wrap gap-2">
            {apiStatus?.healthStatus && (
              <Badge className={getStatusColor(apiStatus.healthStatus)}>
                {getStatusIcon(apiStatus.healthStatus)}
                <span className="ml-1">API: {apiStatus.healthStatus}</span>
              </Badge>
            )}
            {apiStatus?.circuitBreaker?.breakerOpen && (
              <Badge className="bg-red-100 text-red-800">
                <AlertCircle className="h-4 w-4 mr-1" />
                Circuit Breaker: OPEN
              </Badge>
            )}
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-orange-500" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2 text-orange-800">
                Problemas de Conectividade
              </h3>
              
              <div>
                <p className="text-orange-700 mb-4">
                  {error || 'Não foi possível carregar o conteúdo da API principal.'}
                </p>
                <p className="text-sm text-orange-600 mb-4">
                  Nossa equipe está trabalhando para resolver este problema. Tente novamente em alguns instantes.
                </p>
              </div>

              {/* Debug info in development */}
              {process.env.NODE_ENV === 'development' && apiStatus && (
                <div className="text-xs text-gray-600 mb-4 p-2 bg-gray-100 rounded">
                  <strong>Debug:</strong> Falhas: {apiStatus.circuitBreaker?.failures || 0}, 
                  Cache: {apiStatus.cacheSize || 0}, 
                  Requisições ativas: {apiStatus.activeRequests || 0}
                </div>
              )}
            </div>
            
            <Button 
              onClick={onRetry}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HomepageErrorState;
