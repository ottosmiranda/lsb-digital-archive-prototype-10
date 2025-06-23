
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Accessibility, Info, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VLibrasSettings = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [autoStart, setAutoStart] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedEnabled = localStorage.getItem('vlibras-enabled');
    const savedAutoStart = localStorage.getItem('vlibras-autostart');
    
    if (savedEnabled !== null) {
      setIsEnabled(JSON.parse(savedEnabled));
    }
    if (savedAutoStart !== null) {
      setAutoStart(JSON.parse(savedAutoStart));
    }
  }, []);

  const handleEnabledChange = (enabled: boolean) => {
    setIsEnabled(enabled);
    localStorage.setItem('vlibras-enabled', JSON.stringify(enabled));
    
    // Trigger storage event for other components
    window.dispatchEvent(new Event('storage'));
  };

  const handleAutoStartChange = (enabled: boolean) => {
    setAutoStart(enabled);
    localStorage.setItem('vlibras-autostart', JSON.stringify(enabled));
  };

  const handleRefreshWidget = () => {
    // Force reload by toggling the widget
    const currentState = isEnabled;
    setIsEnabled(false);
    localStorage.setItem('vlibras-enabled', 'false');
    window.dispatchEvent(new Event('storage'));
    
    setTimeout(() => {
      setIsEnabled(currentState);
      localStorage.setItem('vlibras-enabled', JSON.stringify(currentState));
      window.dispatchEvent(new Event('storage'));
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Accessibility className="h-5 w-5 text-lsb-primary" />
          VLibras - Tradução para Libras
        </CardTitle>
        <CardDescription>
          Configure o widget de acessibilidade VLibras para tradução de conteúdo em Língua Brasileira de Sinais (Libras).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="vlibras-enabled">Habilitar VLibras</Label>
            <p className="text-sm text-muted-foreground">
              Ativa o widget de tradução para Libras na plataforma
            </p>
          </div>
          <Switch
            id="vlibras-enabled"
            checked={isEnabled}
            onCheckedChange={handleEnabledChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="vlibras-autostart">Iniciar automaticamente</Label>
            <p className="text-sm text-muted-foreground">
              Inicia a tradução automaticamente ao abrir páginas
            </p>
          </div>
          <Switch
            id="vlibras-autostart"
            checked={autoStart}
            onCheckedChange={handleAutoStartChange}
            disabled={!isEnabled}
          />
        </div>

        {isEnabled && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="space-y-0.5">
              <Label>Recarregar Widget</Label>
              <p className="text-sm text-muted-foreground">
                Recarrega o VLibras em caso de problemas
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshWidget}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Recarregar
            </Button>
          </div>
        )}

        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-900">
              Sobre Erros
            </p>
            <p className="text-sm text-amber-700">
              Se houver erros do Unity ou problemas de conectividade, desative e reative o widget 
              ou use o botão "Recarregar" acima. Alguns erros de CORS são normais e não afetam o funcionamento.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900">
              Como usar
            </p>
            <p className="text-sm text-blue-700">
              Quando habilitado, um botão azul aparecerá no canto inferior esquerdo da tela. 
              Clique nele para abrir o tradutor de Libras. Use os controles nativos do VLibras 
              para navegar pelo widget.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VLibrasSettings;
