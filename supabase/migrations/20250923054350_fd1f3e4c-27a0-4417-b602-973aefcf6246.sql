-- Fix critical security issue: Ensure audit_logs are properly secured
-- First, check and drop all existing policies to start fresh

DROP POLICY IF EXISTS "Users can delete their own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can update their own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Only admins can delete audit logs for compliance" ON public.audit_logs;

-- Re-create only the appropriate policies for audit logs

-- 1. Users can INSERT their own audit logs (needed for logging)
-- This policy should already exist, but let's ensure it's correct
DROP POLICY IF EXISTS "Users can insert their own audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert their own audit logs" 
  ON public.audit_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 2. Users can SELECT their own audit logs (needed for viewing history)
-- This policy should already exist, but let's ensure it's correct
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view their own audit logs" 
  ON public.audit_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 3. Admin-only DELETE for compliance (e.g., GDPR data retention)
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

-- NO UPDATE POLICY - audit logs should never be modified once created

-- Document the security requirements
COMMENT ON TABLE public.audit_logs IS 'Immutable audit log table. Records can only be inserted and viewed by users, never updated. Only admins can delete for compliance purposes.';