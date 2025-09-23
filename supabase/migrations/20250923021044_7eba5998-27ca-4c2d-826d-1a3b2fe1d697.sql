-- Move extensions to extensions schema (more secure than public schema)
DROP EXTENSION IF EXISTS pg_cron CASCADE;
DROP EXTENSION IF EXISTS pg_net CASCADE;

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Recreate the cron job with the correct schema reference
SELECT extensions.cron.schedule(
  'sync-plaid-accounts',
  '0 */6 * * *', -- Every 6 hours
  $$
  SELECT extensions.net.http_post(
    url:='https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/plaid-sync',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5icmNkcGhnYWRhYmpuZHlueXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDMwNjYsImV4cCI6MjA3Mzk3OTA2Nn0.W-7_JNflDJYoAFPy19Hh2XAYBfQN5tzle5jgeB0Zlk8"}'::jsonb,
    body:='{"action": "scheduled_sync"}'::jsonb
  ) as request_id;
  $$
);