
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Accessibility, Info } from 'lucide-react';

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
    
    // Toggle VLibras widget visibility
    const vwElement = document.querySelector('[vw]') as HTMLElement;
    if (vwElement) {
      vwElement.style.display = enabled ? 'block' : 'none';
    }
  };

  const handleAutoStartChange = (enabled: boolean) => {
    setAutoStart(enabled);
    localStorage.setItem('vlibras-autostart', JSON.stringify(enabled));
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
              Mostra o widget de tradução para Libras na plataforma
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

        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900">
              Sobre o VLibras
            </p>
            <p className="text-sm text-blue-700">
              O VLibras é uma ferramenta que traduz conteúdo digital para Língua Brasileira 
              de Sinais (Libras), tornando a plataforma mais acessível para pessoas surdas. 
              Desenvolvido pelo Governo Federal em parceria com universidades.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VLibrasSettings;
