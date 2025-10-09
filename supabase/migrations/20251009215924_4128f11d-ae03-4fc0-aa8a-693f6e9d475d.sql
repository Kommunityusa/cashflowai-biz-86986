-- Add tax deductibility fields to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS is_tax_deductible boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS irs_category_code text,
ADD COLUMN IF NOT EXISTS tax_notes text;

-- Add tax-related fields to transactions table  
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS is_tax_deductible boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tax_year integer,
ADD COLUMN IF NOT EXISTS irs_form_reference text;