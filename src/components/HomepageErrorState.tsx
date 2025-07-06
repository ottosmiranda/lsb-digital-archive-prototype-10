
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface HomepageErrorStateProps {
  error: string | null;
  onRetry: () => void;
  isUsingFallback?: boolean;
}

const HomepageErrorState = ({ error, onRetry, isUsingFallback }: HomepageErrorStateProps) => {
  if (!error && !isUsingFallback) return null;

  return (
    <Card className="bg-orange-50 border-orange-200 my-8">
      <CardContent className="p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <AlertCircle className="h-12 w-12 text-orange-500" />
          <div>
            <h3 className="text-lg font-semibold text-orange-800 mb-2">
              {isUsingFallback ? 'Conteúdo Temporariamente Indisponível' : 'Erro ao Carregar Conteúdo'}
            </h3>
            <p className="text-orange-700 mb-4">
              {error || 'Não foi possível carregar o conteúdo da API no momento.'}
            </p>
            <p className="text-sm text-orange-600 mb-4">
              Estamos trabalhando para resolver este problema. Tente novamente em alguns instantes.
            </p>
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
      </CardContent>
    </Card>
  );
};

export default HomepageErrorState;
