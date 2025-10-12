-- Schedule blog generation to run weekly on Mondays at 10 AM UTC
SELECT cron.schedule(
  'weekly-blog-generation',
  '0 10 * * 1', -- Every Monday at 10 AM UTC
  $$
  SELECT
    net.http_post(
      url:='https://awszwetvzugirgacpcem.supabase.co/functions/v1/auto-generate-blog',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3c3p3ZXR2enVnaXJnYWNwY2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDQ1MjQsImV4cCI6MjA3NTQ4MDUyNH0.-0ToTDxMYjEfwAmVzcnCku5KbkjZdsemGbviGzXEdrI"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);