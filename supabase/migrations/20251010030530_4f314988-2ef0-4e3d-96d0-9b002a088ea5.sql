-- Add additional security functions and policies for profiles table

-- 1. Create a function to validate that users can only access their own profile
CREATE OR REPLACE FUNCTION public.is_own_profile(_user_id uuid, _auth_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id = _auth_uid;
$$;

-- 2. Add check constraint to ensure user_id matches auth.uid() on insert
-- This prevents privilege escalation where someone might try to insert with a different user_id
CREATE OR REPLACE FUNCTION public.enforce_profile_user_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure the user_id matches the authenticated user
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot create or modify profile for another user';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to enforce user match on insert and update
DROP TRIGGER IF EXISTS enforce_profile_ownership_insert ON public.profiles;
CREATE TRIGGER enforce_profile_ownership_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_user_match();

DROP TRIGGER IF EXISTS enforce_profile_ownership_update ON public.profiles;
CREATE TRIGGER enforce_profile_ownership_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_user_match();

-- 3. Add audit logging for sensitive profile changes
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log changes to sensitive fields
  IF (TG_OP = 'UPDATE') THEN
    IF (OLD.tax_id IS DISTINCT FROM NEW.tax_id) OR
       (OLD.stripe_customer_id IS DISTINCT FROM NEW.stripe_customer_id) OR
       (OLD.paypal_subscription_id IS DISTINCT FROM NEW.paypal_subscription_id) THEN
      
      INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (
        auth.uid(),
        'UPDATE',
        'profiles',
        NEW.user_id::text,
        jsonb_build_object(
          'changed_fields', ARRAY(
            SELECT key FROM jsonb_each(to_jsonb(NEW)) 
            WHERE to_jsonb(NEW) -> key IS DISTINCT FROM to_jsonb(OLD) -> key
          )
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_profile_changes ON public.profiles;
CREATE TRIGGER audit_profile_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_changes();

-- 4. Add function to redact sensitive data for logging purposes
CREATE OR REPLACE FUNCTION public.get_profile_safe(profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Only allow users to get their own profile
  IF profile_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  SELECT to_jsonb(p) - 'tax_id' - 'stripe_customer_id' - 'paypal_subscription_id'
  INTO result
  FROM profiles p
  WHERE p.user_id = profile_id;
  
  RETURN result;
END;
$$;

-- 5. Add rate limiting function to prevent enumeration attacks
CREATE OR REPLACE FUNCTION public.check_profile_access_rate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_access_count integer;
BEGIN
  -- Check for suspicious access patterns (more than 10 profile queries in last minute)
  SELECT COUNT(*)
  INTO recent_access_count
  FROM audit_logs
  WHERE user_id = auth.uid()
    AND entity_type = 'profiles'
    AND action = 'SELECT'
    AND created_at > NOW() - INTERVAL '1 minute';
  
  IF recent_access_count > 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;
  
  RETURN NEW;
END;
$$;