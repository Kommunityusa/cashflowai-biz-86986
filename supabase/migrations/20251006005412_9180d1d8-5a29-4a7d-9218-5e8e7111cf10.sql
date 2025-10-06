-- Insert admin role for specified user
-- First, get the user_id from auth.users based on email
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the user ID for the admin email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'amaabreul@gmail.com';
  
  -- Only insert if user exists and role doesn't exist yet
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role granted to user: %', admin_user_id;
  ELSE
    RAISE NOTICE 'User with email amaabreul@gmail.com not found';
  END IF;
END $$;