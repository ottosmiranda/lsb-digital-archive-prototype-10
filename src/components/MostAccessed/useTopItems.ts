
import { useMemo } from 'react';
import { SearchResult } from '@/types/searchTypes';

export const useTopItems = (allData: SearchResult[]): SearchResult[] => {
  return useMemo(() => {
    if (!allData || allData.length === 0) return [];
    
    console.log('🔥 MostAccessed: Processing top items selection...');
    
    // Algoritmo melhorado para "Mais Acessados" - simula popularidade baseada em ID e tipo
    const itemsWithPopularity = allData.map(item => ({
      ...item,
      popularityScore: calculatePopularityScore(item)
    }));
    
    // Ordenar por score de popularidade (decrescente)
    const sortedByPopularity = itemsWithPopularity.sort((a, b) => b.popularityScore - a.popularityScore);
    
    // Pegar os top 6 mais "acessados"
    const topItems = sortedByPopularity.slice(0, 6);
    
    console.log('🔥 MostAccessed: Selected top items:', {
      totalAvailable: allData.length,
      selectedCount: topItems.length,
      typeDistribution: {
        videos: topItems.filter(item => item.type === 'video').length,
        books: topItems.filter(item => item.type === 'titulo').length,
        podcasts: topItems.filter(item => item.type === 'podcast').length
      }
    });
    
    return topItems;
  }, [allData]);
};

// Simula um score de popularidade baseado em características do item (SEM ALEATORIEDADE)
function calculatePopularityScore(item: SearchResult): number {
  let score = 0;
  
  // Base score pelo ID (converter string para hash numérico)
  const idHash = item.id ? hashStringToNumber(item.id) : 1000;
  const idScore = Math.max(1000 - (idHash % 1000), 100);
  score += idScore;
  
  // Bonus por tipo (podcasts tendem a ter mais replay value)
  const typeBonus = {
    'podcast': 300,
    'video': 200,
    'titulo': 100
  };
  score += typeBonus[item.type as keyof typeof typeBonus] || 50;
  
  // Bonus se tem thumbnail (conteúdo mais visual tende a ser mais acessado)
  if (item.thumbnail) {
    score += 150;
  }
  
  // Bonus baseado no comprimento do título (títulos médios performam melhor)
  const titleLength = item.title?.length || 0;
  if (titleLength >= 20 && titleLength <= 60) {
    score += 100;
  }
  
  // REMOVIDO: Aleatoriedade que causava instabilidade
  // score += Math.random() * 50;
  
  // Adicionar um valor fixo baseado no hash do título para variação determinística
  const titleHash = item.title ? hashStringToNumber(item.title) % 50 : 0;
  score += titleHash;
  
  return Math.round(score);
}

// Helper function para converter string ID em número
function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
