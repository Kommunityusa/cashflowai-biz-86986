-- First, update the default categories to match proper business expense tracking
-- We'll recreate the create_default_categories function with the correct categories

DROP FUNCTION IF EXISTS public.create_default_categories() CASCADE;

CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Default expense categories based on standard business bookkeeping
  INSERT INTO public.categories (user_id, name, type, is_default, color) VALUES
    (NEW.user_id, 'Rent & Utilities', 'expense', true, '#3B82F6'),
    (NEW.user_id, 'Payroll & Employee Benefits', 'expense', true, '#8B5CF6'),
    (NEW.user_id, 'Office Supplies & Equipment', 'expense', true, '#EC4899'),
    (NEW.user_id, 'Marketing & Advertising', 'expense', true, '#10B981'),
    (NEW.user_id, 'Insurance', 'expense', true, '#F59E0B'),
    (NEW.user_id, 'Taxes', 'expense', true, '#EF4444'),
    (NEW.user_id, 'Professional Services', 'expense', true, '#6366F1'),
    (NEW.user_id, 'Travel & Entertainment', 'expense', true, '#14B8A6'),
    (NEW.user_id, 'Inventory Costs', 'expense', true, '#F97316'),
    (NEW.user_id, 'Loan & Interest Payments', 'expense', true, '#64748B'),
    (NEW.user_id, 'Repairs & Maintenance', 'expense', true, '#06B6D4'),
    (NEW.user_id, 'Licenses & Permits', 'expense', true, '#8B5CF6'),
    (NEW.user_id, 'Training & Education', 'expense', true, '#EC4899'),
    (NEW.user_id, 'Bank & Transaction Fees', 'expense', true, '#10B981'),
    (NEW.user_id, 'Vehicle Expenses', 'expense', true, '#F59E0B'),
    (NEW.user_id, 'Subscriptions & Memberships', 'expense', true, '#3B82F6'),
    (NEW.user_id, 'Shipping & Postage', 'expense', true, '#EF4444'),
    (NEW.user_id, 'Depreciation', 'expense', true, '#6366F1'),
    (NEW.user_id, 'Miscellaneous Expenses', 'expense', true, '#64748B');
  
  -- Default income categories
  INSERT INTO public.categories (user_id, name, type, is_default, color) VALUES
    (NEW.user_id, 'Sales Revenue', 'income', true, '#22C55E'),
    (NEW.user_id, 'Service Revenue', 'income', true, '#3B82F6'),
    (NEW.user_id, 'Interest Income', 'income', true, '#A855F7'),
    (NEW.user_id, 'Other Income', 'income', true, '#64748B');
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_profile_created_create_categories ON public.profiles;

CREATE TRIGGER on_profile_created_create_categories
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_categories();