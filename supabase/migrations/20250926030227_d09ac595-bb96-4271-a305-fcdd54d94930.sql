-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to run the auto-sync function every hour
-- This will automatically fetch and sync Plaid data for all users
SELECT cron.schedule(
  'plaid-auto-sync-hourly',  -- Job name
  '0 * * * *',  -- Run at the start of every hour
  $$
  SELECT net.http_post(
    url := 'https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/plaid-auto-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5icmNkcGhnYWRhYmpuZHlueXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDMwNjYsImV4cCI6MjA3Mzk3OTA2Nn0.W-7_JNflDJYoAFPy19Hh2XAYBfQN5tzle5jgeB0Zlk8'
    ),
    body := jsonb_build_object('timestamp', now()::text)
  ) AS request_id;
  $$
);

-- Also create a daily sync job that runs at 2 AM for comprehensive syncing
SELECT cron.schedule(
  'plaid-auto-sync-daily',  -- Job name
  '0 2 * * *',  -- Run at 2 AM every day
  $$
  SELECT net.http_post(
    url := 'https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/plaid-auto-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json', 
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5icmNkcGhnYWRhYmpuZHlueXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDMwNjYsImV4cCI6MjA3Mzk3OTA2Nn0.W-7_JNflDJYoAFPy19Hh2XAYBfQN5tzle5jgeB0Zlk8'
    ),
    body := jsonb_build_object(
      'timestamp', now()::text,
      'syncType', 'daily_comprehensive'
    )
  ) AS request_id;
  $$
);

-- View existing cron jobs (for verification)
-- SELECT * FROM cron.job;