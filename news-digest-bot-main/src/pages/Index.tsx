import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { RefreshCw, Send, Globe, Monitor, AlertCircle, CheckCircle, Clock, ExternalLink } from 'lucide-react'

interface NewsArticle {
  id: string
  title: string
  source_name: string
  category: string
  published_at: string
  processed: boolean
}

interface NewsPost {
  id: string
  tweet_content: string
  hashtags: string[]
  status: string
  posted_at?: string
  tweet_id?: string
  error_message?: string
  article_id: string
  news_articles?: {
    title: string
    source_name: string
    category: string
  }
}

interface NewsSource {
  id: string
  name: string
  category: string
  is_active: boolean
  last_fetched_at?: string
}

const NewsSystemDashboard = () => {
  const { toast } = useToast()
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [posts, setPosts] = useState<NewsPost[]>([])
  const [sources, setSources] = useState<NewsSource[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalPosts: 0,
    pendingPosts: 0,
    postedToday: 0,
    activeSources: 0
  })

  useEffect(() => {
    fetchData()
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      // Fetch articles
      const { data: articlesData } = await supabase
        .from('news_articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      // Fetch posts with article data
      const { data: postsData } = await supabase
        .from('news_posts')
        .select(`
          *,
          news_articles(title, source_name, category)
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      // Fetch sources
      const { data: sourcesData } = await supabase
        .from('news_sources')
        .select('*')
        .order('name')

      if (articlesData) setArticles(articlesData)
      if (postsData) setPosts(postsData)
      if (sourcesData) setSources(sourcesData)

      // Calculate stats
      const today = new Date().toISOString().split('T')[0]
      const stats = {
        totalArticles: articlesData?.length || 0,
        totalPosts: postsData?.length || 0,
        pendingPosts: postsData?.filter(p => p.status === 'pending').length || 0,
        postedToday: postsData?.filter(p => 
          p.posted_at && p.posted_at.startsWith(today)
        ).length || 0,
        activeSources: sourcesData?.filter(s => s.is_active).length || 0
      }
      setStats(stats)

    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "エラー",
        description: "データの取得中にエラーが発生しました",
        variant: "destructive"
      })
    }
  }

  const triggerNewsCollection = async () => {
    setIsLoading(true)
    try {
      const response = await supabase.functions.invoke('news-collector', {
        body: { manual: true }
      })

      if (response.error) {
        throw response.error
      }

      toast({
        title: "成功",
        description: "ニュース収集を開始しました"
      })
      
      // Refresh data after a delay
      setTimeout(fetchData, 3000)
    } catch (error) {
      console.error('Error triggering news collection:', error)
      toast({
        title: "エラー",
        description: "ニュース収集の開始に失敗しました",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const triggerTwitterPosting = async () => {
    setIsLoading(true)
    try {
      const response = await supabase.functions.invoke('twitter-poster', {
        body: { manual: true }
      })

      if (response.error) {
        throw response.error
      }

      toast({
        title: "成功",
        description: "Twitter投稿を開始しました"
      })
      
      // Refresh data after a delay
      setTimeout(fetchData, 3000)
    } catch (error) {
      console.error('Error triggering Twitter posting:', error)
      toast({
        title: "エラー",
        description: "Twitter投稿の開始に失敗しました",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'posted':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ニュース自動投稿システム</h1>
            <p className="text-muted-foreground mt-2">24時間365日ニュース収集・編集・Twitter投稿</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              更新
            </Button>
            <Button 
              onClick={triggerNewsCollection} 
              disabled={isLoading}
              size="sm"
            >
              <Globe className="h-4 w-4 mr-2" />
              ニュース収集
            </Button>
            <Button 
              onClick={triggerTwitterPosting} 
              disabled={isLoading}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              Twitter投稿
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">記事数</p>
                  <p className="text-2xl font-bold">{stats.totalArticles}</p>
                </div>
                <Globe className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">今日の投稿</p>
                  <p className="text-2xl font-bold">{stats.postedToday}</p>
                </div>
                <Send className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">待機中</p>
                  <p className="text-2xl font-bold">{stats.pendingPosts}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">総投稿数</p>
                  <p className="text-2xl font-bold">{stats.totalPosts}</p>
                </div>
                <Monitor className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">有効ソース</p>
                  <p className="text-2xl font-bold">{stats.activeSources}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Articles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                最新記事
              </CardTitle>
              <CardDescription>
                収集された最新のニュース記事
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {articles.map((article) => (
                  <div key={article.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">{article.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {article.source_name}
                          </Badge>
                          <Badge variant={article.category === 'japan' ? 'default' : 'outline'} className="text-xs">
                            {article.category === 'japan' ? '日本' : '世界'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(article.published_at)}
                        </p>
                      </div>
                      {article.processed && (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
                {articles.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    記事がありません
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Twitter投稿
              </CardTitle>
              <CardDescription>
                最新のTwitter投稿状況
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {posts.map((post) => (
                  <div key={post.id} className="border rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      {getStatusIcon(post.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">
                          {post.tweet_content}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {post.hashtags.map((hashtag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              #{hashtag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant={
                            post.status === 'posted' ? 'default' :
                            post.status === 'pending' ? 'secondary' : 'destructive'
                          } className="text-xs">
                            {post.status === 'posted' ? '投稿済み' :
                             post.status === 'pending' ? '待機中' : '失敗'}
                          </Badge>
                          {post.posted_at && (
                            <p className="text-xs text-muted-foreground">
                              {formatDate(post.posted_at)}
                            </p>
                          )}
                        </div>
                        {post.tweet_id && (
                          <a 
                            href={`https://twitter.com/thenewsmedia24/status/${post.tweet_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 mt-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Twitterで見る
                          </a>
                        )}
                        {post.error_message && (
                          <p className="text-xs text-red-500 mt-1">
                            エラー: {post.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {posts.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    投稿がありません
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* News Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              ニュースソース
            </CardTitle>
            <CardDescription>
              設定されたニュースソースの状況
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources.map((source) => (
                <div key={source.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{source.name}</h4>
                    <Badge variant={source.is_active ? 'default' : 'secondary'}>
                      {source.is_active ? '有効' : '無効'}
                    </Badge>
                  </div>
                  <Badge variant={source.category === 'japan' ? 'default' : 'outline'} className="mt-2">
                    {source.category === 'japan' ? '日本ニュース' : '世界ニュース'}
                  </Badge>
                  {source.last_fetched_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      最終取得: {formatDate(source.last_fetched_at)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default NewsSystemDashboard
