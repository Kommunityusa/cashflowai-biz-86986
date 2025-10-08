-- Create table to track email sequence status
CREATE TABLE public.email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_name TEXT,
  welcome_sent_at TIMESTAMP WITH TIME ZONE,
  followup_sent_at TIMESTAMP WITH TIME ZONE,
  monthly_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;

-- Users can view their own email sequence status
CREATE POLICY "Users can view own email sequence"
ON public.email_sequences
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only system can insert/update email sequences
CREATE POLICY "System can manage email sequences"
ON public.email_sequences
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add index for faster lookups
CREATE INDEX idx_email_sequences_user_id ON public.email_sequences(user_id);
CREATE INDEX idx_email_sequences_dates ON public.email_sequences(welcome_sent_at, followup_sent_at, monthly_sent_at);

-- Add updated_at trigger
CREATE TRIGGER update_email_sequences_updated_at
BEFORE UPDATE ON public.email_sequences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to initialize email sequence on user signup
CREATE OR REPLACE FUNCTION public.initialize_email_sequence()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Get user's email and name from auth.users
  INSERT INTO public.email_sequences (user_id, email, user_name)
  SELECT 
    NEW.user_id,
    au.email,
    COALESCE(p.full_name, SPLIT_PART(au.email, '@', 1))
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.user_id = au.id
  WHERE au.id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to initialize email sequence when profile is created
CREATE TRIGGER on_profile_created_init_email_sequence
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.initialize_email_sequence();