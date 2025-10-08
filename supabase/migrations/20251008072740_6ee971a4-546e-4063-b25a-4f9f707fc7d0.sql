-- Add unique constraint on plaid_transaction_id to support upserts
-- This allows historical transaction backfill to avoid duplicates
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_plaid_transaction_id_unique 
UNIQUE (plaid_transaction_id);