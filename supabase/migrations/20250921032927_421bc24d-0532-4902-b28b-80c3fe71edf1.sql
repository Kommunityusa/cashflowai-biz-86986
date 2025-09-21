-- Create encryption keys table
CREATE TABLE IF NOT EXISTS public.encryption_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  key_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  rotated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, is_active)
);

-- Enable RLS
ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;

-- Create policies for encryption keys
CREATE POLICY "Users can view their own encryption keys" 
ON public.encryption_keys 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own encryption keys" 
ON public.encryption_keys 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own encryption keys" 
ON public.encryption_keys 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add encryption columns to bank_accounts
ALTER TABLE public.bank_accounts 
ADD COLUMN IF NOT EXISTS account_number_encrypted TEXT,
ADD COLUMN IF NOT EXISTS routing_number_encrypted TEXT,
ADD COLUMN IF NOT EXISTS plaid_access_token_encrypted TEXT,
ADD COLUMN IF NOT EXISTS encryption_enabled BOOLEAN DEFAULT false;

-- Add encryption columns to transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS description_encrypted TEXT,
ADD COLUMN IF NOT EXISTS vendor_name_encrypted TEXT,
ADD COLUMN IF NOT EXISTS notes_encrypted TEXT,
ADD COLUMN IF NOT EXISTS encryption_enabled BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_encryption_keys_user_active ON public.encryption_keys(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_encryption ON public.bank_accounts(user_id, encryption_enabled);
CREATE INDEX IF NOT EXISTS idx_transactions_encryption ON public.transactions(user_id, encryption_enabled);