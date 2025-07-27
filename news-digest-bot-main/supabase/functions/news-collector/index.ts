import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface RSSItem {
  title: string
  description: string
  link: string
  pubDate: string
}

async function fetchRSSFeed(url: string): Promise<RSSItem[]> {
  try {
    console.log('Fetching RSS feed from:', url)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
      }
    })
    
    if (!response.ok) {
      console.error(`Failed to fetch RSS feed: ${response.status}`)
      return []
    }
    
    const xmlText = await response.text()
    
    // Simple XML parsing for RSS feeds
    const items: RSSItem[] = []
    const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || []
    
    for (const itemXml of itemMatches.slice(0, 15)) { // Increased limit to 15 items per source
      const title = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/, '$1').trim()
      const description = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/, '$1').replace(/<[^>]*>/g, '').trim()
      const link = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim()
      const pubDate = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim()
      
      if (title && link) {
        items.push({
          title: title.substring(0, 200),
          description: (description || '').substring(0, 500),
          link,
          pubDate: pubDate || new Date().toISOString()
        })
      }
    }
    
    console.log(`Parsed ${items.length} items from RSS feed`)
    return items
  } catch (error) {
    console.error('Error fetching RSS feed:', error)
    return []
  }
}

async function processArticle(item: RSSItem, sourceName: string, category: string) {
  try {
    // Check if article already exists
    const { data: existing } = await supabase
      .from('news_articles')
      .select('id')
      .eq('source_url', item.link)
      .maybeSingle()
    
    if (existing) {
      console.log('Article already exists, skipping')
      return
    }
    
    // Parse publication date
    let publishedAt: string
    try {
      publishedAt = new Date(item.pubDate).toISOString()
    } catch {
      publishedAt = new Date().toISOString()
    }
    
    // Check if article is recent (within last 2 hours for real-time posting)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    const articleDate = new Date(publishedAt)
    
    if (articleDate < twoHoursAgo) {
      console.log('Article is too old, skipping for real-time posting')
      return
    }
    
    // Insert new article
    const { data: article, error } = await supabase
      .from('news_articles')
      .insert({
        title: item.title,
        content: item.description,
        source_url: item.link,
        source_name: sourceName,
        published_at: publishedAt,
        category,
        processed: false
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error inserting article:', error)
      return
    }
    
    console.log('Successfully inserted article:', article.title)
    
    // Generate and queue Twitter post immediately
    await generateTwitterPost(article)
    
  } catch (error) {
    console.error('Error processing article:', error)
  }
}

async function generateTwitterPost(article: any) {
  try {
    console.log('Generating Twitter post for article:', article.title)
    
    // Generate tweet content with 280 character limit (Twitter's current limit)
    const maxLength = 280
    let tweetText = article.title
    
    // Ensure we have space for hashtags and source (about 50-60 characters)
    if (tweetText.length > maxLength - 60) {
      tweetText = tweetText.substring(0, maxLength - 63) + '...'
    }
    
    // Generate hashtags based on category and content
    const hashtags = generateHashtags(article.category, article.title)
    const hashtagText = hashtags.map(tag => `#${tag}`).join(' ')
    
    // Add source attribution
    const sourceText = `\n\n📰 ${article.source_name}`
    
    // Final tweet content
    const finalTweet = `${tweetText} ${hashtagText}${sourceText}`
    
    // Ensure it's under 280 characters
    if (finalTweet.length > maxLength) {
      const availableLength = maxLength - hashtagText.length - sourceText.length - 1
      tweetText = article.title.substring(0, availableLength - 3) + '...'
    }
    
    const finalContent = `${tweetText} ${hashtagText}${sourceText}`
    
    console.log('Generated tweet:', finalContent, 'Length:', finalContent.length)
    
    // Insert into news_posts table with high priority
    const { error } = await supabase
      .from('news_posts')
      .insert({
        article_id: article.id,
        tweet_content: finalContent,
        hashtags,
        status: 'pending'
      })
    
    if (error) {
      console.error('Error inserting news post:', error)
    } else {
      console.log('Successfully queued tweet for immediate posting')
    }
    
  } catch (error) {
    console.error('Error generating Twitter post:', error)
  }
}

function generateHashtags(category: string, title: string): string[] {
  const commonHashtags = category === 'japan' 
    ? ['日本', 'ニュース', '速報'] 
    : ['世界', 'ニュース', '海外']
  
  // Add specific hashtags based on content
  const specificHashtags: string[] = []
  const lowerTitle = title.toLowerCase()
  
  if (lowerTitle.includes('政治') || lowerTitle.includes('政府') || lowerTitle.includes('politics')) {
    specificHashtags.push('政治')
  }
  if (lowerTitle.includes('経済') || lowerTitle.includes('economy') || lowerTitle.includes('市場')) {
    specificHashtags.push('経済')
  }
  if (lowerTitle.includes('スポーツ') || lowerTitle.includes('sport')) {
    specificHashtags.push('スポーツ')
  }
  if (lowerTitle.includes('技術') || lowerTitle.includes('tech') || lowerTitle.includes('AI')) {
    specificHashtags.push('技術')
  }
  if (lowerTitle.includes('災害') || lowerTitle.includes('地震') || lowerTitle.includes('台風')) {
    specificHashtags.push('災害')
  }
  if (lowerTitle.includes('コロナ') || lowerTitle.includes('covid')) {
    specificHashtags.push('コロナ')
  }
  
  // Return 3 hashtags
  return [...commonHashtags.slice(0, 3 - specificHashtags.length), ...specificHashtags].slice(0, 3)
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    console.log('Starting news collection process...')
    
    // Get active news sources
    const { data: sources, error: sourcesError } = await supabase
      .from('news_sources')
      .select('*')
      .eq('is_active', true)
    
    if (sourcesError) {
      throw sourcesError
    }
    
    console.log(`Found ${sources.length} active news sources`)
    
    let totalArticlesProcessed = 0
    
    // Process each source
    for (const source of sources) {
      if (source.rss_feed) {
        console.log(`Processing source: ${source.name}`)
        const items = await fetchRSSFeed(source.rss_feed)
        
        for (const item of items) {
          await processArticle(item, source.name, source.category)
          totalArticlesProcessed++
        }
        
        // Update last fetched timestamp
        await supabase
          .from('news_sources')
          .update({ last_fetched_at: new Date().toISOString() })
          .eq('id', source.id)
      }
    }
    
    console.log(`News collection completed successfully. Processed ${totalArticlesProcessed} articles.`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'News collection completed',
        articlesProcessed: totalArticlesProcessed
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
    
  } catch (error) {
    console.error('Error in news collection:', error)
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})