-- Add new columns to track tips and success emails in the drip campaign
ALTER TABLE public.email_sequences 
ADD COLUMN IF NOT EXISTS tips_sent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS success_sent_at timestamp with time zone;