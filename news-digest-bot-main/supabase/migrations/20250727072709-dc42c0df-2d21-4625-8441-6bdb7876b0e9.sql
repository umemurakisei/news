-- Enable pg_cron and pg_net extensions for scheduled functions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule news collection every 5 minutes (very frequent for real-time)
SELECT cron.schedule(
  'news-collection-job',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mvtnnetinzdwehgdhytc.supabase.co/functions/v1/news-collector',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dG5uZXRpbnpkd2VoZ2RoeXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNTU3NDYsImV4cCI6MjA2NjgzMTc0Nn0.X83Ir64PS6Me6HeILqSRggiPd2c27OmpITRpJJ5jAxQ"}'::jsonb,
    body := '{"automated": true}'::jsonb
  ) as request_id;
  $$
);

-- Schedule Twitter posting every 2 minutes (very frequent for real-time posting)
SELECT cron.schedule(
  'twitter-posting-job', 
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mvtnnetinzdwehgdhytc.supabase.co/functions/v1/twitter-poster',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dG5uZXRpbnpkd2VoZ2RoeXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNTU3NDYsImV4cCI6MjA2NjgzMTc0Nn0.X83Ir64PS6Me6HeILqSRggiPd2c27OmpITRpJJ5jAxQ"}'::jsonb,
    body := '{"automated": true}'::jsonb
  ) as request_id;
  $$
);

-- Create a function to trigger immediate posting when new articles are added
CREATE OR REPLACE FUNCTION trigger_immediate_posting()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger immediate Twitter posting when a new article is added
  PERFORM net.http_post(
    url := 'https://mvtnnetinzdwehgdhytc.supabase.co/functions/v1/twitter-poster',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dG5uZXRpbnpkd2VoZ2RoeXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNTU3NDYsImV4cCI6MjA2NjgzMTc0Nn0.X83Ir64PS6Me6HeILqSRggiPd2c27OmpITRpJJ5jAxQ"}'::jsonb,
    body := '{"immediate": true}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for immediate posting when new posts are added
CREATE TRIGGER trigger_immediate_twitter_posting
  AFTER INSERT ON public.news_posts
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION trigger_immediate_posting();