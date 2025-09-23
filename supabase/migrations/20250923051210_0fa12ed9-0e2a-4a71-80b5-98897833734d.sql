-- Add missing RLS policies for audit_logs table
-- Currently only SELECT policy exists, we need INSERT policy for users to log their own events

-- Create INSERT policy for audit_logs
CREATE POLICY "Users can insert their own audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create UPDATE policy for audit_logs (in case needed for status updates)
CREATE POLICY "Users can update their own audit logs" 
ON public.audit_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create DELETE policy for audit_logs (for data cleanup)
CREATE POLICY "Users can delete their own audit logs" 
ON public.audit_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Also check and ensure bank_accounts has proper RLS policies
-- Add any missing policies for bank_accounts table
DO $$
BEGIN
  -- Check if INSERT policy exists for bank_accounts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bank_accounts' 
    AND policyname = 'Users can insert their own bank accounts'
  ) THEN
    CREATE POLICY "Users can insert their own bank accounts" 
    ON public.bank_accounts 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;