
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, CheckCircle, AlertCircle, ExternalLink, Globe, Loader2 } from 'lucide-react';
import { useGlobalSpotifyAuth } from '@/hooks/useGlobalSpotifyAuth';
import { useToast } from '@/hooks/use-toast';

const SpotifyConfig = () => {
  const { isConfigured, isLoading, error, authenticate, clearConfig } = useGlobalSpotifyAuth();
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showConfig, setShowConfig] = useState(!isConfigured);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setShowConfig(!isConfigured);
  }, [isConfigured]);

  const handleSave = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha ambos os campos",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    
    const success = await authenticate(clientId.trim(), clientSecret.trim());
    
    if (success) {
      setShowConfig(false);
      setClientId('');
      setClientSecret('');
      toast({
        title: "Sucesso",
        description: "Configuração do Spotify salva com sucesso!",
      });
    } else {
      toast({
        title: "Erro",
        description: "Falha ao salvar configuração do Spotify",
        variant: "destructive"
      });
    }
    
    setSaving(false);
  };

  const handleClear = async () => {
    setSaving(true);
    await clearConfig();
    setClientId('');
    setClientSecret('');
    setShowConfig(true);
    setSaving(false);
    toast({
      title: "Configuração removida",
      description: "A configuração do Spotify foi removida da plataforma",
    });
  };

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Carregando configuração do Spotify...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!showConfig && isConfigured) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Spotify API Configurada Globalmente</span>
              <Badge className="bg-green-100 text-green-800">
                <Globe className="h-3 w-3 mr-1" />
                Ativa para Todos
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(true)}
              disabled={saving}
            >
              <Settings className="h-4 w-4 mr-2" />
              Reconfigurar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuração Global da Spotify Web API
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Globe className="h-4 w-4" />
          <AlertDescription>
            Esta configuração se aplica a todos os usuários da plataforma. 
            As credenciais serão armazenadas de forma segura no banco de dados.
          </AlertDescription>
        </Alert>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Como obter suas credenciais:</h4>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Acesse o <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Spotify Developer Dashboard</a></li>
            <li>2. Crie uma nova aplicação</li>
            <li>3. Copie o Client ID e Client Secret</li>
            <li>4. Cole os valores nos campos abaixo</li>
          </ol>
          <a 
            href="https://developer.spotify.com/dashboard" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 mt-2"
          >
            Abrir Dashboard <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="clientId">Client ID</Label>
            <Input
              id="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Seu Client ID do Spotify"
              disabled={saving}
            />
          </div>
          
          <div>
            <Label htmlFor="clientSecret">Client Secret</Label>
            <Input
              id="clientSecret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Seu Client Secret do Spotify"
              disabled={saving}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            {error.userMessage}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving || isLoading}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Configuração Global'
            )}
          </Button>
          
          {isConfigured && (
            <Button variant="outline" onClick={handleClear} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                'Remover Configuração'
              )}
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-500 mt-4">
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <p className="text-amber-800 font-medium mb-1">⚠️ Configuração de Administrador</p>
            <p className="text-amber-700">
              Apenas administradores podem configurar as credenciais globais do Spotify. 
              Esta configuração afetará todos os usuários da plataforma.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpotifyConfig;
