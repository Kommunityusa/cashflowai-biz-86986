-- Add missing columns to audit_logs table
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS entity_type TEXT,
ADD COLUMN IF NOT EXISTS entity_id TEXT;