-- Fix 1: SECURITY DEFINER VIEW issue
-- The transaction_summaries view should not use SECURITY DEFINER if it exists
-- First drop and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS public.transaction_summaries;

CREATE VIEW public.transaction_summaries AS
SELECT t.user_id,
    date_trunc('month'::text, t.transaction_date::timestamp with time zone) AS month,
    t.type,
    c.name AS category_name,
    count(*) AS transaction_count,
    sum(t.amount) AS total_amount,
    avg(t.amount) AS average_amount
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
WHERE t.user_id = auth.uid()
GROUP BY t.user_id, (date_trunc('month'::text, t.transaction_date::timestamp with time zone)), t.type, c.name;

-- Add comment documenting the security model
COMMENT ON VIEW public.transaction_summaries IS 'Secure view that aggregates transaction data. Each user can only see their own data via auth.uid() filter.';

-- Fix 2: Extensions in public schema
-- Move extensions out of public schema to a dedicated extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- List of common extensions that might be in public
DO $$
DECLARE
    ext_name text;
BEGIN
    FOR ext_name IN 
        SELECT extname 
        FROM pg_extension e
        JOIN pg_namespace n ON e.extnamespace = n.oid
        WHERE n.nspname = 'public' 
        AND extname NOT IN ('plpgsql') -- Don't move core extensions
    LOOP
        BEGIN
            EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', ext_name);
            RAISE NOTICE 'Moved extension % to extensions schema', ext_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not move extension %: %', ext_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Fix 3: Enable leaked password protection
-- This needs to be done in the Supabase dashboard under Authentication settings
-- We'll add a platform setting to track this
INSERT INTO public.platform_settings (key, value, updated_by, updated_at)
VALUES (
    'auth_leaked_password_protection',
    '{"enabled": false, "reminder": "Enable leaked password protection in Supabase Auth settings for enhanced security"}'::jsonb,
    auth.uid(),
    NOW()
)
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value,
    updated_by = EXCLUDED.updated_by,
    updated_at = NOW();