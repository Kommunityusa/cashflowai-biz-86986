-- Create table for storing Plaid access tokens
CREATE TABLE IF NOT EXISTS public.plaid_access_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  cursor TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plaid_access_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tokens" 
ON public.plaid_access_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tokens" 
ON public.plaid_access_tokens 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens" 
ON public.plaid_access_tokens 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens" 
ON public.plaid_access_tokens 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_plaid_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_plaid_tokens_updated_at
BEFORE UPDATE ON public.plaid_access_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_plaid_tokens_updated_at();

-- If there are existing bank accounts with item_ids but no tokens, we'll need to reconnect them
-- For now, let's check what data exists
SELECT COUNT(*) as accounts_without_tokens 
FROM bank_accounts 
WHERE plaid_item_id IS NOT NULL 
AND plaid_access_token IS NULL 
AND plaid_access_token_encrypted IS NULL;