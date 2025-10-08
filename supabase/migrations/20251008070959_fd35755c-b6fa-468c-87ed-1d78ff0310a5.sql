-- Add all missing columns to bank_accounts table
ALTER TABLE public.bank_accounts 
ADD COLUMN IF NOT EXISTS plaid_access_token TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT;

-- Add missing column to plaid_access_tokens table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plaid_access_tokens') THEN
    ALTER TABLE public.plaid_access_tokens 
    ADD COLUMN IF NOT EXISTS access_token TEXT;
  END IF;
END $$;