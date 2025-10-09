-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule Plaid sync to run twice daily (at 6 AM and 6 PM UTC)
SELECT cron.schedule(
  'plaid-auto-sync-morning',
  '0 6 * * *', -- 6 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://awszwetvzugirgacpcem.supabase.co/functions/v1/plaid-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3c3p3ZXR2enVnaXJnYWNwY2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDQ1MjQsImV4cCI6MjA3NTQ4MDUyNH0.-0ToTDxMYjEfwAmVzcnCku5KbkjZdsemGbviGzXEdrI"}'::jsonb,
        body:=concat('{"scheduled": true, "time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'plaid-auto-sync-evening',
  '0 18 * * *', -- 6 PM UTC
  $$
  SELECT
    net.http_post(
        url:='https://awszwetvzugirgacpcem.supabase.co/functions/v1/plaid-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3c3p3ZXR2enVnaXJnYWNwY2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDQ1MjQsImV4cCI6MjA3NTQ4MDUyNH0.-0ToTDxMYjEfwAmVzcnCku5KbkjZdsemGbviGzXEdrI"}'::jsonb,
        body:=concat('{"scheduled": true, "time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);