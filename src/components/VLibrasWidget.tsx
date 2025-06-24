
import React, { useEffect } from 'react';
import { useVLibras } from '@/contexts/VLibrasContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, RotateCcw } from 'lucide-react';

const VLibrasWidget: React.FC = () => {
  const { state, actions } = useVLibras();

  useEffect(() => {
    console.log('VLibrasWidget: Component mounted, current state:', {
      isLoading: state.isLoading,
      isLoaded: state.isLoaded,
      isEnabled: state.isEnabled,
      error: state.error
    });
  }, [state]);

  // Show loading indicator in development/admin context
  if (state.isLoading && window.location.pathname === '/settings') {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-100 border border-blue-300 rounded-lg p-3 shadow-lg z-50">
        <div className="flex items-center gap-2 text-blue-800">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Carregando VLibras...</span>
        </div>
      </div>
    );
  }

  // Show error with retry option in development/admin context
  if (state.error && window.location.pathname === '/settings') {
    return (
      <div className="fixed bottom-4 right-4 max-w-sm z-50">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">Erro no VLibras: {state.error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => actions.loadWidget()}
              className="ml-2 h-6 px-2"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // This component doesn't render any UI itself for regular users
  // The VLibras widget is injected directly into the DOM by the service
  return null;
};

export default VLibrasWidget;
