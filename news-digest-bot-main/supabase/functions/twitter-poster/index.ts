import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from "node:crypto"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const API_KEY = Deno.env.get("TWITTER_CONSUMER_KEY")?.trim()
const API_SECRET = Deno.env.get("TWITTER_CONSUMER_SECRET")?.trim()
const ACCESS_TOKEN = Deno.env.get("TWITTER_ACCESS_TOKEN")?.trim()
const ACCESS_TOKEN_SECRET = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")?.trim()

function validateEnvironmentVariables() {
  if (!API_KEY) {
    throw new Error("Missing TWITTER_CONSUMER_KEY environment variable")
  }
  if (!API_SECRET) {
    throw new Error("Missing TWITTER_CONSUMER_SECRET environment variable")
  }
  if (!ACCESS_TOKEN) {
    throw new Error("Missing TWITTER_ACCESS_TOKEN environment variable")
  }
  if (!ACCESS_TOKEN_SECRET) {
    throw new Error("Missing TWITTER_ACCESS_TOKEN_SECRET environment variable")
  }
}

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(
    url
  )}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
  )}`
  const signingKey = `${encodeURIComponent(
    consumerSecret
  )}&${encodeURIComponent(tokenSecret)}`
  const hmacSha1 = createHmac("sha1", signingKey)
  const signature = hmacSha1.update(signatureBaseString).digest("base64")

  return signature
}

function generateOAuthHeader(method: string, url: string): string {
  const oauthParams = {
    oauth_consumer_key: API_KEY!,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: ACCESS_TOKEN!,
    oauth_version: "1.0",
  }

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    API_SECRET!,
    ACCESS_TOKEN_SECRET!
  )

  const signedOAuthParams = {
    ...oauthParams,
    oauth_signature: signature,
  }

  const entries = Object.entries(signedOAuthParams).sort((a, b) =>
    a[0].localeCompare(b[0])
  )

  return (
    "OAuth " +
    entries
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ")
  )
}

async function sendTweet(tweetText: string): Promise<any> {
  const url = "https://api.x.com/2/tweets"
  const method = "POST"
  const params = { text: tweetText }

  const oauthHeader = generateOAuthHeader(method, url)

  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  })

  const responseText = await response.text()

  if (!response.ok) {
    console.error(`Twitter API Error: ${response.status} - ${responseText}`)
    throw new Error(
      `HTTP error! status: ${response.status}, body: ${responseText}`
    )
  }

  return JSON.parse(responseText)
}

async function processPendingPosts() {
  try {
    console.log('Fetching pending posts...')
    
    // Get pending posts with priority (newer first)
    const { data: posts, error } = await supabase
      .from('news_posts')
      .select(`
        id,
        tweet_content,
        article_id,
        created_at,
        news_articles (
          title,
          source_name,
          published_at
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }) // Newer posts first
      .limit(3) // Process fewer posts at a time to avoid rate limits
    
    if (error) {
      throw error
    }
    
    console.log(`Found ${posts.length} pending posts`)
    
    if (posts.length === 0) {
      return { message: 'No pending posts to process' }
    }
    
    const results = []
    
    for (const post of posts) {
      try {
        console.log(`Posting tweet for article: ${post.news_articles?.title}`)
        
        // Send tweet
        const tweetResponse = await sendTweet(post.tweet_content)
        
        // Update post status
        await supabase
          .from('news_posts')
          .update({
            status: 'posted',
            posted_at: new Date().toISOString(),
            tweet_id: tweetResponse.data?.id
          })
          .eq('id', post.id)
        
        console.log(`Successfully posted tweet: ${tweetResponse.data?.id}`)
        
        results.push({
          success: true,
          post_id: post.id,
          tweet_id: tweetResponse.data?.id,
          content: post.tweet_content
        })
        
        // Wait 10 seconds between posts to avoid rate limits (reduced from 30)
        if (posts.indexOf(post) < posts.length - 1) {
          console.log('Waiting 10 seconds before next post...')
          await new Promise(resolve => setTimeout(resolve, 10000))
        }
        
      } catch (error) {
        console.error(`Error posting tweet for post ${post.id}:`, error)
        
        // Check if it's a rate limit error
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          console.log('Rate limit hit, will retry later')
          // Don't mark as failed, keep as pending for retry
          results.push({
            success: false,
            post_id: post.id,
            error: 'Rate limit - will retry',
            retry: true
          })
        } else {
          // Update post status to failed for other errors
          await supabase
            .from('news_posts')
            .update({
              status: 'failed',
              error_message: error.message
            })
            .eq('id', post.id)
          
          results.push({
            success: false,
            post_id: post.id,
            error: error.message
          })
        }
      }
    }
    
    return {
      message: `Processed ${results.length} posts`,
      results
    }
    
  } catch (error) {
    console.error('Error processing pending posts:', error)
    throw error
  }
}

// Add function to retry failed posts
async function retryFailedPosts() {
  try {
    console.log('Checking for failed posts to retry...')
    
    // Get failed posts that are not too old (within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data: failedPosts, error } = await supabase
      .from('news_posts')
      .select('id, tweet_content, error_message')
      .eq('status', 'failed')
      .gte('updated_at', oneHourAgo)
      .limit(2)
    
    if (error) {
      throw error
    }
    
    if (failedPosts.length === 0) {
      return { message: 'No failed posts to retry' }
    }
    
    console.log(`Found ${failedPosts.length} failed posts to retry`)
    
    const results = []
    
    for (const post of failedPosts) {
      try {
        // Reset status to pending
        await supabase
          .from('news_posts')
          .update({
            status: 'pending',
            error_message: null
          })
          .eq('id', post.id)
        
        console.log(`Reset post ${post.id} to pending for retry`)
        results.push({
          success: true,
          post_id: post.id,
          action: 'reset_to_pending'
        })
        
      } catch (error) {
        console.error(`Error resetting post ${post.id}:`, error)
        results.push({
          success: false,
          post_id: post.id,
          error: error.message
        })
      }
    }
    
    return {
      message: `Retry process completed for ${results.length} posts`,
      results
    }
    
  } catch (error) {
    console.error('Error in retry process:', error)
    throw error
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    validateEnvironmentVariables()
    
    // Parse request body to check if it's an immediate request
    let requestBody = {}
    try {
      requestBody = await req.json()
    } catch {
      // If no body, continue with normal processing
    }
    
    const isImmediate = requestBody.immediate === true
    
    if (isImmediate) {
      console.log('Processing immediate Twitter posting request...')
      
      // For immediate requests, process only the newest pending post
      const { data: newestPost, error } = await supabase
        .from('news_posts')
        .select(`
          id,
          tweet_content,
          article_id,
          created_at,
          news_articles (
            title,
            source_name,
            published_at
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (error || !newestPost) {
        console.log('No pending posts found for immediate posting')
        return new Response(
          JSON.stringify({ success: true, message: 'No pending posts for immediate posting' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      try {
        console.log(`Immediate posting tweet: ${newestPost.news_articles?.title}`)
        
        const tweetResponse = await sendTweet(newestPost.tweet_content)
        
        await supabase
          .from('news_posts')
          .update({
            status: 'posted',
            posted_at: new Date().toISOString(),
            tweet_id: tweetResponse.data?.id
          })
          .eq('id', newestPost.id)
        
        console.log(`Immediate tweet posted successfully: ${tweetResponse.data?.id}`)
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Immediate tweet posted successfully',
            tweet_id: tweetResponse.data?.id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
        
      } catch (error) {
        console.error('Error in immediate posting:', error)
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    } else {
      console.log('Starting regular Twitter posting process...')
      
      // First, try to retry failed posts
      const retryResult = await retryFailedPosts()
      console.log('Retry result:', retryResult)
      
      // Then process pending posts
      const result = await processPendingPosts()
      
      console.log('Twitter posting completed:', result)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            retry: retryResult,
            posting: result
          }
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }
    
  } catch (error) {
    console.error('Error in Twitter posting:', error)
    
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