-- Fix security issues with profiles table
-- 1. Drop any existing overly permissive SELECT policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- 2. Ensure only users can view their own profile
-- (recreate the policy to be certain it's correct)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 3. Add DELETE policy so users can delete their own profiles
CREATE POLICY "Users can delete own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Add comment to document security measures
COMMENT ON TABLE public.profiles IS 'Contains sensitive user PII. RLS policies restrict access to profile owner only.';