import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

interface SearchResult {
  id: number;
  title: string;
  type: 'video' | 'titulo' | 'podcast';
  author: string;
  duration?: string;
  pages?: number;
  thumbnail?: string;
  description: string;
  year: number;
  subject: string;
}

interface SearchFilters {
  resourceType: string[];
  subject: string[];
  author: string;
  year: string;
  duration: string;
}

export const useSearchResults = () => {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>({
    resourceType: [],
    subject: [],
    author: '',
    year: '',
    duration: ''
  });
  const [sortBy, setSortBy] = useState('relevance');
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const resultsPerPage = 9;

  const query = searchParams.get('q') || '';
  
  const appliedFilters = useMemo(() => {
    return searchParams.getAll('filtros') || [];
  }, [searchParams]);

  const totalResults = allResults.length;
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentResults = allResults.slice(startIndex, endIndex);
  const hasMore = currentPage < totalPages;

  // Helper function to check if any filter object has active filters
  const checkHasActiveFilters = (filterObj: SearchFilters): boolean => {
    return filterObj.resourceType.length > 0 || 
           filterObj.subject.length > 0 || 
           Boolean(filterObj.author) || 
           Boolean(filterObj.year) || 
           Boolean(filterObj.duration);
  };

  // Memoized boolean for current filters state
  const hasActiveFilters = useMemo((): boolean => {
    return checkHasActiveFilters(filters);
  }, [filters]);

  const sortResults = (resultsToSort: SearchResult[], sortType: string) => {
    switch (sortType) {
      case 'recent':
        return resultsToSort.sort((a, b) => b.year - a.year);
      
      case 'accessed':
        return resultsToSort.sort(() => Math.random() - 0.5);
      
      case 'type':
        const typeOrder = { 'video': 0, 'podcast': 1, 'titulo': 2 };
        return resultsToSort.sort((a, b) => {
          const aOrder = typeOrder[a.type] ?? 3;
          const bOrder = typeOrder[b.type] ?? 3;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return a.title.localeCompare(b.title);
        });
      
      case 'relevance':
      default:
        return resultsToSort.sort((a, b) => {
          const queryLower = query.toLowerCase();
          const aRelevance = a.title.toLowerCase().includes(queryLower) ? 2 : 0;
          const bRelevance = b.title.toLowerCase().includes(queryLower) ? 2 : 0;
          
          const aScore = aRelevance + (a.year / 1000);
          const bScore = bRelevance + (b.year / 1000);
          
          return bScore - aScore;
        });
    }
  };

  const generateMockResults = (searchQuery: string, currentFilters: SearchFilters) => {
    const mockData = [
      // Videos (35 items)
      {
        id: 1,
        title: 'Introdução à Libras',
        type: 'video' as const,
        author: 'Prof. Maria Silva',
        duration: '25:30',
        thumbnail: '/placeholder.svg',
        description: 'Curso básico de Língua Brasileira de Sinais para iniciantes.',
        year: 2023,
        subject: 'Educação'
      },
      {
        id: 2,
        title: 'Alfabeto em Libras - Parte 1',
        type: 'video' as const,
        author: 'Ana Beatriz Santos',
        duration: '15:45',
        thumbnail: '/placeholder.svg',
        description: 'Aprenda o alfabeto manual da Libras de forma interativa.',
        year: 2023,
        subject: 'Educação'
      },
      {
        id: 3,
        title: 'Números em Libras',
        type: 'video' as const,
        author: 'Carlos Mendes',
        duration: '12:20',
        thumbnail: '/placeholder.svg',
        description: 'Como expressar números de 1 a 100 em Língua de Sinais.',
        year: 2022,
        subject: 'Educação'
      },
      {
        id: 4,
        title: 'Libras no Ambiente Escolar',
        type: 'video' as const,
        author: 'Dra. Fernanda Costa',
        duration: '45:15',
        thumbnail: '/placeholder.svg',
        description: 'Estratégias para inclusão de alunos surdos em escolas regulares.',
        year: 2023,
        subject: 'Inclusão'
      },
      {
        id: 5,
        title: 'História da Língua de Sinais no Brasil',
        type: 'video' as const,
        author: 'Prof. João Batista',
        duration: '38:50',
        thumbnail: '/placeholder.svg',
        description: 'Evolução histórica da Libras no contexto brasileiro.',
        year: 2022,
        subject: 'História'
      },
      {
        id: 6,
        title: 'Tecnologia Assistiva para Surdos',
        type: 'video' as const,
        author: 'Carlos Oliveira',
        duration: '15:45',
        description: 'Como a tecnologia pode ajudar na inclusão de pessoas surdas.',
        year: 2022,
        subject: 'Tecnologia'
      },
      {
        id: 7,
        title: 'Cultura Surda e Identidade',
        type: 'video' as const,
        author: 'Lucia Fernandes',
        duration: '52:30',
        thumbnail: '/placeholder.svg',
        description: 'Explorando os aspectos culturais únicos da comunidade surda.',
        year: 2023,
        subject: 'Cultura Surda'
      },
      {
        id: 8,
        title: 'Interpretação em Libras - Técnicas Básicas',
        type: 'video' as const,
        author: 'Ricardo Almeida',
        duration: '67:20',
        thumbnail: '/placeholder.svg',
        description: 'Fundamentos da interpretação da Língua de Sinais.',
        year: 2022,
        subject: 'Comunicação'
      },
      {
        id: 9,
        title: 'Libras na Área da Saúde',
        type: 'video' as const,
        author: 'Dra. Patricia Lima',
        duration: '41:15',
        thumbnail: '/placeholder.svg',
        description: 'Vocabulário específico de Libras para profissionais da saúde.',
        year: 2023,
        subject: 'Ciências'
      },
      {
        id: 10,
        title: 'Arte e Expressão em Libras',
        type: 'video' as const,
        author: 'Isabella Rocha',
        duration: '29:40',
        thumbnail: '/placeholder.svg',
        description: 'Como a arte visual se integra com a língua de sinais.',
        year: 2022,
        subject: 'Artes'
      },
      {
        id: 11,
        title: 'Direitos da Pessoa Surda',
        type: 'video' as const,
        author: 'Advogado Miguel Torres',
        duration: '55:30',
        thumbnail: '/placeholder.svg',
        description: 'Legislação e direitos garantidos às pessoas surdas no Brasil.',
        year: 2023,
        subject: 'Direitos'
      },
      {
        id: 12,
        title: 'Libras Avançada - Expressões Idiomáticas',
        type: 'video' as const,
        author: 'Prof. Sandra Dias',
        duration: '44:25',
        thumbnail: '/placeholder.svg',
        description: 'Expressões complexas e nuances da Língua de Sinais.',
        year: 2023,
        subject: 'Educação'
      },
      {
        id: 13,
        title: 'Surdocegueira e Comunicação Táctil',
        type: 'video' as const,
        author: 'Helena Martins',
        duration: '36:10',
        thumbnail: '/placeholder.svg',
        description: 'Técnicas de comunicação para pessoas surdocegas.',
        year: 2022,
        subject: 'Inclusão'
      },
      {
        id: 14,
        title: 'Literatura Surda Brasileira',
        type: 'video' as const,
        author: 'Marcos Vieira',
        duration: '48:55',
        thumbnail: '/placeholder.svg',
        description: 'Obras literárias produzidas por autores surdos.',
        year: 2021,
        subject: 'Literatura'
      },
      {
        id: 15,
        title: 'Família e Surdez: Primeiros Passos',
        type: 'video' as const,
        author: 'Psicóloga Clara Ribeiro',
        duration: '33:20',
        thumbnail: '/placeholder.svg',
        description: 'Orientações para famílias com crianças surdas.',
        year: 2023,
        subject: 'Educação'
      },
      {
        id: 16,
        title: 'Libras no Mercado de Trabalho',
        type: 'video' as const,
        author: 'Roberto Campos',
        duration: '27:45',
        thumbnail: '/placeholder.svg',
        description: 'Oportunidades profissionais para surdos e intérpretes.',
        year: 2022,
        subject: 'Inclusão'
      },
      {
        id: 17,
        title: 'Poesia Visual em Libras',
        type: 'video' as const,
        author: 'Poeta Surdo André Lima',
        duration: '19:30',
        thumbnail: '/placeholder.svg',
        description: 'A beleza da poesia expressa em língua de sinais.',
        year: 2023,
        subject: 'Artes'
      },
      {
        id: 18,
        title: 'Educação Bilíngue para Surdos',
        type: 'video' as const,
        author: 'Dra. Vanessa Gomes',
        duration: '56:40',
        thumbnail: '/placeholder.svg',
        description: 'Metodologias de ensino bilíngue Libras-Português.',
        year: 2022,
        subject: 'Educação'
      },
      {
        id: 19,
        title: 'Implante Coclear e Libras',
        type: 'video' as const,
        author: 'Dr. Paulo Henrique',
        duration: '42:15',
        thumbnail: '/placeholder.svg',
        description: 'A relação entre tecnologia auditiva e língua de sinais.',
        year: 2023,
        subject: 'Tecnologia'
      },
      {
        id: 20,
        title: 'Teatro Surdo no Brasil',
        type: 'video' as const,
        author: 'Companhia Mãos Ativas',
        duration: '51:20',
        thumbnail: '/placeholder.svg',
        description: 'História e técnicas do teatro em língua de sinais.',
        year: 2021,
        subject: 'Artes'
      },
      {
        id: 21,
        title: 'Libras e Neurociência',
        type: 'video' as const,
        author: 'Dr. Rafael Neuber',
        duration: '39:45',
        thumbnail: '/placeholder.svg',
        description: 'Como o cérebro processa a língua de sinais.',
        year: 2022,
        subject: 'Ciências'
      },
      {
        id: 22,
        title: 'Surdez na Terceira Idade',
        type: 'video' as const,
        author: 'Geriatra Dra. Márcia Luz',
        duration: '31:50',
        thumbnail: '/placeholder.svg',
        description: 'Adaptação e comunicação com idosos surdos.',
        year: 2023,
        subject: 'Ciências'
      },
      {
        id: 23,
        title: 'Libras para Profissionais de Turismo',
        type: 'video' as const,
        author: 'Guia Turístico Alex Santos',
        duration: '24:35',
        thumbnail: '/placeholder.svg',
        description: 'Vocabulário essencial para atendimento turístico.',
        year: 2022,
        subject: 'Comunicação'
      },
      {
        id: 24,
        title: 'Música Visual e Surdez',
        type: 'video' as const,
        author: 'Artista Surda Camila Reis',
        duration: '28:10',
        thumbnail: '/placeholder.svg',
        description: 'Como surdos experimentam e criam música.',
        year: 2023,
        subject: 'Artes'
      },
      {
        id: 25,
        title: 'Libras na Informática',
        type: 'video' as const,
        author: 'Programador João Pedro',
        duration: '35:25',
        thumbnail: '/placeholder.svg',
        description: 'Terminologia técnica de informática em Libras.',
        year: 2022,
        subject: 'Tecnologia'
      },
      {
        id: 26,
        title: 'Psicologia e Comunidade Surda',
        type: 'video' as const,
        author: 'Psicóloga Surda Leticia Moura',
        duration: '47:30',
        thumbnail: '/placeholder.svg',
        description: 'Aspectos psicológicos únicos da experiência surda.',
        year: 2023,
        subject: 'Ciências'
      },
      {
        id: 27,
        title: 'Libras Regional: Variações pelo Brasil',
        type: 'video' as const,
        author: 'Pesquisador Dr. Antônio Rocha',
        duration: '53:15',
        thumbnail: '/placeholder.svg',
        description: 'Diferenças regionais na Língua de Sinais Brasileira.',
        year: 2021,
        subject: 'Cultura Surda'
      },
      {
        id: 28,
        title: 'Esporte e Surdez',
        type: 'video' as const,
        author: 'Atleta Surdo Rodrigo Silva',
        duration: '32:40',
        thumbnail: '/placeholder.svg',
        description: 'Surdolimpíadas e esporte adaptado.',
        year: 2022,
        subject: 'Inclusão'
      },
      {
        id: 29,
        title: 'Libras no Ensino Superior',
        type: 'video' as const,
        author: 'Prof. Universitário Daniel Costa',
        duration: '41:55',
        thumbnail: '/placeholder.svg',
        description: 'Acessibilidade no ensino universitário.',
        year: 2023,
        subject: 'Educação'
      },
      {
        id: 30,
        title: 'Economia e Mercado Surdo',
        type: 'video' as const,
        author: 'Economista Surda Marina Luz',
        duration: '38:20',
        thumbnail: '/placeholder.svg',
        description: 'Impacto econômico da comunidade surda.',
        year: 2022,
        subject: 'Inclusão'
      },
      {
        id: 31,
        title: 'Libras e Matemática',
        type: 'video' as const,
        author: 'Prof. Matemática José Carlos',
        duration: '44:30',
        thumbnail: '/placeholder.svg',
        description: 'Ensino de matemática para alunos surdos.',
        year: 2023,
        subject: 'Educação'
      },
      {
        id: 32,
        title: 'Comunicação Intercultural Surda',
        type: 'video' as const,
        author: 'Antropóloga Dra. Silvia Prado',
        duration: '49:15',
        thumbnail: '/placeholder.svg',
        description: 'Diferenças culturais entre comunidades surdas mundiais.',
        year: 2021,
        subject: 'Cultura Surda'
      },
      {
        id: 33,
        title: 'Libras e Segurança Pública',
        type: 'video' as const,
        author: 'Delegado Marcos Ribeiro',
        duration: '36:50',
        thumbnail: '/placeholder.svg',
        description: 'Atendimento policial para pessoas surdas.',
        year: 2022,
        subject: 'Direitos'
      },
      {
        id: 34,
        title: 'Tradução Automática de Libras',
        type: 'video' as const,
        author: 'Eng. Software Ana Paula',
        duration: '33:25',
        thumbnail: '/placeholder.svg',
        description: 'Tecnologias emergentes para tradução automática.',
        year: 2023,
        subject: 'Tecnologia'
      },
      {
        id: 35,
        title: 'Cinema Surdo Brasileiro',
        type: 'video' as const,
        author: 'Cineasta Surdo Lucas Monteiro',
        duration: '58:40',
        thumbnail: '/placeholder.svg',
        description: 'Produção cinematográfica da comunidade surda.',
        year: 2022,
        subject: 'Artes'
      },

      // Books/Títulos (35 items)
      {
        id: 36,
        title: 'História da Comunidade Surda',
        type: 'titulo' as const,
        author: 'João Santos',
        pages: 245,
        description: 'Uma análise histórica da evolução da comunidade surda no Brasil.',
        year: 2022,
        subject: 'História'
      },
      {
        id: 37,
        title: 'Cultura Surda no Brasil',
        type: 'titulo' as const,
        author: 'Maria Silva',
        pages: 180,
        description: 'Explorando a rica cultura da comunidade surda brasileira.',
        year: 2023,
        subject: 'Cultura Surda'
      },
      {
        id: 38,
        title: 'Manual Completo de Libras',
        type: 'titulo' as const,
        author: 'Prof. Eduardo Mendes',
        pages: 420,
        description: 'Guia completo para aprendizado da Língua Brasileira de Sinais.',
        year: 2023,
        subject: 'Educação'
      },
      {
        id: 39,
        title: 'Inclusão Escolar de Alunos Surdos',
        type: 'titulo' as const,
        author: 'Dra. Carmen Lúcia',
        pages: 312,
        description: 'Estratégias pedagógicas para educação inclusiva.',
        year: 2022,
        subject: 'Inclusão'
      },
      {
        id: 40,
        title: 'Linguística das Línguas de Sinais',
        type: 'titulo' as const,
        author: 'PhD. Robert Johnson',
        pages: 567,
        description: 'Análise científica da estrutura das línguas de sinais.',
        year: 2021,
        subject: 'Ciências'
      },
      {
        id: 41,
        title: 'Direitos da Pessoa Surda no Brasil',
        type: 'titulo' as const,
        author: 'Advogada Fernanda Torres',
        pages: 198,
        description: 'Marco legal e conquistas da comunidade surda.',
        year: 2023,
        subject: 'Direitos'
      },
      {
        id: 42,
        title: 'Tecnologia Assistiva para Surdez',
        type: 'titulo' as const,
        author: 'Eng. Carlos Roberto',
        pages: 275,
        description: 'Inovações tecnológicas para acessibilidade surda.',
        year: 2022,
        subject: 'Tecnologia'
      },
      {
        id: 43,
        title: 'Arte e Expressão Visual Surda',
        type: 'titulo' as const,
        author: 'Artista Plástica Luna Oliveira',
        pages: 156,
        description: 'Como a arte visual representa a experiência surda.',
        year: 2023,
        subject: 'Artes'
      },
      {
        id: 44,
        title: 'Psicologia da Surdez',
        type: 'titulo' as const,
        author: 'Dr. Marcelo Freitas',
        pages: 389,
        description: 'Aspectos psicológicos do desenvolvimento surdo.',
        year: 2021,
        subject: 'Ciências'
      },
      {
        id: 45,
        title: 'Literatura Surda Contemporânea',
        type: 'titulo' as const,
        author: 'Escritor Surdo Pedro Almada',
        pages: 234,
        description: 'Coletânea de obras literárias de autores surdos.',
        year: 2022,
        subject: 'Literatura'
      },
      {
        id: 46,
        title: 'Metodologia do Ensino de Libras',
        type: 'titulo' as const,
        author: 'Profa. Dra. Regina Santos',
        pages: 341,
        description: 'Técnicas pedagógicas para ensino de língua de sinais.',
        year: 2023,
        subject: 'Educação'
      },
      {
        id: 47,
        title: 'Surdocegueira: Desafios e Possibilidades',
        type: 'titulo' as const,
        author: 'Especialista Maria Helena',
        pages: 287,
        description: 'Guia completo sobre surdocegueira e comunicação táctil.',
        year: 2022,
        subject: 'Inclusão'
      },
      {
        id: 48,
        title: 'História das Escolas de Surdos',
        type: 'titulo' as const,
        author: 'Historiador Antonio Dias',
        pages: 445,
        description: 'Evolução da educação especial para surdos no mundo.',
        year: 2021,
        subject: 'História'
      },
      {
        id: 49,
        title: 'Identidade e Cultura Surda',
        type: 'titulo' as const,
        author: 'Sociólogo Surdo Gabriel Cruz',
        pages: 201,
        description: 'Construção da identidade na comunidade surda.',
        year: 2023,
        subject: 'Cultura Surda'
      },
      {
        id: 50,
        title: 'Tradução e Interpretação em Libras',
        type: 'titulo' as const,
        author: 'Intérprete Senior Ana Claudia',
        pages: 356,
        description: 'Manual prático para intérpretes de língua de sinais.',
        year: 2022,
        subject: 'Comunicação'
      },
      {
        id: 51,
        title: 'Família e Surdez: Um Guia Prático',
        type: 'titulo' as const,
        author: 'Terapeuta Familiar Juliana Rocha',
        pages: 189,
        description: 'Orientações para famílias com membros surdos.',
        year: 2023,
        subject: 'Educação'
      },
      {
        id: 52,
        title: 'Neurociência da Linguagem de Sinais',
        type: 'titulo' as const,
        author: 'Neurocientista Dr. Paulo Brito',
        pages: 467,
        description: 'Bases neurológicas do processamento de línguas visuais.',
        year: 2021,
        subject: 'Ciências'
      },
      {
        id: 53,
        title: 'Teatro Surdo: Técnicas e História',
        type: 'titulo' as const,
        author: 'Diretor Teatral Marcos Lima',
        pages: 223,
        description: 'Desenvolvimento do teatro na comunidade surda.',
        year: 2022,
        subject: 'Artes'
      },
      {
        id: 54,
        title: 'Libras Jurídica',
        type: 'titulo' as const,
        author: 'Juiz Federal Roberto Andrade',
        pages: 334,
        description: 'Terminologia jurídica em língua de sinais.',
        year: 2023,
        subject: 'Direitos'
      },
      {
        id: 55,
        title: 'Educação Infantil para Crianças Surdas',
        type: 'titulo' as const,
        author: 'Pedagoga Surda Cristina Moura',
        pages: 267,
        description: 'Metodologias para educação infantil inclusiva.',
        year: 2022,
        subject: 'Educação'
      },
      {
        id: 56,
        title: 'Música e Surdez: Percepção Visual',
        type: 'titulo' as const,
        author: 'Musicoterapeuta Sofia Campos',
        pages: 178,
        description: 'Como pessoas surdos experimentam música.',
        year: 2023,
        subject: 'Artes'
      },
      {
        id: 57,
        title: 'Comunicação Total e Oralismo',
        type: 'titulo' as const,
        author: 'Fonoaudióloga Dra. Lúcia Marques',
        pages: 298,
        description: 'Diferentes abordagens na educação de surdos.',
        year: 2021,
        subject: 'Educação'
      },
      {
        id: 58,
        title: 'Surdez e Mercado de Trabalho',
        type: 'titulo' as const,
        author: 'Consultor RH Surdo Rafael Gomes',
        pages: 156,
        description: 'Inclusão profissional e oportunidades de carreira.',
        year: 2022,
        subject: 'Inclusão'
      },
      {
        id: 59,
        title: 'Libras Científica e Acadêmica',
        type: 'titulo' as const,
        author: 'Pesquisador Dr. Felipe Santos',
        pages: 412,
        description: 'Terminologia científica em língua de sinais.',
        year: 2023,
        subject: 'Ciências'
      },
      {
        id: 60,
        title: 'Poesia Visual em Libras',
        type: 'titulo' as const,
        author: 'Poeta Surda Isabella Nunes',
        pages: 134,
        description: 'Antologia de poemas em língua de sinais.',
        year: 2022,
        subject: 'Literatura'
      },
      {
        id: 61,
        title: 'Surdez Súbita: Adaptação e Apoio',
        type: 'titulo' as const,
        author: 'Otorrinolaringologista Dr. André Costa',
        pages: 245,
        description: 'Guia para pessoas com surdez adquirida.',
        year: 2023,
        subject: 'Ciências'
      },
      {
        id: 62,
        title: 'Comunidades Surdas Rurais',
        type: 'titulo' as const,
        author: 'Antropóloga Rural Dra. Cláudia Reis',
        pages: 189,
        description: 'Línguas de sinais em comunidades isoladas.',
        year: 2021,
        subject: 'Cultura Surda'
      },
      {
        id: 63,
        title: 'Tecnologia Educacional para Surdos',
        type: 'titulo' as const,
        author: 'Designer Instrucional Laura Martins',
        pages: 278,
        description: 'Ferramentas digitais para educação surda.',
        year: 2022,
        subject: 'Tecnologia'
      },
      {
        id: 64,
        title: 'Libras e Direitos Humanos',
        type: 'titulo' as const,
        author: 'Ativista Surdo Miguel Fernandes',
        pages: 234,
        description: 'Luta pelos direitos linguísticos surdos.',
        year: 2023,
        subject: 'Direitos'
      },
      {
        id: 65,
        title: 'Cinema e Representação Surda',
        type: 'titulo' as const,
        author: 'Crítico de Cinema Surdo Thiago Luz',
        pages: 201,
        description: 'Análise da representação surda no cinema.',
        year: 2022,
        subject: 'Artes'
      },
      {
        id: 66,
        title: 'Matemática Visual para Surdos',
        type: 'titulo' as const,
        author: 'Prof. Matemática Surdo Ricardo Dias',
        pages: 345,
        description: 'Metodologias visuais para ensino de matemática.',
        year: 2023,
        subject: 'Educação'
      },
      {
        id: 67,
        title: 'Esporte Surdo: História e Conquistas',
        type: 'titulo' as const,
        author: 'Jornalista Esportivo Carlos Moura',
        pages: 167,
        description: 'Trajetória do esporte na comunidade surda.',
        year: 2021,
        subject: 'Inclusão'
      },
      {
        id: 68,
        title: 'Libras Médica: Vocabulário Especializado',
        type: 'titulo' as const,
        author: 'Médico Surdo Dr. Alexandre Lima',
        pages: 289,
        description: 'Terminologia médica em língua de sinais.',
        year: 2022,
        subject: 'Ciências'
      },
      {
        id: 69,
        title: 'Dança e Expressão Corporal Surda',
        type: 'titulo' as const,
        author: 'Coreógrafa Surda Beatriz Santos',
        pages: 156,
        description: 'A dança como forma de expressão visual.',
        year: 2023,
        subject: 'Artes'
      },
      {
        id: 70,
        title: 'Comunicação Organizacional Inclusiva',
        type: 'titulo' as const,
        author: 'Consultora Surda Patricia Oliveira',
        pages: 212,
        description: 'Inclusão surda no ambiente corporativo.',
        year: 2022,
        subject: 'Comunicação'
      },

      // Podcasts (30 items)
      {
        id: 71,
        title: 'Podcast Mãos que Falam',
        type: 'podcast' as const,
        author: 'Ana Costa',
        duration: '45:20',
        description: 'Conversas sobre inclusão e acessibilidade.',
        year: 2023,
        subject: 'Inclusão'
      },
      {
        id: 72,
        title: 'Vozes Silenciosas',
        type: 'podcast' as const,
        author: 'Marcos Vieira',
        duration: '52:15',
        description: 'Histórias inspiradoras da comunidade surda.',
        year: 2023,
        subject: 'Cultura Surda'
      },
      {
        id: 73,
        title: 'Educação Inclusiva em Pauta',
        type: 'podcast' as const,
        author: 'Profa. Carla Mendes',
        duration: '38:45',
        description: 'Discussões sobre metodologias educacionais inclusivas.',
        year: 2022,
        subject: 'Educação'
      },
      {
        id: 74,
        title: 'Tech Acessível',
        type: 'podcast' as const,
        author: 'Desenvolvedor Surdo João Tech',
        duration: '41:30',
        description: 'Tecnologia e inovação para pessoas com deficiência.',
        year: 2023,
        subject: 'Tecnologia'
      },
      {
        id: 75,
        title: 'Arte Sem Barreiras',
        type: 'podcast' as const,
        author: 'Coletivo Arte Surda',
        duration: '35:20',
        description: 'Artistas surdos compartilham suas experiências.',
        year: 2022,
        subject: 'Artes'
      },
      {
        id: 76,
        title: 'Direitos em Discussão',
        type: 'podcast' as const,
        author: 'Advogado Surdo Renato Silva',
        duration: '47:10',
        description: 'Análise de casos jurídicos envolvendo direitos surdos.',
        year: 2023,
        subject: 'Direitos'
      },
      {
        id: 77,
        title: 'Ciência e Surdez',
        type: 'podcast' as const,
        author: 'Dra. Neurocientista Laura Campos',
        duration: '43:55',
        description: 'Pesquisas científicas sobre surdez e linguagem.',
        year: 2022,
        subject: 'Ciências'
      },
      {
        id: 78,
        title: 'Literatura Surda Podcast',
        type: 'podcast' as const,
        author: 'Escritor Surdo André Narrativas',
        duration: '39:25',
        description: 'Discussões sobre obras literárias surdas.',
        year: 2023,
        subject: 'Literatura'
      },
      {
        id: 79,
        title: 'Comunicação e Inclusão',
        type: 'podcast' as const,
        author: 'Intérprete Sandra Comunica',
        duration: '44:15',
        description: 'Estratégias de comunicação inclusiva.',
        year: 2022,
        subject: 'Comunicação'
      },
      {
        id: 80,
        title: 'História Surda Brasil',
        type: 'podcast' as const,
        author: 'Historiador Surdo Carlos Memória',
        duration: '51:40',
        description: 'Marcos históricos da comunidade surda brasileira.',
        year: 2021,
        subject: 'História'
      },
      {
        id: 81,
        title: 'Família e Surdez Podcast',
        type: 'podcast' as const,
        author: 'Psicóloga Familiar Rita Apoio',
        duration: '36:30',
        description: 'Orientações para famílias com membros surdos.',
        year: 2023,
        subject: 'Educação'
      },
      {
        id: 82,
        title: 'Esporte e Superação',
        type: 'podcast' as const,
        author: 'Atleta Paralímpico Surdo Bruno Vitória',
        duration: '42:50',
        description: 'Histórias de atletas surdos e suas conquistas.',
        year: 2022,
        subject: 'Inclusão'
      },
      {
        id: 83,
        title: 'Inovação Assistiva',
        type: 'podcast' as const,
        author: 'Engenheira Biomédica Dra. Inova',
        duration: '40:20',
        description: 'Últimas inovações em tecnologia assistiva.',
        year: 2023,
        subject: 'Tecnologia'
      },
      {
        id: 84,
        title: 'Teatro Surdo em Cena',
        type: 'podcast' as const,
        author: 'Diretor Teatral Surdo Palco Silva',
        duration: '48:35',
        description: 'Bastidores do teatro na comunidade surda.',
        year: 2022,
        subject: 'Artes'
      },
      {
        id: 85,
        title: 'Pesquisa e Surdez',
        type: 'podcast' as const,
        author: 'Pesquisadora Dra. Descoberta Rocha',
        duration: '45:15',
        description: 'Últimas pesquisas acadêmicas sobre surdez.',
        year: 2023,
        subject: 'Ciências'
      },
      {
        id: 86,
        title: 'Mercado de Trabalho Inclusivo',
        type: 'podcast' as const,
        author: 'Consultor RH Inclusivo Pedro Carreira',
        duration: '37:40',
        description: 'Oportunidades profissionais para pessoas surdas.',
        year: 2022,
        subject: 'Inclusão'
      },
      {
        id: 87,
        title: 'Libras na Prática',
        type: 'podcast' as const,
        author: 'Professor Libras Prático Edu Sinais',
        duration: '33:25',
        description: 'Dicas práticas para aprendizado de Libras.',
        year: 2023,
        subject: 'Educação'
      },
      {
        id: 88,
        title: 'Música e Vibração',
        type: 'podcast' as const,
        author: 'Musicoterapeuta Surda Melodia Tátil',
        duration: '41:10',
        description: 'Como surdos experimentam música através de vibrações.',
        year: 2022,
        subject: 'Artes'
      },
      {
        id: 89,
        title: 'Advocacia Surda',
        type: 'podcast' as const,
        author: 'Advogada Surda Justiça Silva',
        duration: '49:30',
        description: 'Casos jurídicos e conquistas legais surdas.',
        year: 2023,
        subject: 'Direitos'
      },
      {
        id: 90,
        title: 'Neurociência da Linguagem',
        type: 'podcast' as const,
        author: 'Neurocientista Dr. Cérebro Linguagem',
        duration: '46:45',
        description: 'Como o cérebro processa línguas de sinais.',
        year: 2021,
        subject: 'Ciências'
      },
      {
        id: 91,
        title: 'Cultura Global Surda',
        type: 'podcast' as const,
        author: 'Antropóloga Cultural Dra. Mundo Surdo',
        duration: '44:20',
        description: 'Comparação entre culturas surdas mundiais.',
        year: 2022,
        subject: 'Cultura Surda'
      },
      {
        id: 92,
        title: 'Empreendedorismo Surdo',
        type: 'podcast' as const,
        author: 'Empreendedor Surdo Negócio Inovador',
        duration: '38:55',
        description: 'Histórias de sucesso empresarial surdo.',
        year: 2023,
        subject: 'Inclusão'
      },
      {
        id: 93,
        title: 'Poesia em Movimento',
        type: 'podcast' as const,
        author: 'Poeta Surdo Versos Visuais',
        duration: '29:15',
        description: 'Discussões sobre poesia visual e literatura surda.',
        year: 2022,
        subject: 'Literatura'
      },
      {
        id: 94,
        title: 'Saúde e Bem-estar Surdo',
        type: 'podcast' as const,
        author: 'Médica Surda Dra. Saúde Inclusiva',
        duration: '42:30',
        description: 'Cuidados de saúde específicos para surdos.',
        year: 2023,
        subject: 'Ciências'
      },
      {
        id: 95,
        title: 'Cinema Surdo Internacional',
        type: 'podcast' as const,
        author: 'Cineasta Surdo Diretor Mundial',
        duration: '53:20',
        description: 'Produções cinematográficas surdas pelo mundo.',
        year: 2021,
        subject: 'Artes'
      },
      {
        id: 96,
        title: 'Educação Digital Acessível',
        type: 'podcast' as const,
        author: 'Pedagoga Digital Professora Online',
        duration: '40:10',
        description: 'Metodologias de ensino digital para surdos.',
        year: 2022,
        subject: 'Educação'
      },
      {
        id: 97,
        title: 'Tradução e Tecnologia',
        type: 'podcast' as const,
        author: 'Tradutor Tech Futuro Libras',
        duration: '37:45',
        description: 'Futuro da tradução automática de Libras.',
        year: 2023,
        subject: 'Tecnologia'
      },
      {
        id: 98,
        title: 'Ativismo e Mudança Social',
        type: 'podcast' as const,
        author: 'Ativista Surdo Revolução Pacífica',
        duration: '47:25',
        description: 'Movimentos sociais e ativismo surdo.',
        year: 2022,
        subject: 'Direitos'
      },
      {
        id: 99,
        title: 'Comunicação Interpessoal',
        type: 'podcast' as const,
        author: 'Terapeuta Comunicação Dra. Diálogo',
        duration: '34:50',
        description: 'Melhorando a comunicação entre surdos e ouvintes.',
        year: 2023,
        subject: 'Comunicação'
      },
      {
        id: 100,
        title: 'Futuro da Comunidade Surda',
        type: 'podcast' as const,
        author: 'Futurista Surdo Visão 2030',
        duration: '52:40',
        description: 'Perspectivas futuras para a comunidade surda.',
        year: 2023,
        subject: 'Cultura Surda'
      }
    ];

    return mockData.filter(item => {
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        const matchesQuery = item.title.toLowerCase().includes(queryLower) ||
                           item.description.toLowerCase().includes(queryLower) ||
                           item.author.toLowerCase().includes(queryLower) ||
                           item.subject.toLowerCase().includes(queryLower);
        if (!matchesQuery) return false;
      }

      if (currentFilters.resourceType.length > 0) {
        if (!currentFilters.resourceType.includes(item.type)) return false;
      }

      if (currentFilters.subject.length > 0) {
        if (!currentFilters.subject.includes(item.subject)) return false;
      }

      if (currentFilters.author) {
        const authorLower = currentFilters.author.toLowerCase();
        if (!item.author.toLowerCase().includes(authorLower)) return false;
      }

      if (currentFilters.year) {
        if (item.year.toString() !== currentFilters.year) return false;
      }

      if (currentFilters.duration && (item.type === 'video' || item.type === 'podcast')) {
        const duration = item.duration;
        if (duration) {
          const [minutes] = duration.split(':').map(Number);
          switch (currentFilters.duration) {
            case 'short':
              if (minutes > 10) return false;
              break;
            case 'medium':
              if (minutes <= 10 || minutes > 30) return false;
              break;
            case 'long':
              if (minutes <= 30) return false;
              break;
          }
        }
      }

      return true;
    });
  };

  const performSearch = (searchQuery: string, currentFilters: SearchFilters) => {
    setLoading(true);
    console.log('Performing search with:', { searchQuery, currentFilters });
    
    setTimeout(() => {
      if (searchQuery || checkHasActiveFilters(currentFilters)) {
        const searchResults = generateMockResults(searchQuery, currentFilters);
        const sortedResults = sortResults(searchResults, sortBy);
        console.log('Search results:', sortedResults);
        setAllResults(sortedResults);
      } else {
        setAllResults([]);
      }
      setLoading(false);
    }, 500);
  };

  // Initialize filters from URL params only once
  useEffect(() => {
    if (appliedFilters.length > 0) {
      setFilters(prev => ({
        ...prev,
        resourceType: appliedFilters
      }));
    }
  }, []);

  // Perform search when query changes or on initial load
  useEffect(() => {
    console.log('Search triggered with query:', query);
    performSearch(query, filters);
    setCurrentPage(1);
  }, [query]);

  // Perform search when filters change
  useEffect(() => {
    if (query || hasActiveFilters) {
      console.log('Filter search triggered with filters:', filters);
      performSearch(query, filters);
      setCurrentPage(1);
    }
  }, [filters]);

  // Sort results when sortBy changes
  useEffect(() => {
    if (allResults.length > 0) {
      console.log('Sorting results by:', sortBy);
      const sortedResults = sortResults([...allResults], sortBy);
      setAllResults(sortedResults);
      setCurrentPage(1);
    }
  }, [sortBy]);

  const handleFilterChange = (newFilters: SearchFilters) => {
    console.log('Filters changed:', newFilters);
    setFilters(newFilters);
  };

  const handleSortChange = (newSort: string) => {
    console.log('Sort changed to:', newSort);
    setSortBy(newSort);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    query,
    filters,
    sortBy,
    currentResults,
    totalResults,
    totalPages,
    currentPage,
    loading,
    hasActiveFilters,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    setFilters
  };
};
