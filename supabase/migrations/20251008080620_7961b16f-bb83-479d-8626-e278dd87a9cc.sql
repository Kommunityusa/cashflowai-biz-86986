-- CRITICAL SECURITY FIX: Remove unencrypted Plaid access tokens
-- This migration removes the insecure plaintext storage of Plaid access tokens

-- 1. Drop the unencrypted plaid_access_token column from bank_accounts
-- This forces all code to use the encrypted version only
ALTER TABLE public.bank_accounts 
DROP COLUMN IF EXISTS plaid_access_token CASCADE;

-- 2. Ensure the encrypted column exists and is properly configured
-- (It should already exist, but we verify it here)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bank_accounts' 
    AND column_name = 'plaid_access_token_encrypted'
  ) THEN
    ALTER TABLE public.bank_accounts 
    ADD COLUMN plaid_access_token_encrypted TEXT;
  END IF;
END $$;

-- 3. Add security comment to document this change
COMMENT ON COLUMN public.bank_accounts.plaid_access_token_encrypted IS 
'Encrypted Plaid access token. Must only be decrypted server-side with proper authentication. Never expose plaintext tokens.';

-- 4. Ensure plaid_access_tokens table has proper structure
-- This table should be the primary storage for access tokens
DO $$ 
BEGIN
  -- Ensure access_token column is for unencrypted storage (used temporarily during token exchange)
  -- and access_token_encrypted is the permanent storage
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'plaid_access_tokens' 
    AND column_name = 'access_token_encrypted'
  ) THEN
    ALTER TABLE public.plaid_access_tokens 
    ADD COLUMN access_token_encrypted TEXT;
  END IF;
END $$;

-- 5. Add comment to plaid_access_tokens table
COMMENT ON TABLE public.plaid_access_tokens IS 
'Secure storage for Plaid access tokens. Tokens should be encrypted at rest in access_token_encrypted column.';