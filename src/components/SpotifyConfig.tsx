
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';

const SpotifyConfig = () => {
  const { isConfigured, authenticate, loading, error } = useSpotifyAuth();
  const [clientId, setClientId] = useState(localStorage.getItem('spotify_client_id') || '');
  const [clientSecret, setClientSecret] = useState(localStorage.getItem('spotify_client_secret') || '');
  const [showConfig, setShowConfig] = useState(!isConfigured);

  const handleSave = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      alert('Por favor, preencha ambos os campos');
      return;
    }

    localStorage.setItem('spotify_client_id', clientId.trim());
    localStorage.setItem('spotify_client_secret', clientSecret.trim());
    
    const success = await authenticate();
    if (success) {
      setShowConfig(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem('spotify_client_id');
    localStorage.removeItem('spotify_client_secret');
    localStorage.removeItem('spotify_token');
    setClientId('');
    setClientSecret('');
    setShowConfig(true);
  };

  if (!showConfig && isConfigured) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Spotify API Configurada</span>
              <Badge className="bg-green-100 text-green-800">Ativa</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar
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
          Configuração da Spotify Web API
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Testando...' : 'Salvar e Testar'}
          </Button>
          
          {isConfigured && (
            <Button variant="outline" onClick={handleClear}>
              Limpar Configuração
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SpotifyConfig;
