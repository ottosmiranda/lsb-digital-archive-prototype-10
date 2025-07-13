
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContentItem {
  id: string
  title: string
  type: string
  author: string
  description: string
  thumbnail: string
  year: number
}

Deno.serve(async (req) => {
  console.log('🔄 Recent Additions Rotation - Starting execution')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('📡 Fetching content from all sources...')
    
    // Fetch content from all edge functions
    const [videosResult, booksResult, podcastsResult, articlesResult] = await Promise.allSettled([
      supabase.functions.invoke('fetch-videos'),
      supabase.functions.invoke('fetch-books'), 
      supabase.functions.invoke('fetch-podcasts'),
      supabase.functions.invoke('fetch-articles')
    ])

    let allContent: ContentItem[] = []

    // Process videos
    if (videosResult.status === 'fulfilled' && videosResult.value.data?.success) {
      const videos = videosResult.value.data.videos.map((item: any) => ({
        ...item,
        type: 'video'
      }))
      allContent.push(...videos)
      console.log(`✅ Videos: ${videos.length} items`)
    }

    // Process books
    if (booksResult.status === 'fulfilled' && booksResult.value.data?.success) {
      const books = booksResult.value.data.books.map((item: any) => ({
        ...item,
        type: 'titulo'
      }))
      allContent.push(...books)
      console.log(`✅ Books: ${books.length} items`)
    }

    // Process podcasts
    if (podcastsResult.status === 'fulfilled' && podcastsResult.value.data?.success) {
      const podcasts = podcastsResult.value.data.podcasts.map((item: any) => ({
        ...item,
        type: 'podcast'
      }))
      allContent.push(...podcasts)
      console.log(`✅ Podcasts: ${podcasts.length} items`)
    }

    // Process articles
    if (articlesResult.status === 'fulfilled' && articlesResult.value.data?.success) {
      const articles = articlesResult.value.data.articles.map((item: any) => ({
        ...item,
        type: 'artigo'
      }))
      allContent.push(...articles)
      console.log(`✅ Articles: ${articles.length} items`)
    }

    console.log(`📊 Total content available: ${allContent.length} items`)

    if (allContent.length === 0) {
      throw new Error('No content available for rotation')
    }

    // Check for genuinely new content (last 3 days)
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const currentYear = new Date().getFullYear()
    
    const recentContent = allContent.filter(item => {
      // Consider content from current year as potentially new
      return item.year >= currentYear
    })

    let selectedContent: ContentItem[]
    let isRealContent = false

    if (recentContent.length >= 6) {
      // Use recent content if available
      selectedContent = recentContent
        .sort((a, b) => b.year - a.year)
        .slice(0, 6)
      isRealContent = true
      console.log('✨ Using recent/new content')
    } else {
      // Use random diverse content as fallback
      selectedContent = selectDiverseRandomContent(allContent, 6)
      isRealContent = false
      console.log('🎲 Using random rotated content')
    }

    // Deactivate previous recent additions rotation
    await supabase
      .from('featured_content_rotation')
      .update({ is_active: false })
      .eq('content_type', 'recent_additions')

    console.log('🔄 Deactivated previous recent additions rotation')

    // Insert new rotation
    const rotationData = {
      content_type: 'recent_additions',
      content_data: {
        items: selectedContent,
        rotation_date: new Date().toISOString(),
        is_real_content: isRealContent
      },
      rotation_date: new Date().toISOString(),
      is_active: true
    }

    const { error: insertError } = await supabase
      .from('featured_content_rotation')
      .insert(rotationData)

    if (insertError) {
      throw insertError
    }

    console.log('✅ Recent additions rotation completed successfully', {
      itemsCount: selectedContent.length,
      isRealContent,
      types: selectedContent.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    })

    return new Response(JSON.stringify({
      success: true,
      rotated_items: selectedContent.length,
      is_real_content: isRealContent,
      types_distribution: selectedContent.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('❌ Recent additions rotation failed:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to rotate recent additions'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

function selectDiverseRandomContent(allContent: ContentItem[], count: number): ContentItem[] {
  const contentByType = allContent.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = []
    }
    acc[item.type].push(item)
    return acc
  }, {} as Record<string, ContentItem[]>)

  const types = Object.keys(contentByType)
  const selected: ContentItem[] = []
  const itemsPerType = Math.ceil(count / types.length)

  // Select diverse content from each type
  for (const type of types) {
    const typeContent = contentByType[type]
    const shuffled = typeContent.sort(() => Math.random() - 0.5)
    const typeSelection = shuffled.slice(0, Math.min(itemsPerType, typeContent.length))
    selected.push(...typeSelection)
    
    if (selected.length >= count) break
  }

  // If we need more items, randomly select from remaining
  if (selected.length < count) {
    const remaining = allContent.filter(item => !selected.some(s => s.id === item.id))
    const shuffled = remaining.sort(() => Math.random() - 0.5)
    selected.push(...shuffled.slice(0, count - selected.length))
  }

  return selected.slice(0, count).sort(() => Math.random() - 0.5)
}
