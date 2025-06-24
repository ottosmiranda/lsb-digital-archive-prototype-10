
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accessibility, CheckCircle, AlertCircle, Settings, Loader2, Globe } from 'lucide-react';
import { useVLibras } from '@/contexts/VLibrasContext';

const VLibrasSettings: React.FC = () => {
  const { state, actions } = useVLibras();
  const { isLoading, isLoaded, isEnabled, config, error } = state;

  const handleToggle = async () => {
    if (isEnabled) {
      actions.disable();
    } else {
      actions.enable();
    }
  };

  const handlePositionChange = (position: string) => {
    actions.updateConfig({ 
      position: position as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' 
    });
  };

  const handleAvatarChange = (avatar: string) => {
    actions.updateConfig({ avatar });
  };

  const getStatusBadge = () => {
    if (isLoading) {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Carregando
        </Badge>
      );
    }
    
    if (error) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Erro
        </Badge>
      );
    }
    
    if (isLoaded && isEnabled) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Ativo Globalmente
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline">
        <Globe className="h-3 w-3 mr-1" />
        Desabilitado
      </Badge>
    );
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Accessibility className="h-5 w-5" />
          VLibras - Tradutor de Libras
          <div className="flex gap-2 ml-auto">
            {getStatusBadge()}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Configuração Global</h4>
          <p className="text-sm text-blue-800">
            O VLibras é uma ferramenta de acessibilidade que traduz conteúdo em português para Libras. 
            Esta configuração se aplica a todos os usuários da plataforma.
          </p>
        </div>

        <Alert>
          <Globe className="h-4 w-4" />
          <AlertDescription>
            As configurações do VLibras são aplicadas globalmente para todos os usuários da plataforma.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="vlibras-toggle" className="font-medium">
              Habilitar VLibras para Todos os Usuários
            </Label>
          </div>
          <Switch
            id="vlibras-toggle"
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => actions.loadWidget()}
              disabled={isLoading}
              className="ml-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Tentando...
                </>
              ) : (
                'Tentar Novamente'
              )}
            </Button>
          </div>
        )}

        {isEnabled && !error && (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações Globais
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position">Posição na Tela</Label>
                <Select value={config.position} onValueChange={handlePositionChange} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-left">Superior Esquerda</SelectItem>
                    <SelectItem value="top-right">Superior Direita</SelectItem>
                    <SelectItem value="bottom-left">Inferior Esquerda</SelectItem>
                    <SelectItem value="bottom-right">Inferior Direita</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="avatar">Avatar</Label>
                <Select value={config.avatar} onValueChange={handleAvatarChange} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="icaro">Ícaro</SelectItem>
                    <SelectItem value="maya">Maya</SelectItem>
                    <SelectItem value="hozana">Hozana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          O VLibras é uma tecnologia desenvolvida pelo governo brasileiro em parceria com universidades, 
          disponibilizada gratuitamente para promover a acessibilidade digital.
          <span className="block mt-1 text-green-600">
            ✓ Configuração aplicada globalmente a todos os usuários.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default VLibrasSettings;
