
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchFilters {
  resourceType: string[]
  subject: string[]
  author: string[]
  year: string
  duration: string
  language: string[]
  documentType: string[]
  program: string[]
  channel: string[]
}

interface SearchResult {
  id: number
  originalId?: string
  title: string
  type: 'video' | 'titulo' | 'podcast'
  author: string
  duration?: string
  pages?: number
  episodes?: string | number
  thumbnail?: string
  description: string
  year: number | null
  subject: string
  embedUrl?: string
  pdfUrl?: string
  documentType?: string
  pais?: string
  language?: string
  program?: string
  channel?: string
  categories?: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query, filters, sortBy, page, resultsPerPage } = await req.json()
    const requestId = `search_${Date.now()}`
    
    console.log(`🔍 ${requestId} - Edge Function Search Request`)
    console.log('📋 Parameters:', { query, filters, sortBy, page, resultsPerPage })

    const response = await performPaginatedSearch(query, filters, sortBy, page, resultsPerPage, requestId)
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('❌ Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        results: [],
        pagination: { currentPage: 1, totalPages: 0, totalResults: 0, hasNextPage: false, hasPreviousPage: false }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function performPaginatedSearch(
  query: string,
  filters: SearchFilters,
  sortBy: string,
  page: number,
  resultsPerPage: number,
  requestId: string
) {
  console.log(`🚀 ${requestId} - Starting paginated search`)
  console.log('🔍 Search parameters:', { query, filters, sortBy, page, resultsPerPage })

  try {
    let allItems: SearchResult[] = []
    
    // Determinar quais tipos buscar
    const shouldSearchBooks = !filters.resourceType.length || 
                             filters.resourceType.includes('all') || 
                             filters.resourceType.includes('titulo')
    
    const shouldSearchArticles = !filters.resourceType.length || 
                                filters.resourceType.includes('all') || 
                                filters.resourceType.includes('titulo')
    
    const shouldSearchVideos = !filters.resourceType.length || 
                              filters.resourceType.includes('all') || 
                              filters.resourceType.includes('video')
    
    const shouldSearchPodcasts = !filters.resourceType.length || 
                                filters.resourceType.includes('all') || 
                                filters.resourceType.includes('podcast')

    console.log(`📊 ${requestId} - Search targets:`, {
      books: shouldSearchBooks,
      articles: shouldSearchArticles, 
      videos: shouldSearchVideos,
      podcasts: shouldSearchPodcasts
    })

    // Buscar dados em paralelo conforme necessário
    const promises: Promise<SearchResult[]>[] = []
    
    if (shouldSearchBooks) {
      console.log(`📚 ${requestId} - Fetching books...`)
      promises.push(fetchFromAPI('livro', requestId))
    }
    
    if (shouldSearchArticles) {
      console.log(`📄 ${requestId} - Fetching articles...`)
      promises.push(fetchFromAPI('artigos', requestId))
    }
    
    if (shouldSearchVideos) {
      console.log(`🎬 ${requestId} - Fetching videos...`)
      promises.push(fetchFromAPI('aula', requestId))
    }
    
    if (shouldSearchPodcasts) {
      console.log(`🎧 ${requestId} - Fetching podcasts...`)
      promises.push(fetchFromAPI('podcast', requestId))
    }

    // Aguardar todas as buscas
    const results = await Promise.allSettled(promises)
    
    results.forEach((result, index) => {
      const types = ['books', 'articles', 'videos', 'podcasts']
      const activeTypes = []
      if (shouldSearchBooks) activeTypes.push('books')
      if (shouldSearchArticles) activeTypes.push('articles') 
      if (shouldSearchVideos) activeTypes.push('videos')
      if (shouldSearchPodcasts) activeTypes.push('podcasts')
      
      const typeName = activeTypes[index] || `type_${index}`
      
      if (result.status === 'fulfilled') {
        const items = result.value
        console.log(`✅ ${requestId} - ${typeName}: ${items.length} items loaded`)
        allItems.push(...items)
      } else {
        console.error(`❌ ${requestId} - ${typeName} failed:`, result.reason)
      }
    })

    console.log(`📦 ${requestId} - Total items before filtering: ${allItems.length}`)

    // DEPURAÇÃO CRÍTICA: Aplicar filtros com logs detalhados
    const filteredItems = applyFilters(allItems, query, filters, requestId)
    console.log(`🔍 ${requestId} - Items after filtering: ${filteredItems.length}`)

    // DEPURAÇÃO CRÍTICA: Aplicar ordenação com logs detalhados  
    const sortedItems = sortResults(filteredItems, sortBy, query, requestId)
    console.log(`📊 ${requestId} - Items after sorting: ${sortedItems.length}`)

    // Calcular paginação
    const totalResults = sortedItems.length
    const totalPages = Math.ceil(totalResults / resultsPerPage)
    const startIndex = (page - 1) * resultsPerPage
    const endIndex = startIndex + resultsPerPage
    const paginatedResults = sortedItems.slice(startIndex, endIndex)

    console.log(`📄 ${requestId} - Pagination:`, {
      totalResults,
      totalPages,
      currentPage: page,
      startIndex,
      endIndex,
      paginatedResults: paginatedResults.length
    })

    // VERIFICAÇÃO FINAL
    if (paginatedResults.length === 0 && totalResults > 0) {
      console.error(`❌ ${requestId} - CRITICAL: Paginated results empty but total > 0`)
      console.log('🔍 Debug info:', {
        totalResults,
        page,
        resultsPerPage,
        startIndex,
        endIndex,
        sortedItemsLength: sortedItems.length
      })
    }

    const response = {
      success: true,
      results: paginatedResults,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      searchInfo: {
        query,
        appliedFilters: filters,
        sortBy
      }
    }

    console.log(`✅ ${requestId} - Search completed successfully`)
    return response

  } catch (error) {
    console.error(`❌ ${requestId} - Search failed:`, error)
    throw error
  }
}

async function fetchFromAPI(tipo: string, requestId: string): Promise<SearchResult[]> {
  const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1'
  console.log(`📡 ${requestId} - Fetching ${tipo} from API...`)
  
  try {
    // Para livros e artigos, buscar com limite alto para pegar todos
    const limit = tipo === 'livro' || tipo === 'artigos' ? 100 : 500
    const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&limit=${limit}`
    
    console.log(`🌐 ${requestId} - API URL: ${url}`)
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LSB-Search/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${tipo}`)
    }

    const data = await response.json()
    const items = data.conteudo || []
    
    console.log(`📊 ${requestId} - ${tipo}: Raw API returned ${items.length} items`)
    
    // Transformar dados para o formato esperado
    const transformedItems = items.map((item: any) => transformToSearchResult(item, tipo))
    
    console.log(`✅ ${requestId} - ${tipo}: Transformed ${transformedItems.length} items`)
    return transformedItems
    
  } catch (error) {
    console.error(`❌ ${requestId} - Failed to fetch ${tipo}:`, error)
    return []
  }
}

function transformToSearchResult(item: any, tipo: string): SearchResult {
  const baseResult = {
    id: item.id || Math.random(),
    originalId: item.id?.toString(),
    title: item.titulo || item.title || 'Título não disponível',
    author: item.autor || item.author || 'Autor desconhecido',
    description: item.descricao || item.description || 'Descrição não disponível',
    year: item.ano || item.year || new Date().getFullYear(),
    subject: item.assunto || item.subject || 'Geral',
    thumbnail: item.thumbnail || item.capa || null
  }

  switch (tipo) {
    case 'livro':
      return {
        ...baseResult,
        type: 'titulo' as const,
        pages: item.paginas || item.pages,
        pdfUrl: item.pdf_url || item.pdfUrl,
        documentType: 'Livro',
        language: item.idioma || 'Português'
      }
    
    case 'artigos':
      return {
        ...baseResult,
        type: 'titulo' as const,
        pages: item.paginas || item.pages,
        pdfUrl: item.pdf_url || item.pdfUrl,
        documentType: 'Artigo',
        language: item.idioma || 'Português'
      }
    
    case 'aula':
      return {
        ...baseResult,
        type: 'video' as const,
        duration: item.duracao || item.duration,
        embedUrl: item.embed_url || item.embedUrl,
        channel: item.canal || item.channel,
        pais: item.pais || 'BR'
      }
    
    case 'podcast':
      return {
        ...baseResult,
        type: 'podcast' as const,
        duration: item.duracao || item.duration,
        embedUrl: item.embed_url || item.embedUrl,
        program: item.podcast_titulo || item.program,
        episodes: item.episodios || item.episodes,
        categories: item.categorias || item.categories || []
      }
    
    default:
      return {
        ...baseResult,
        type: 'titulo' as const
      }
  }
}

function applyFilters(
  items: SearchResult[], 
  query: string, 
  filters: SearchFilters,
  requestId: string
): SearchResult[] {
  console.log(`🔍 ${requestId} - Applying filters to ${items.length} items`)
  console.log(`📋 ${requestId} - Filters:`, filters)
  
  let filteredItems = [...items]
  const originalCount = filteredItems.length

  // Query filter
  if (query?.trim()) {
    const queryLower = query.toLowerCase()
    filteredItems = filteredItems.filter(item => {
      const searchText = `${item.title} ${item.author} ${item.description}`.toLowerCase()
      return searchText.includes(queryLower)
    })
    console.log(`🔤 ${requestId} - After query filter: ${filteredItems.length} items (query: "${query}")`)
  }

  // Resource type filter - CRÍTICO: Corrigir lógica
  if (filters.resourceType?.length > 0) {
    const hasAll = filters.resourceType.includes('all')
    const hasTitulo = filters.resourceType.includes('titulo')
    
    console.log(`🏷️ ${requestId} - Resource type filter:`, {
      filterTypes: filters.resourceType,
      hasAll,
      hasTitulo
    })
    
    if (!hasAll) {
      filteredItems = filteredItems.filter(item => {
        // Se filtro inclui 'titulo', aceitar tanto 'titulo' quanto itens do tipo 'titulo'
        if (hasTitulo && item.type === 'titulo') {
          return true
        }
        // Para outros tipos, verificar correspondência direta
        return filters.resourceType.includes(item.type)
      })
      console.log(`🏷️ ${requestId} - After resource type filter: ${filteredItems.length} items`)
    }
  }

  // Subject filter
  if (filters.subject?.length > 0) {
    filteredItems = filteredItems.filter(item =>
      filters.subject.some(filterSubject =>
        item.subject?.toLowerCase().includes(filterSubject.toLowerCase())
      )
    )
    console.log(`📚 ${requestId} - After subject filter: ${filteredItems.length} items`)
  }

  // Author filter
  if (filters.author?.length > 0) {
    filteredItems = filteredItems.filter(item =>
      filters.author.some(filterAuthor =>
        item.author?.toLowerCase().includes(filterAuthor.toLowerCase())
      )
    )
    console.log(`👤 ${requestId} - After author filter: ${filteredItems.length} items`)
  }

  // Year filter
  if (filters.year?.trim()) {
    const filterYear = parseInt(filters.year)
    if (!isNaN(filterYear)) {
      filteredItems = filteredItems.filter(item => item.year === filterYear)
      console.log(`📅 ${requestId} - After year filter: ${filteredItems.length} items`)
    }
  }

  // Duration filter
  if (filters.duration?.trim()) {
    filteredItems = filteredItems.filter(item => matchesDurationFilter(item.duration, filters.duration))
    console.log(`⏱️ ${requestId} - After duration filter: ${filteredItems.length} items`)
  }

  // Language filter
  if (filters.language?.length > 0) {
    filteredItems = filteredItems.filter(item =>
      filters.language.some(filterLang =>
        item.language?.toLowerCase().includes(filterLang.toLowerCase()) ||
        item.pais?.toLowerCase().includes(filterLang.toLowerCase())
      )
    )
    console.log(`🌐 ${requestId} - After language filter: ${filteredItems.length} items`)
  }

  // Document type filter
  if (filters.documentType?.length > 0) {
    filteredItems = filteredItems.filter(item =>
      filters.documentType.some(filterDocType =>
        item.documentType?.toLowerCase().includes(filterDocType.toLowerCase())
      )
    )
    console.log(`📄 ${requestId} - After document type filter: ${filteredItems.length} items`)
  }

  // Program filter (for podcasts)
  if (filters.program?.length > 0) {
    filteredItems = filteredItems.filter(item => {
      if (item.type !== 'podcast') return false
      return filters.program.some(filterProgram =>
        item.program?.toLowerCase().includes(filterProgram.toLowerCase())
      )
    })
    console.log(`🎧 ${requestId} - After program filter: ${filteredItems.length} items`)
  }

  // Channel filter (for videos)
  if (filters.channel?.length > 0) {
    filteredItems = filteredItems.filter(item => {
      if (item.type !== 'video') return false
      return filters.channel.some(filterChannel =>
        item.channel?.toLowerCase().includes(filterChannel.toLowerCase())
      )
    })
    console.log(`📺 ${requestId} - After channel filter: ${filteredItems.length} items`)
  }

  console.log(`✅ ${requestId} - Filtering complete: ${originalCount} → ${filteredItems.length} items`)
  
  // DEBUG: Se perdemos todos os itens, investigar
  if (originalCount > 0 && filteredItems.length === 0) {
    console.error(`🚨 ${requestId} - ALL ITEMS FILTERED OUT! Original: ${originalCount}`)
    console.log('🔍 Sample original items:')
    items.slice(0, 3).forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.title} (type: ${item.type}, subject: ${item.subject})`)
    })
  }
  
  return filteredItems
}

function sortResults(
  results: SearchResult[], 
  sortBy: string, 
  query?: string,
  requestId?: string
): SearchResult[] {
  if (requestId) {
    console.log(`📊 ${requestId} - Sorting ${results.length} items by: ${sortBy}`)
  }
  
  const sortedResults = [...results]
  
  switch (sortBy) {
    case 'relevance':
      if (query?.trim()) {
        const queryLower = query.toLowerCase()
        sortedResults.sort((a, b) => {
          const aTitle = a.title?.toLowerCase() || ''
          const bTitle = b.title?.toLowerCase() || ''
          const aStartsWithQuery = aTitle.startsWith(queryLower)
          const bStartsWithQuery = bTitle.startsWith(queryLower)
          
          if (aStartsWithQuery && !bStartsWithQuery) return -1
          if (!aStartsWithQuery && bStartsWithQuery) return 1
          
          return aTitle.localeCompare(bTitle)
        })
      } else {
        sortedResults.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
      }
      break
      
    case 'title':
      sortedResults.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
      break
      
    case 'recent':
      sortedResults.sort((a, b) => (b.year || 0) - (a.year || 0))
      break
      
    case 'accessed':
      const typeOrder = { 'podcast': 3, 'video': 2, 'titulo': 1 }
      sortedResults.sort((a, b) => {
        const orderA = typeOrder[a.type] || 0
        const orderB = typeOrder[b.type] || 0
        if (orderA !== orderB) return orderB - orderA
        return (a.title || '').localeCompare(b.title || '')
      })
      break
  }
  
  if (requestId) {
    console.log(`✅ ${requestId} - Sorting complete: ${sortedResults.length} items`)
  }
  
  return sortedResults
}

function matchesDurationFilter(itemDuration: string | undefined, filterDuration: string): boolean {
  if (!itemDuration || !filterDuration) return true
  
  const minutes = parseDurationToMinutes(itemDuration)
  
  switch (filterDuration.toLowerCase()) {
    case 'short':
      return minutes > 0 && minutes <= 10
    case 'medium':
      return minutes > 10 && minutes <= 30
    case 'long':
      return minutes > 30
    default:
      return true
  }
}

function parseDurationToMinutes(duration: string): number {
  if (!duration) return 0
  
  let totalMinutes = 0
  const durationStr = duration.toLowerCase().trim()
  
  // Extrair horas
  const hoursMatch = durationStr.match(/(\d+)h/)
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1]) * 60
  }
  
  // Extrair minutos
  const minutesMatch = durationStr.match(/(\d+)m/)
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1])
  }
  
  // Se só tem número (assumir minutos)
  if (!hoursMatch && !minutesMatch) {
    const numberMatch = durationStr.match(/(\d+)/)
    if (numberMatch) {
      totalMinutes = parseInt(numberMatch[1])
    }
  }
  
  return totalMinutes
}
