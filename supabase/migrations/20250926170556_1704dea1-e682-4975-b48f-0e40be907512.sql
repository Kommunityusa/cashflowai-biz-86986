-- Drop the existing view
DROP VIEW IF EXISTS public.transaction_summaries;

-- Recreate the view with security_barrier option for enhanced security
-- This ensures that the view's WHERE conditions are applied before any user-supplied conditions
CREATE OR REPLACE VIEW public.transaction_summaries 
WITH (security_barrier = true) AS
SELECT 
    t.user_id,
    date_trunc('month'::text, (t.transaction_date)::timestamp with time zone) AS month,
    t.type,
    c.name AS category_name,
    count(*) AS transaction_count,
    sum(t.amount) AS total_amount,
    avg(t.amount) AS average_amount
FROM transactions t
LEFT JOIN categories c ON (t.category_id = c.id)
-- Only include transactions where the user can see them (enforced by RLS on transactions table)
WHERE t.user_id = auth.uid()
GROUP BY t.user_id, 
         date_trunc('month'::text, (t.transaction_date)::timestamp with time zone), 
         t.type, 
         c.name;

-- Grant appropriate permissions
GRANT SELECT ON public.transaction_summaries TO authenticated;

-- Add documentation
COMMENT ON VIEW public.transaction_summaries IS 
'Aggregated transaction summary view. Security is enforced through:
1. RLS policies on underlying transactions and categories tables
2. Security barrier view with explicit user_id filtering
3. View only shows data where user_id = auth.uid()
This ensures users can only see their own financial summaries.';

-- Create an index on the transactions table to optimize the view performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
ON public.transactions(user_id, transaction_date) 
WHERE user_id IS NOT NULL;