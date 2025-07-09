
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { testEndpoints, printTestReport, EndpointTestResult } from '@/utils/endpointTester';

const EndpointTester = () => {
  const [results, setResults] = useState<EndpointTestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    console.log('🚀 Iniciando testes dos endpoints...');
    
    try {
      const testResults = await testEndpoints();
      setResults(testResults);
      printTestReport(testResults);
    } catch (error) {
      console.error('Erro ao executar testes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">✅ Sucesso</Badge>;
      case 'not_found':
        return <Badge className="bg-yellow-500">❌ 404</Badge>;
      case 'error':
        return <Badge className="bg-red-500">💥 Erro</Badge>;
      default:
        return <Badge>Desconhecido</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🔧 Teste dos Endpoints de ID Único</CardTitle>
        <p className="text-sm text-gray-600">
          Teste os endpoints fornecidos para verificar funcionalidade e estrutura das respostas
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={loading}
          className="w-full"
        >
          {loading ? '🔄 Testando...' : '🚀 Executar Testes'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Resultados dos Testes:</h3>
            
            {/* Resumo */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {results.filter(r => r.status === 'success').length}
                </div>
                <div className="text-sm text-green-700">Sucessos</div>
              </div>
              <div className="p-3 bg-yellow-50 rounded">
                <div className="text-2xl font-bold text-yellow-600">
                  {results.filter(r => r.status === 'not_found').length}
                </div>
                <div className="text-sm text-yellow-700">404s</div>
              </div>
              <div className="p-3 bg-red-50 rounded">
                <div className="text-2xl font-bold text-red-600">
                  {results.filter(r => r.status === 'error').length}
                </div>
                <div className="text-sm text-red-700">Erros</div>
              </div>
            </div>

            {/* Detalhes */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-gray-600">
                      {result.endpoint.split('/').pop()}
                    </span>
                    {getStatusBadge(result.status)}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {result.responseTime && `${result.responseTime}ms`}
                    {result.statusCode && ` • HTTP ${result.statusCode}`}
                  </div>
                  
                  {result.error && (
                    <div className="text-xs text-red-600 mt-1">
                      {result.error}
                    </div>
                  )}
                  
                  {result.data && (
                    <div className="text-xs text-green-600 mt-1">
                      Estrutura: {Object.keys(result.data).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-4">
          💡 Verifique o console do navegador para logs detalhados dos testes
        </div>
      </CardContent>
    </Card>
  );
};

export default EndpointTester;
