-- Fix email_subscribers security vulnerability
-- Remove the public SELECT policy that exposes all email addresses
DROP POLICY IF EXISTS "Subscribers can view own subscription" ON public.email_subscribers;

-- Create admin-only SELECT policy
CREATE POLICY "Admins can view all subscribers"
ON public.email_subscribers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Keep the public INSERT policy for newsletter signups (this is safe and needed)
-- Policy "Anyone can subscribe" remains unchanged