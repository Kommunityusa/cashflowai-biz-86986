-- First, check if user exists and their current role
DO $$
DECLARE
    user_id_var UUID;
BEGIN
    -- Get the user ID for the email
    SELECT id INTO user_id_var 
    FROM auth.users 
    WHERE email = 'amaabreul@gmail.com';
    
    -- Check if user exists
    IF user_id_var IS NULL THEN
        RAISE NOTICE 'User with email amaabreul@gmail.com not found. Please sign up first.';
    ELSE
        -- Check if user already has admin role
        IF EXISTS (
            SELECT 1 
            FROM public.user_roles 
            WHERE user_id = user_id_var 
            AND role = 'admin'
        ) THEN
            RAISE NOTICE 'User amaabreul@gmail.com is already an admin.';
        ELSE
            -- Add admin role
            INSERT INTO public.user_roles (user_id, role)
            VALUES (user_id_var, 'admin');
            
            RAISE NOTICE 'Successfully granted admin role to amaabreul@gmail.com';
        END IF;
    END IF;
END $$;