-- Add Stripe columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;