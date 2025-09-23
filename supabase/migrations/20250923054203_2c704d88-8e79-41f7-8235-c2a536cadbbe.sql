-- Fix critical security issue: Remove DELETE and UPDATE policies from audit_logs
-- Audit logs must be append-only for security integrity

-- Drop the dangerous policies that allow users to modify audit logs
DROP POLICY IF EXISTS "Users can delete their own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can update their own audit logs" ON public.audit_logs;

-- Verify that INSERT and SELECT policies remain (these are appropriate)
-- Users should be able to:
-- 1. INSERT: Create new audit log entries
-- 2. SELECT: View their own audit history
-- But never UPDATE or DELETE existing records

-- Add a comment to the table documenting this security requirement
COMMENT ON TABLE public.audit_logs IS 'Immutable audit log table. Records can only be inserted and viewed, never updated or deleted to maintain security integrity.';

-- Create an admin-only policy for exceptional cases (e.g., data retention compliance)
-- Only system administrators should be able to delete old audit logs if needed
CREATE POLICY "Only admins can delete audit logs for compliance" 
  ON public.audit_logs 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );