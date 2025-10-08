-- Add missing columns to vendors table
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS is_1099_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS total_paid_ytd DECIMAL(15,2) DEFAULT 0;

-- Add missing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS last_report_sync TIMESTAMP WITH TIME ZONE;

-- Add missing column to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS plaid_category TEXT;