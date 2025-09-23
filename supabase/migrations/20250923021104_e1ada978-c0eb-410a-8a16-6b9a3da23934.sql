-- Enable extensions in the extensions schema (Supabase way)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Add extensions schema to search path for this session
SET search_path TO public, extensions;

-- Create the cron job using the proper schema reference
SELECT cron.schedule(
  'sync-plaid-accounts',
  '0 */6 * * *', -- Every 6 hours
  $$
  SELECT net.http_post(
    url:='https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/plaid-sync',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5icmNkcGhnYWRhYmpuZHlueXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDMwNjYsImV4cCI6MjA3Mzk3OTA2Nn0.W-7_JNflDJYoAFPy19Hh2XAYBfQN5tzle5jgeB0Zlk8"}'::jsonb,
    body:='{"action": "scheduled_sync"}'::jsonb
  ) as request_id;
  $$
);