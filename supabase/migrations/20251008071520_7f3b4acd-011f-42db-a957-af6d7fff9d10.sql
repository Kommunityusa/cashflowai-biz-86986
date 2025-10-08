-- Make access_token_encrypted nullable to allow initial storage before encryption
ALTER TABLE public.plaid_access_tokens 
ALTER COLUMN access_token_encrypted DROP NOT NULL;

-- Also make institution_name nullable in bank_accounts
ALTER TABLE public.bank_accounts 
ALTER COLUMN institution_name DROP NOT NULL;