-- Add the encrypted token column to bank_accounts
ALTER TABLE public.bank_accounts 
ADD COLUMN IF NOT EXISTS plaid_access_token_encrypted TEXT;

-- Also fix institution_name column - the plaid function uses bank_name but might expect institution_name
ALTER TABLE public.bank_accounts 
ADD COLUMN IF NOT EXISTS institution_name TEXT;