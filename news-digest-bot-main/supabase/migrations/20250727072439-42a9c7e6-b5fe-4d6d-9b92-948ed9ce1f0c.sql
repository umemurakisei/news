-- Create news articles table
CREATE TABLE public.news_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  category TEXT NOT NULL, -- 'japan' or 'world'
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create news posts table (for Twitter posts)
CREATE TABLE public.news_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.news_articles(id),
  tweet_content TEXT NOT NULL,
  hashtags TEXT[] NOT NULL,
  posted_at TIMESTAMP WITH TIME ZONE,
  tweet_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'posted', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create news sources configuration table
CREATE TABLE public.news_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  rss_feed TEXT,
  category TEXT NOT NULL, -- 'japan' or 'world'
  is_active BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is an automated system)
CREATE POLICY "Allow public read access to news articles" 
ON public.news_articles FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to news articles" 
ON public.news_articles FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to news articles" 
ON public.news_articles FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to news posts" 
ON public.news_posts FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to news posts" 
ON public.news_posts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to news posts" 
ON public.news_posts FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to news sources" 
ON public.news_sources FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to news sources" 
ON public.news_sources FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to news sources" 
ON public.news_sources FOR UPDATE USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_news_articles_updated_at
  BEFORE UPDATE ON public.news_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_news_posts_updated_at
  BEFORE UPDATE ON public.news_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default news sources
INSERT INTO public.news_sources (name, url, rss_feed, category) VALUES
  ('NHK News', 'https://www3.nhk.or.jp', 'https://www3.nhk.or.jp/rss/news/cat0.xml', 'japan'),
  ('朝日新聞', 'https://www.asahi.com', 'https://www.asahi.com/rss/asahi/newsheadlines.rdf', 'japan'),
  ('Reuters Japan', 'https://jp.reuters.com', 'https://feeds.reuters.com/reuters/JPdomesticNews', 'japan'),
  ('BBC News', 'https://www.bbc.com/news', 'http://feeds.bbci.co.uk/news/rss.xml', 'world'),
  ('Reuters World', 'https://www.reuters.com', 'https://feeds.reuters.com/reuters/worldNews', 'world'),
  ('AP News', 'https://apnews.com', 'https://feeds.apnews.com/rss/apf-topnews', 'world');