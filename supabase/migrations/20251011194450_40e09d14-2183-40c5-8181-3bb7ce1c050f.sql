-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule drip campaign to run daily at 9 AM UTC
SELECT cron.schedule(
  'daily-drip-campaign',
  '0 9 * * *', -- Every day at 9 AM UTC
  $$
  SELECT
    net.http_post(
      url:='https://awszwetvzugirgacpcem.supabase.co/functions/v1/send-drip-campaign',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3c3p3ZXR2enVnaXJnYWNwY2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDQ1MjQsImV4cCI6MjA3NTQ4MDUyNH0.-0ToTDxMYjEfwAmVzcnCku5KbkjZdsemGbviGzXEdrI"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);