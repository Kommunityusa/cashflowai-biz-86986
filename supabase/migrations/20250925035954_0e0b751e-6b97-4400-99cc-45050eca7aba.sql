-- Create categorization_rules table
CREATE TABLE public.categorization_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  condition_field TEXT NOT NULL CHECK (condition_field IN ('description', 'vendor_name', 'amount')),
  condition_operator TEXT NOT NULL CHECK (condition_operator IN ('contains', 'equals', 'greater_than', 'less_than')),
  condition_value TEXT NOT NULL,
  action_category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('income', 'expense')),
  priority INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categorization_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own rules" 
ON public.categorization_rules 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own rules" 
ON public.categorization_rules 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rules" 
ON public.categorization_rules 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rules" 
ON public.categorization_rules 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_categorization_rules_updated_at
BEFORE UPDATE ON public.categorization_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add sample rules for existing users
INSERT INTO public.categorization_rules (user_id, rule_name, condition_field, condition_operator, condition_value, action_category_id, action_type, priority, is_active)
SELECT DISTINCT 
  u.user_id,
  'Spotify Subscription',
  'description',
  'contains',
  'spotify',
  c.id,
  'expense',
  100,
  true
FROM public.profiles u
CROSS JOIN public.categories c
WHERE c.user_id = u.user_id 
  AND c.name = 'Software & Subscriptions' 
  AND c.type = 'expense'
ON CONFLICT DO NOTHING;