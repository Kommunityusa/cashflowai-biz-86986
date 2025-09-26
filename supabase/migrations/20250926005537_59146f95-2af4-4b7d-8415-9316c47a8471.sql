-- Drop the existing view
DROP VIEW IF EXISTS public.transaction_summaries;

-- Recreate the view with SECURITY INVOKER to respect RLS of underlying tables
CREATE VIEW public.transaction_summaries WITH (security_invoker = true) AS
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
GROUP BY t.user_id, (date_trunc('month'::text, (t.transaction_date)::timestamp with time zone)), t.type, c.name;

-- Add missing INSERT policy for ai_insights table
CREATE POLICY "Users can insert their own insights" 
ON public.ai_insights 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);