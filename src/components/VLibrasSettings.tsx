
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Accessibility, Info, AlertTriangle } from 'lucide-react';

const VLibrasSettings = () => {
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    // Load settings from localStorage with proper default
    const savedEnabled = localStorage.getItem('vlibras-enabled');
    const shouldEnable = savedEnabled ? JSON.parse(savedEnabled) : true; // Default to true
    console.log('VLibras Settings - Loading from localStorage:', shouldEnable);
    setIsEnabled(shouldEnable);
    
    // If no setting exists, save the default
    if (savedEnabled === null) {
      localStorage.setItem('vlibras-enabled', JSON.stringify(true));
    }
  }, []);

  const handleEnabledChange = (enabled: boolean) => {
    console.log('VLibras Settings - Enabling/disabling:', enabled);
    setIsEnabled(enabled);
    localStorage.setItem('vlibras-enabled', JSON.stringify(enabled));
    
    // Trigger storage event for other components
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Accessibility className="h-5 w-5 text-blue-600" />
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

        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-900">
              Sobre Erros de Console
            </p>
            <p className="text-sm text-amber-700">
              Alguns erros de CORS ou Unity no console são normais do VLibras e não afetam o funcionamento. 
              O widget oficial do governo pode apresentar essas mensagens técnicas, mas continua funcionando corretamente.
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
              Quando habilitado, um botão azul do VLibras aparecerá no canto inferior direito da tela. 
              O indicador no canto inferior esquerdo mostra o status do carregamento. 
              Clique no botão azul oficial para abrir o tradutor de Libras.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VLibrasSettings;
