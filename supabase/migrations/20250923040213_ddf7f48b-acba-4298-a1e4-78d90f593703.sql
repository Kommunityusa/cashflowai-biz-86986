-- Add Plaid consent tracking fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plaid_consent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS plaid_consent_version TEXT,
ADD COLUMN IF NOT EXISTS plaid_consent_details JSONB;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.plaid_consent_date IS 'Date when user consented to Plaid data sharing';
COMMENT ON COLUMN public.profiles.plaid_consent_version IS 'Version of consent terms accepted';
COMMENT ON COLUMN public.profiles.plaid_consent_details IS 'Detailed consent information including IP and user agent';