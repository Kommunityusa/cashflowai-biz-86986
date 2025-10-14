-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily blog post generation at 8:00 AM UTC
SELECT cron.schedule(
  'auto-publish-daily-blog',
  '0 8 * * *', -- Every day at 8:00 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://awszwetvzugirgacpcem.supabase.co/functions/v1/auto-publish-blog',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3c3p3ZXR2enVnaXJnYWNwY2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDQ1MjQsImV4cCI6MjA3NTQ4MDUyNH0.-0ToTDxMYjEfwAmVzcnCku5KbkjZdsemGbviGzXEdrI"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);