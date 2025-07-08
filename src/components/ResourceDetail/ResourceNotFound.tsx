
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Search, AlertCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ResourceNotFoundProps {
  targetId?: string;
  debugInfo?: any;
}

const ResourceNotFound = ({ targetId, debugInfo }: ResourceNotFoundProps) => {
  const isNumericId = targetId && !isNaN(Number(targetId));
  
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Recurso não encontrado</h1>
            <p className="text-lg text-gray-600">
              O recurso com ID <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{targetId}</code> não foi encontrado.
            </p>
          </div>

          {/* Debug Information Card */}
          {debugInfo && (
            <Card className="max-w-2xl mx-auto text-left">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-gray-900">Informações de Debug</h3>
                </div>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <p><strong>ID procurado:</strong> {debugInfo.targetId} ({debugInfo.targetIdType})</p>
                    <p><strong>É numérico:</strong> {debugInfo.isNumeric ? 'Sim' : 'Não'}</p>
                    <p><strong>Total de recursos:</strong> {debugInfo.totalItems}</p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Recursos disponíveis por tipo:</h4>
                    <div className="space-y-2">
                      {Object.entries(debugInfo.typeBreakdown || {}).map(([type, info]: [string, any]) => (
                        <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <Badge variant={type === 'video' ? 'default' : type === 'podcast' ? 'secondary' : 'outline'}>
                              {type === 'video' && '🎬'}
                              {type === 'podcast' && '🎧'}
                              {type === 'titulo' && '📚'}
                              {type}
                            </Badge>
                            <span>{info.count} itens</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            IDs: {info.idTypes?.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {debugInfo.searchResult && (
                    <div>
                      <h4 className="font-medium mb-2">Resultado da busca:</h4>
                      <div className="p-3 bg-red-50 rounded border border-red-200">
                        <p className="text-red-700">
                          <strong>Status:</strong> {debugInfo.searchResult.found ? 'Encontrado' : 'Não encontrado'}
                        </p>
                        {debugInfo.searchResult.reason && (
                          <p className="text-red-600 text-xs mt-1">{debugInfo.searchResult.reason}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggestions based on ID type */}
          <div className="space-y-4">
            {isNumericId ? (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">💡 Dica: ID Numérico Detectado</h3>
                <p className="text-blue-800 text-sm">
                  O ID <code>{targetId}</code> parece ser numérico. Os podcasts geralmente usam IDs no formato texto/UUID.
                  Se você está procurando um podcast específico, verifique se o ID está correto.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-2">🎧 Procurando por um Podcast?</h3>
                <p className="text-purple-800 text-sm">
                  Este ID parece ser de um podcast. Certifique-se de que está usando o ID correto do episódio.
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/buscar">
              <Button variant="outline" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Fazer uma Busca
              </Button>
            </Link>
            
            <Link to="/">
              <Button className="bg-lsb-primary hover:bg-lsb-primary/90 text-white flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Início
              </Button>
            </Link>
          </div>

          {/* Additional help */}
          <div className="text-sm text-gray-500 space-y-1">
            <p>Precisa de ajuda? Experimente:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Verificar se o link foi copiado corretamente</li>
              <li>Usar a busca para encontrar o recurso desejado</li>
              <li>Navegar pelas categorias na página inicial</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceNotFound;
