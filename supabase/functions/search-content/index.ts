
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Cache global para diferentes tipos de busca
const searchCache = new Map()

function generateCacheKey(type: string, query: string, filters: any, page: number, sortBy: string): string {
  const filtersStr = JSON.stringify(filters)
  return `${type}_${query}_${filtersStr}_${page}_${sortBy}`
}

function isValidCache(cacheKey: string): boolean {
  const cached = searchCache.get(cacheKey)
  if (!cached) return false
  
  const age = Date.now() - cached.timestamp
  const maxAge = 10 * 60 * 1000 // 10 minutos
  
  if (age > maxAge) {
    searchCache.delete(cacheKey)
    return false
  }
  
  return true
}

function getCachedResult(cacheKey: string) {
  return searchCache.get(cacheKey)?.data || null
}

function setCachedResult(cacheKey: string, data: any) {
  searchCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  })
  
  // Limitar tamanho do cache
  if (searchCache.size > 100) {
    const firstKey = searchCache.keys().next().value
    searchCache.delete(firstKey)
  }
}

async function performSpecificSearch(
  contentType: string,
  query: string,
  filters: any,
  page: number,
  limit: number,
  sortBy: string
) {
  const requestId = `specific_${contentType}_${Date.now()}`
  console.group(`🎯 ${requestId} - Busca Específica`)
  console.log('📋 Parâmetros:', { contentType, query, page, limit, sortBy })
  
  try {
    // Mapear tipos de conteúdo para edge functions
    const functionMap: { [key: string]: string } = {
      'titulo': 'fetch-books',
      'video': 'fetch-videos', 
      'podcast': 'fetch-podcasts',
      'artigos': 'fetch-articles'
    }
    
    const functionName = functionMap[contentType]
    if (!functionName) {
      throw new Error(`Tipo de conteúdo não suportado: ${contentType}`)
    }
    
    console.log(`📡 Chamando edge function: ${functionName}`)
    
    const { data: content, error } = await supabase.functions.invoke(functionName, {
      body: { 
        limit: Math.max(limit * 2, 50), // Buscar mais itens para garantir dados suficientes
        page: 1 // Edge functions retornam dados completos
      }
    })
    
    if (error) {
      console.error(`❌ Erro na edge function ${functionName}:`, error)
      throw error
    }
    
    if (!content || !Array.isArray(content)) {
      console.warn(`⚠️ Dados inválidos de ${functionName}:`, content)
      return {
        results: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalResults: 0,
          hasNextPage: false,
          hasPreviousPage: false
        }
      }
    }
    
    console.log(`✅ ${functionName} retornou ${content.length} itens`)
    
    // Filtrar por query se fornecida
    let filteredContent = content
    if (query && query.trim()) {
      const queryLower = query.toLowerCase().trim()
      filteredContent = content.filter(item => {
        const titleMatch = item.titulo?.toLowerCase().includes(queryLower)
        const authorMatch = item.autor?.toLowerCase().includes(queryLower)
        const descriptionMatch = item.descricao?.toLowerCase().includes(queryLower)
        return titleMatch || authorMatch || descriptionMatch
      })
      console.log(`🔍 Filtro por query "${query}": ${filteredContent.length} itens`)
    }
    
    // Aplicar filtros adicionais
    if (filters) {
      if (filters.author && filters.author.length > 0) {
        filteredContent = filteredContent.filter(item => 
          filters.author.some((author: string) => 
            item.autor?.toLowerCase().includes(author.toLowerCase())
          )
        )
      }
      
      if (filters.year && filters.year.trim()) {
        filteredContent = filteredContent.filter(item => 
          item.ano?.toString().includes(filters.year) ||
          item.data_publicacao?.includes(filters.year)
        )
      }
      
      if (filters.language && filters.language.length > 0) {
        filteredContent = filteredContent.filter(item => 
          filters.language.some((lang: string) => 
            item.idioma?.toLowerCase().includes(lang.toLowerCase())
          )
        )
      }
      
      if (filters.program && filters.program.length > 0) {
        filteredContent = filteredContent.filter(item => 
          filters.program.some((prog: string) => 
            item.programa?.toLowerCase().includes(prog.toLowerCase())
          )
        )
      }
      
      if (filters.channel && filters.channel.length > 0) {
        filteredContent = filteredContent.filter(item => 
          filters.channel.some((chan: string) => 
            item.canal?.toLowerCase().includes(chan.toLowerCase())
          )
        )
      }
      
      console.log(`🎛️ Após filtros: ${filteredContent.length} itens`)
    }
    
    // Aplicar ordenação
    if (sortBy === 'title') {
      filteredContent.sort((a, b) => (a.titulo || '').localeCompare(b.titulo || ''))
    } else if (sortBy === 'recent') {
      filteredContent.sort((a, b) => {
        const dateA = new Date(a.data_publicacao || a.ano || '1900').getTime()
        const dateB = new Date(b.data_publicacao || b.ano || '1900').getTime()
        return dateB - dateA
      })
    } else if (sortBy === 'accessed') {
      filteredContent.sort((a, b) => (b.acessos || 0) - (a.acessos || 0))
    }
    
    // Calcular paginação
    const totalResults = filteredContent.length
    const totalPages = Math.ceil(totalResults / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    
    const paginatedResults = filteredContent.slice(startIndex, endIndex)
    
    const result = {
      results: paginatedResults,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    }
    
    console.log(`📊 Resultado final:`, {
      totalResults,
      totalPages,
      currentPage: page,
      resultsInPage: paginatedResults.length
    })
    
    console.groupEnd()
    return result
    
  } catch (error) {
    console.error(`❌ ${requestId} falhou:`, error)
    console.groupEnd()
    throw error
  }
}

async function performFilteredSearch(
  query: string,
  filters: any,
  page: number,
  limit: number,
  sortBy: string
) {
  const requestId = `filtered_${Date.now()}`
  console.group(`🔍 ${requestId} - Busca Filtrada`)
  console.log('📋 Parâmetros:', { query, filters, page, limit, sortBy })
  
  try {
    // Determinar tipos de conteúdo baseado nos filtros
    const resourceTypes = filters.resourceType || []
    const searchTypes = resourceTypes.length > 0 ? resourceTypes : ['titulo', 'video', 'podcast', 'artigos']
    
    console.log(`🎯 Tipos de busca: ${searchTypes.join(', ')}`)
    
    // Buscar em paralelo nos tipos selecionados
    const searchPromises = searchTypes.map(async (type: string) => {
      try {
        const result = await performSpecificSearch(type, query, filters, 1, limit * 2, sortBy)
        return { type, results: result.results, totalResults: result.pagination.totalResults }
      } catch (error) {
        console.warn(`⚠️ Falha na busca ${type}:`, error)
        return { type, results: [], totalResults: 0 }
      }
    })
    
    const searchResults = await Promise.all(searchPromises)
    
    // Agregar resultados
    let allResults: any[] = []
    let totalResults = 0
    
    searchResults.forEach(({ type, results, totalResults: typeTotal }) => {
      console.log(`📊 ${type}: ${results.length} resultados (total: ${typeTotal})`)
      allResults = allResults.concat(results)
      totalResults += typeTotal
    })
    
    // Aplicar ordenação final
    if (sortBy === 'title') {
      allResults.sort((a, b) => (a.titulo || '').localeCompare(b.titulo || ''))
    } else if (sortBy === 'recent') {
      allResults.sort((a, b) => {
        const dateA = new Date(a.data_publicacao || a.ano || '1900').getTime()
        const dateB = new Date(b.data_publicacao || b.ano || '1900').getTime()
        return dateB - dateA
      })
    } else if (sortBy === 'accessed') {
      allResults.sort((a, b) => (b.acessos || 0) - (a.acessos || 0))
    } else if (sortBy === 'type') {
      allResults.sort((a, b) => (a.tipo || '').localeCompare(b.tipo || ''))
    }
    
    // Aplicar paginação aos resultados agregados
    const totalPages = Math.ceil(totalResults / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    
    const paginatedResults = allResults.slice(startIndex, endIndex)
    
    const result = {
      results: paginatedResults,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    }
    
    console.log(`📊 Resultado filtrado final:`, {
      totalResults,
      totalPages,
      currentPage: page,
      resultsInPage: paginatedResults.length
    })
    
    console.groupEnd()
    return result
    
  } catch (error) {
    console.error(`❌ ${requestId} falhou:`, error)
    console.groupEnd()
    throw error
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query = '', filters = {}, page = 1, limit = 9, sortBy = 'relevance' } = await req.json()
    
    console.log('🔍 Nova requisição de busca:', { 
      query, 
      filters, 
      page, 
      limit, 
      sortBy,
      timestamp: new Date().toISOString()
    })
    
    // Verificar cache
    const cacheKey = generateCacheKey('search', query, filters, page, sortBy)
    if (isValidCache(cacheKey)) {
      const cached = getCachedResult(cacheKey)
      console.log('📦 Cache HIT - retornando resultado cached')
      return new Response(JSON.stringify({
        success: true,
        cached: true,
        ...cached
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    let result
    
    // Determinar tipo de busca baseado nos filtros
    const resourceTypes = filters.resourceType || []
    
    if (resourceTypes.length === 1) {
      // Busca específica em um tipo de conteúdo
      console.log(`🎯 Busca específica: ${resourceTypes[0]}`)
      result = await performSpecificSearch(resourceTypes[0], query, filters, page, limit, sortBy)
    } else {
      // Busca filtrada (múltiplos tipos ou com query)
      console.log('🔍 Busca filtrada (múltiplos tipos ou com query)')
      result = await performFilteredSearch(query, filters, page, limit, sortBy)
    }
    
    // Adicionar informações de contexto
    const response = {
      success: true,
      results: result.results,
      pagination: result.pagination,
      searchInfo: {
        query,
        appliedFilters: filters,
        sortBy
      }
    }
    
    // Cachear resultado
    setCachedResult(cacheKey, response)
    
    console.log('✅ Busca concluída com sucesso')
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('❌ Erro na busca:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      results: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalResults: 0,
        hasNextPage: false,
        hasPreviousPage: false
      },
      searchInfo: {
        query: '',
        appliedFilters: {},
        sortBy: 'relevance'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
