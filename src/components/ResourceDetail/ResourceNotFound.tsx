
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Search, AlertCircle, Info, Lightbulb, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ResourceNotFoundProps {
  targetId?: string;
  debugInfo?: any;
}

const ResourceNotFound = ({ targetId, debugInfo }: ResourceNotFoundProps) => {
  const isNumericId = targetId && !isNaN(Number(targetId));
  
  // Análise inteligente do tipo de ID
  const analyzeIdType = () => {
    if (!targetId) return { type: 'unknown', confidence: 'low', suggestions: [] };
    
    if (isNumericId) {
      const numId = parseInt(targetId);
      if (numId >= 1000 && numId <= 9999) {
        return {
          type: 'video_or_book',
          confidence: 'high',
          suggestions: ['Tente buscar por vídeos ou livros com este ID', 'Use a busca para encontrar conteúdo similar']
        };
      }
      return {
        type: 'numeric',
        confidence: 'medium',
        suggestions: ['IDs numéricos geralmente correspondem a vídeos ou livros', 'Podcasts usam IDs no formato texto/UUID']
      };
    }
    
    // Se contém hífens ou é muito longo, provavelmente é UUID
    if (targetId.includes('-') || targetId.length > 20) {
      return {
        type: 'uuid_or_string',
        confidence: 'high',
        suggestions: ['Este formato é típico de podcasts', 'Verifique se o ID foi copiado corretamente']
      };
    }
    
    return {
      type: 'text',
      confidence: 'medium',
      suggestions: ['IDs de texto podem ser de qualquer tipo de recurso', 'Tente usar a busca para encontrar o conteúdo']
    };
  };

  const idAnalysis = analyzeIdType();
  
  // Sugestões de recursos similares baseadas no debug info
  const getSimilarResources = () => {
    if (!debugInfo?.typeBreakdown) return [];
    
    const suggestions = [];
    
    if (isNumericId && debugInfo.typeBreakdown.video?.count > 0) {
      suggestions.push({
        type: 'video',
        icon: '🎬',
        message: `Encontramos ${debugInfo.typeBreakdown.video.count} vídeos disponíveis`,
        action: 'Explorar vídeos'
      });
    }
    
    if (isNumericId && debugInfo.typeBreakdown.titulo?.count > 0) {
      suggestions.push({
        type: 'book',
        icon: '📚',
        message: `Encontramos ${debugInfo.typeBreakdown.titulo.count} livros disponíveis`,
        action: 'Explorar livros'
      });
    }
    
    if (!isNumericId && debugInfo.typeBreakdown.podcast?.count > 0) {
      suggestions.push({
        type: 'podcast',
        icon: '🎧',
        message: `Encontramos ${debugInfo.typeBreakdown.podcast.count} podcasts disponíveis`,
        action: 'Explorar podcasts'
      });
    }
    
    return suggestions;
  };

  const similarResources = getSimilarResources();
  
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

          {/* Análise Inteligente do ID */}
          <Card className="max-w-2xl mx-auto text-left">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold text-gray-900">Análise do ID</h3>
                <Badge variant={idAnalysis.confidence === 'high' ? 'default' : 'secondary'}>
                  {idAnalysis.confidence === 'high' ? 'Alta confiança' : 'Média confiança'}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-900 font-medium">
                    {isNumericId ? (
                      <>🔢 ID Numérico detectado</>
                    ) : (
                      <>📝 ID de Texto detectado</>
                    )}
                  </p>
                  <p className="text-blue-800 text-sm mt-1">
                    {isNumericId ? (
                      <>IDs numéricos geralmente correspondem a <strong>vídeos</strong> ou <strong>livros</strong>. Podcasts usam IDs no formato UUID/string.</>
                    ) : (
                      <>IDs de texto/UUID geralmente correspondem a <strong>podcasts</strong>. Verifique se foi copiado corretamente.</>
                    )}
                  </p>
                </div>
                
                {idAnalysis.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-amber-500 mt-0.5">💡</span>
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recursos Similares Disponíveis */}
          {similarResources.length > 0 && (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Search className="h-5 w-5 text-green-500" />
                  Recursos Disponíveis
                </h3>
                
                <div className="space-y-3">
                  {similarResources.map((resource, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{resource.icon}</span>
                        <span className="text-green-800">{resource.message}</span>
                      </div>
                      <Link to={`/buscar?filtros=${resource.type}`}>
                        <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-100">
                          {resource.action}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Debug Information Card - Mantido para suporte técnico */}
          {debugInfo && (
            <Card className="max-w-2xl mx-auto text-left">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-gray-900">Informações Técnicas</h3>
                  <Badge variant="outline" className="text-xs">Para Suporte</Badge>
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

          {/* Action buttons - Melhorados */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/buscar">
              <Button variant="outline" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Buscar Recursos
              </Button>
            </Link>
            
            <Link to="/">
              <Button className="bg-lsb-primary hover:bg-lsb-primary/90 text-white flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Início
              </Button>
            </Link>
          </div>

          {/* Help section - Melhorada */}
          <div className="text-sm text-gray-500 space-y-3">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-700 mb-2">🔍 Como encontrar o recurso certo:</p>
              <ul className="list-disc list-inside space-y-1 text-left">
                <li><strong>Para podcasts:</strong> Use IDs no formato UUID/string (ex: "abc-123-def")</li>
                <li><strong>Para vídeos/livros:</strong> Use IDs numéricos (ex: 1886, 2045)</li>
                <li><strong>Não tem certeza?</strong> Use a busca por título ou autor</li>
                <li><strong>Link quebrado?</strong> Verifique se foi copiado completamente</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceNotFound;
