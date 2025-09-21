-- Create a security definer function to log login attempts
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  p_email TEXT,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.login_attempts (email, success, error_message, ip_address, user_agent)
  VALUES (p_email, p_success, p_error_message, p_ip_address, p_user_agent);
END;
$$;

-- Add policy to allow system to insert login attempts via function
-- Since the function is SECURITY DEFINER, it bypasses RLS
-- This ensures login_attempts can only be written through our controlled function

-- Create a policy that prevents direct access (no one can directly insert/update/delete)
CREATE POLICY "No direct access to login_attempts" 
ON public.login_attempts 
FOR ALL 
USING (false);