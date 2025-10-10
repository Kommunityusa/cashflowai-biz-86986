-- Create translations cache table
CREATE TABLE IF NOT EXISTS public.ai_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text text NOT NULL,
  source_language text NOT NULL DEFAULT 'en',
  target_language text NOT NULL,
  translated_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(source_text, source_language, target_language)
);

-- Enable RLS
ALTER TABLE public.ai_translations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read translations (they're not user-specific)
CREATE POLICY "Anyone can read translations"
  ON public.ai_translations
  FOR SELECT
  USING (true);

-- Only authenticated users can insert translations
CREATE POLICY "Authenticated users can insert translations"
  ON public.ai_translations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_ai_translations_lookup 
  ON public.ai_translations(source_text, source_language, target_language);

-- Create updated_at trigger
CREATE TRIGGER update_ai_translations_updated_at
  BEFORE UPDATE ON public.ai_translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();