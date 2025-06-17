
import { AlertCircle, RefreshCw, Settings, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SpotifyError } from "@/utils/errorHandling";

interface SpotifyErrorDisplayProps {
  error: SpotifyError;
  onRetry?: () => void;
  onConfigure?: () => void;
  authStatus: string;
  browserName: string;
  isConfigured: boolean;
}

const SpotifyErrorDisplay = ({ 
  error, 
  onRetry, 
  onConfigure, 
  authStatus, 
  browserName,
  isConfigured 
}: SpotifyErrorDisplayProps) => {
  const getStatusBadge = () => {
    const statusConfig = {
      authenticating: { color: "bg-yellow-100 text-yellow-800", text: "Autenticando" },
      failed: { color: "bg-red-100 text-red-800", text: "Falhou" },
      success: { color: "bg-green-100 text-green-800", text: "Conectado" },
      idle: { color: "bg-gray-100 text-gray-800", text: "Aguardando" }
    };
    
    const config = statusConfig[authStatus as keyof typeof statusConfig] || statusConfig.idle;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium text-gray-900">Problema com Episódios do Spotify</h4>
              {getStatusBadge()}
            </div>
            
            <p className="text-sm text-gray-700 mb-3">
              {error.userMessage}
            </p>
            
            {error.browserSpecific && (
              <div className="bg-blue-50 p-3 rounded-lg mb-3">
                <div className="flex items-center gap-2 text-blue-800 text-sm">
                  <Info className="h-4 w-4" />
                  <span>Navegador detectado: <strong>{browserName}</strong></span>
                </div>
              </div>
            )}
            
            <div className="flex gap-2 flex-wrap">
              {error.retryable && onRetry && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onRetry}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
              )}
              
              {!isConfigured && onConfigure && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onConfigure}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Spotify
                </Button>
              )}
            </div>
            
            <p className="text-xs text-gray-500 mt-3">
              Usando episódios de exemplo enquanto isso...
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpotifyErrorDisplay;
