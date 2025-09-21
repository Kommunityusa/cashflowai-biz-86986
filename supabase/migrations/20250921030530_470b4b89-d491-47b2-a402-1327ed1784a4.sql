-- Create extension for encryption if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted columns for sensitive data in profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tax_id_encrypted TEXT,
ADD COLUMN IF NOT EXISTS phone_encrypted TEXT;

-- Create a function to encrypt sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data TEXT, key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  encrypted_data TEXT;
BEGIN
  -- Use pgcrypto to encrypt the data
  encrypted_data := encode(pgp_sym_encrypt(data, key), 'base64');
  RETURN encrypted_data;
END;
$$;

-- Create a function to decrypt sensitive data
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data TEXT, key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  decrypted_data TEXT;
BEGIN
  -- Handle null values
  IF encrypted_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Use pgcrypto to decrypt the data
  decrypted_data := pgp_sym_decrypt(decode(encrypted_data, 'base64'), key);
  RETURN decrypted_data;
EXCEPTION
  WHEN OTHERS THEN
    -- Return null if decryption fails
    RETURN NULL;
END;
$$;

-- Create table for encrypted documents/files metadata
CREATE TABLE IF NOT EXISTS public.encrypted_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  encrypted_url TEXT,
  encryption_key_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on encrypted_documents
ALTER TABLE public.encrypted_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for encrypted_documents
CREATE POLICY "Users can view their own encrypted documents" 
ON public.encrypted_documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own encrypted documents" 
ON public.encrypted_documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own encrypted documents" 
ON public.encrypted_documents 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own encrypted documents" 
ON public.encrypted_documents 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updating timestamps
CREATE TRIGGER update_encrypted_documents_updated_at
BEFORE UPDATE ON public.encrypted_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_encrypted_documents_user_id ON public.encrypted_documents(user_id);

-- Add column to transactions for encrypted notes
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS notes_encrypted TEXT;

-- Add encryption status tracking
CREATE TABLE IF NOT EXISTS public.encryption_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  sensitive_data_encrypted BOOLEAN DEFAULT false,
  encryption_version INTEGER DEFAULT 1,
  last_encrypted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.encryption_status ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own encryption status" 
ON public.encryption_status 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own encryption status" 
ON public.encryption_status 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own encryption status" 
ON public.encryption_status 
FOR UPDATE 
USING (auth.uid() = user_id);