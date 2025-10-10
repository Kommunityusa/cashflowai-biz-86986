-- Add two-factor authentication fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_phone TEXT;