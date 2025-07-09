
// Utilitário para testar os endpoints de ID único
export interface EndpointTestResult {
  endpoint: string;
  status: 'success' | 'error' | 'not_found';
  statusCode?: number;
  data?: any;
  error?: string;
  responseTime?: number;
}

export const testEndpoints = async (): Promise<EndpointTestResult[]> => {
  const results: EndpointTestResult[] = [];
  
  // IDs de teste conhecidos (você pode ajustar estes)
  const testCases = [
    { type: 'aula', id: '1', endpoint: 'https://lbs-src1.onrender.com/api/v1/conteudo-lbs/aula/1' },
    { type: 'aula', id: '1000', endpoint: 'https://lbs-src1.onrender.com/api/v1/conteudo-lbs/aula/1000' },
    { type: 'livro', id: '1', endpoint: 'https://lbs-src1.onrender.com/api/v1/conteudo-lbs/livro/1' },
    { type: 'livro', id: '10', endpoint: 'https://lbs-src1.onrender.com/api/v1/conteudo-lbs/livro/10' },
    { type: 'podcast', id: '1', endpoint: 'https://lbs-src1.onrender.com/api/v1/conteudo-lbs/podcast/1' },
    // Teste com UUID para podcast
    { type: 'podcast', id: 'test-uuid', endpoint: 'https://lbs-src1.onrender.com/api/v1/conteudo-lbs/podcast/test-uuid' },
  ];

  for (const testCase of testCases) {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Testando endpoint: ${testCase.endpoint}`);
      
      const response = await fetch(testCase.endpoint, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'LSB-Endpoint-Tester/1.0'
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        results.push({
          endpoint: testCase.endpoint,
          status: 'success',
          statusCode: response.status,
          data: data,
          responseTime
        });
        
        console.log(`✅ Sucesso para ${testCase.type}/${testCase.id}:`, {
          status: response.status,
          responseTime: `${responseTime}ms`,
          dataKeys: Object.keys(data || {})
        });
        
      } else if (response.status === 404) {
        results.push({
          endpoint: testCase.endpoint,
          status: 'not_found',
          statusCode: 404,
          responseTime
        });
        
        console.log(`❌ Não encontrado para ${testCase.type}/${testCase.id} (404)`);
        
      } else {
        results.push({
          endpoint: testCase.endpoint,
          status: 'error',
          statusCode: response.status,
          error: `HTTP ${response.status}`,
          responseTime
        });
        
        console.log(`⚠️  Erro HTTP para ${testCase.type}/${testCase.id}:`, response.status);
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      results.push({
        endpoint: testCase.endpoint,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        responseTime
      });
      
      console.error(`💥 Erro de rede para ${testCase.type}/${testCase.id}:`, error);
    }
  }
  
  return results;
};

// Função para imprimir relatório de testes
export const printTestReport = (results: EndpointTestResult[]) => {
  console.group('📊 RELATÓRIO DE TESTES DOS ENDPOINTS');
  
  const successful = results.filter(r => r.status === 'success');
  const notFound = results.filter(r => r.status === 'not_found');
  const errors = results.filter(r => r.status === 'error');
  
  console.log(`✅ Sucessos: ${successful.length}`);
  console.log(`❌ Não encontrados (404): ${notFound.length}`);
  console.log(`💥 Erros: ${errors.length}`);
  
  if (successful.length > 0) {
    console.group('✅ Endpoints Funcionais:');
    successful.forEach(result => {
      console.log(`- ${result.endpoint} (${result.responseTime}ms)`);
      if (result.data) {
        console.log(`  Estrutura:`, Object.keys(result.data));
        console.log(`  Exemplo:`, {
          id: result.data.id,
          titulo: result.data.titulo || result.data.podcast_titulo,
          autor: result.data.autor || result.data.canal
        });
      }
    });
    console.groupEnd();
  }
  
  if (notFound.length > 0) {
    console.group('❌ IDs Não Encontrados:');
    notFound.forEach(result => {
      console.log(`- ${result.endpoint}`);
    });
    console.groupEnd();
  }
  
  if (errors.length > 0) {
    console.group('💥 Erros de Conexão:');
    errors.forEach(result => {
      console.log(`- ${result.endpoint}: ${result.error}`);
    });
    console.groupEnd();
  }
  
  console.groupEnd();
};
