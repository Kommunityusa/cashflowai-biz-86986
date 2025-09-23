-- Enable required extensions for cron jobs and HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add notes column to bank_accounts table if it doesn't exist
ALTER TABLE public.bank_accounts 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create a cron job to sync Plaid data every 6 hours
-- This ensures data stays fresh even if webhooks fail
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

-- Create an index on plaid_transaction_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_plaid_id 
ON public.transactions(plaid_transaction_id);

-- Create an index on plaid_item_id for faster webhook processing
CREATE INDEX IF NOT EXISTS idx_bank_accounts_plaid_item 
ON public.bank_accounts(plaid_item_id);

-- Add index for efficient sync queries
CREATE INDEX IF NOT EXISTS idx_bank_accounts_sync 
ON public.bank_accounts(is_active, last_synced_at) 
WHERE plaid_access_token IS NOT NULL;