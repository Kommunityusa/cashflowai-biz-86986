-- Add missing columns to bank_accounts table
ALTER TABLE public.bank_accounts 
ADD COLUMN IF NOT EXISTS encryption_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS account_number_last4 TEXT;