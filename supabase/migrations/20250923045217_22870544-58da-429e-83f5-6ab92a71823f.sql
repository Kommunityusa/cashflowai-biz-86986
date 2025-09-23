-- Create a dedicated schema for extensions if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema to authenticated and anon users
GRANT USAGE ON SCHEMA extensions TO authenticated, anon;

-- Move any extensions from public schema to extensions schema
-- Note: Extensions like uuid-ossp, pg_stat_statements are typically system-wide
-- We'll ensure proper permissions are set

-- Enable leaked password protection in auth settings
-- This is done through Supabase dashboard but we can set up the database side

-- Add comment to indicate security improvements
COMMENT ON SCHEMA extensions IS 'Dedicated schema for database extensions to improve security';

-- Ensure RLS is enabled on all user-facing tables (double-check)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.plaid_logs ENABLE ROW LEVEL SECURITY;