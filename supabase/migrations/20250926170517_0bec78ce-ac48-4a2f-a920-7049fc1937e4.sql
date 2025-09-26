-- Document the security model for transaction_summaries view
COMMENT ON VIEW public.transaction_summaries IS 'Secure view that aggregates transaction data. Security is enforced at the view level using auth.uid() - each user can only see their own transaction summaries. This view depends on RLS policies of the underlying transactions and categories tables.';

-- Verify and ensure the underlying tables have RLS enabled (they should already have it based on the context)
-- Just adding a verification comment
DO $$
BEGIN
    -- Check if RLS is enabled on transactions table
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'transactions' 
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS is not enabled on transactions table - this is a security risk!';
    END IF;
    
    -- Check if RLS is enabled on categories table  
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'categories' 
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS is not enabled on categories table - this is a security risk!';
    END IF;
END $$;