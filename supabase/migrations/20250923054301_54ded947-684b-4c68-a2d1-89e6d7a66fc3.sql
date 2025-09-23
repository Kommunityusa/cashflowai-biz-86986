-- Fix critical security issue: Remove DELETE and UPDATE policies from audit_logs
-- Audit logs must be append-only for security integrity

-- Drop the dangerous policies that allow users to modify audit logs
DROP POLICY IF EXISTS "Users can delete their own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can update their own audit logs" ON public.audit_logs;

-- Add a comment to the table documenting this security requirement
COMMENT ON TABLE public.audit_logs IS 'Immutable audit log table. Records can only be inserted and viewed, never updated or deleted to maintain security integrity. Only administrators can delete records for compliance purposes.';