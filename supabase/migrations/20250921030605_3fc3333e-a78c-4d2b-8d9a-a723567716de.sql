-- Fix duplicate policy name
DROP POLICY IF EXISTS "Users can update their own encryption status" ON public.encryption_status;

-- Create policies with unique names
CREATE POLICY "Users can insert their own encryption status" 
ON public.encryption_status 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own encryption status data" 
ON public.encryption_status 
FOR UPDATE 
USING (auth.uid() = user_id);