-- Allow newsletter subscribers without user_id to be added to email_sequences
-- Make user_id nullable and add unique constraint on email instead
ALTER TABLE public.email_sequences 
ALTER COLUMN user_id DROP NOT NULL;

-- Add unique constraint on email if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'email_sequences_email_key'
  ) THEN
    ALTER TABLE public.email_sequences 
    ADD CONSTRAINT email_sequences_email_key UNIQUE (email);
  END IF;
END $$;