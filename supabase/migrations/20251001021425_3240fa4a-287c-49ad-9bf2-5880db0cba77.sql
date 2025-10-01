-- Add subscription_plan column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT NULL;

-- Add check constraint for valid plan values
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_subscription_plan 
CHECK (subscription_plan IN ('free', 'starter', 'professional', 'business') OR subscription_plan IS NULL);