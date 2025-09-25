-- Update the trigger for creating default categories to include more comprehensive business bookkeeping categories
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
DROP FUNCTION IF EXISTS public.create_default_categories();

CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Comprehensive income categories for business bookkeeping
  INSERT INTO public.categories (user_id, name, type, color, icon, is_default) VALUES
  (NEW.user_id, 'Sales Revenue', 'income', '#10B981', 'dollar-sign', true),
  (NEW.user_id, 'Service Revenue', 'income', '#10B981', 'briefcase', true),
  (NEW.user_id, 'Interest Income', 'income', '#10B981', 'percent', true),
  (NEW.user_id, 'Dividend Income', 'income', '#10B981', 'trending-up', true),
  (NEW.user_id, 'Rental Income', 'income', '#10B981', 'home', true),
  (NEW.user_id, 'Investment Income', 'income', '#10B981', 'bar-chart', true),
  (NEW.user_id, 'Commission Income', 'income', '#10B981', 'award', true),
  (NEW.user_id, 'Royalty Income', 'income', '#10B981', 'star', true),
  (NEW.user_id, 'Grant Income', 'income', '#10B981', 'gift', true),
  (NEW.user_id, 'Other Income', 'income', '#10B981', 'plus-circle', true);
  
  -- Comprehensive expense categories for business bookkeeping
  INSERT INTO public.categories (user_id, name, type, color, icon, is_default) VALUES
  (NEW.user_id, 'Salaries & Wages', 'expense', '#EF4444', 'users', true),
  (NEW.user_id, 'Employee Benefits', 'expense', '#EF4444', 'heart', true),
  (NEW.user_id, 'Payroll Taxes', 'expense', '#EF4444', 'file-text', true),
  (NEW.user_id, 'Rent & Lease', 'expense', '#EF4444', 'home', true),
  (NEW.user_id, 'Utilities', 'expense', '#EF4444', 'zap', true),
  (NEW.user_id, 'Office Supplies', 'expense', '#EF4444', 'paperclip', true),
  (NEW.user_id, 'Equipment & Tools', 'expense', '#EF4444', 'tool', true),
  (NEW.user_id, 'Software & Subscriptions', 'expense', '#EF4444', 'cpu', true),
  (NEW.user_id, 'Marketing & Advertising', 'expense', '#EF4444', 'megaphone', true),
  (NEW.user_id, 'Travel & Transportation', 'expense', '#EF4444', 'plane', true),
  (NEW.user_id, 'Meals & Entertainment', 'expense', '#EF4444', 'coffee', true),
  (NEW.user_id, 'Professional Services', 'expense', '#EF4444', 'briefcase', true),
  (NEW.user_id, 'Legal Fees', 'expense', '#EF4444', 'scale', true),
  (NEW.user_id, 'Accounting Fees', 'expense', '#EF4444', 'calculator', true),
  (NEW.user_id, 'Insurance', 'expense', '#EF4444', 'shield', true),
  (NEW.user_id, 'Bank Fees', 'expense', '#EF4444', 'credit-card', true),
  (NEW.user_id, 'Interest Expense', 'expense', '#EF4444', 'percent', true),
  (NEW.user_id, 'Depreciation', 'expense', '#EF4444', 'trending-down', true),
  (NEW.user_id, 'Repairs & Maintenance', 'expense', '#EF4444', 'wrench', true),
  (NEW.user_id, 'Telephone & Internet', 'expense', '#EF4444', 'phone', true),
  (NEW.user_id, 'Postage & Shipping', 'expense', '#EF4444', 'package', true),
  (NEW.user_id, 'Training & Education', 'expense', '#EF4444', 'book', true),
  (NEW.user_id, 'Licenses & Permits', 'expense', '#EF4444', 'file-check', true),
  (NEW.user_id, 'Taxes', 'expense', '#EF4444', 'receipt', true),
  (NEW.user_id, 'Inventory', 'expense', '#EF4444', 'box', true),
  (NEW.user_id, 'Cost of Goods Sold', 'expense', '#EF4444', 'shopping-cart', true),
  (NEW.user_id, 'Miscellaneous Expenses', 'expense', '#EF4444', 'minus-circle', true),
  (NEW.user_id, 'Other Expenses', 'expense', '#EF4444', 'more-horizontal', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_categories();

-- For existing users without categories, add the comprehensive categories
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT p.user_id 
    FROM profiles p
    LEFT JOIN categories c ON p.user_id = c.user_id
    WHERE c.id IS NULL
  LOOP
    -- Income categories
    INSERT INTO public.categories (user_id, name, type, color, icon, is_default) VALUES
    (user_record.user_id, 'Sales Revenue', 'income', '#10B981', 'dollar-sign', true),
    (user_record.user_id, 'Service Revenue', 'income', '#10B981', 'briefcase', true),
    (user_record.user_id, 'Interest Income', 'income', '#10B981', 'percent', true),
    (user_record.user_id, 'Dividend Income', 'income', '#10B981', 'trending-up', true),
    (user_record.user_id, 'Rental Income', 'income', '#10B981', 'home', true),
    (user_record.user_id, 'Investment Income', 'income', '#10B981', 'bar-chart', true),
    (user_record.user_id, 'Commission Income', 'income', '#10B981', 'award', true),
    (user_record.user_id, 'Royalty Income', 'income', '#10B981', 'star', true),
    (user_record.user_id, 'Grant Income', 'income', '#10B981', 'gift', true),
    (user_record.user_id, 'Other Income', 'income', '#10B981', 'plus-circle', true);
    
    -- Expense categories
    INSERT INTO public.categories (user_id, name, type, color, icon, is_default) VALUES
    (user_record.user_id, 'Salaries & Wages', 'expense', '#EF4444', 'users', true),
    (user_record.user_id, 'Employee Benefits', 'expense', '#EF4444', 'heart', true),
    (user_record.user_id, 'Payroll Taxes', 'expense', '#EF4444', 'file-text', true),
    (user_record.user_id, 'Rent & Lease', 'expense', '#EF4444', 'home', true),
    (user_record.user_id, 'Utilities', 'expense', '#EF4444', 'zap', true),
    (user_record.user_id, 'Office Supplies', 'expense', '#EF4444', 'paperclip', true),
    (user_record.user_id, 'Equipment & Tools', 'expense', '#EF4444', 'tool', true),
    (user_record.user_id, 'Software & Subscriptions', 'expense', '#EF4444', 'cpu', true),
    (user_record.user_id, 'Marketing & Advertising', 'expense', '#EF4444', 'megaphone', true),
    (user_record.user_id, 'Travel & Transportation', 'expense', '#EF4444', 'plane', true),
    (user_record.user_id, 'Meals & Entertainment', 'expense', '#EF4444', 'coffee', true),
    (user_record.user_id, 'Professional Services', 'expense', '#EF4444', 'briefcase', true),
    (user_record.user_id, 'Legal Fees', 'expense', '#EF4444', 'scale', true),
    (user_record.user_id, 'Accounting Fees', 'expense', '#EF4444', 'calculator', true),
    (user_record.user_id, 'Insurance', 'expense', '#EF4444', 'shield', true),
    (user_record.user_id, 'Bank Fees', 'expense', '#EF4444', 'credit-card', true),
    (user_record.user_id, 'Interest Expense', 'expense', '#EF4444', 'percent', true),
    (user_record.user_id, 'Depreciation', 'expense', '#EF4444', 'trending-down', true),
    (user_record.user_id, 'Repairs & Maintenance', 'expense', '#EF4444', 'wrench', true),
    (user_record.user_id, 'Telephone & Internet', 'expense', '#EF4444', 'phone', true),
    (user_record.user_id, 'Postage & Shipping', 'expense', '#EF4444', 'package', true),
    (user_record.user_id, 'Training & Education', 'expense', '#EF4444', 'book', true),
    (user_record.user_id, 'Licenses & Permits', 'expense', '#EF4444', 'file-check', true),
    (user_record.user_id, 'Taxes', 'expense', '#EF4444', 'receipt', true),
    (user_record.user_id, 'Inventory', 'expense', '#EF4444', 'box', true),
    (user_record.user_id, 'Cost of Goods Sold', 'expense', '#EF4444', 'shopping-cart', true),
    (user_record.user_id, 'Miscellaneous Expenses', 'expense', '#EF4444', 'minus-circle', true),
    (user_record.user_id, 'Other Expenses', 'expense', '#EF4444', 'more-horizontal', true);
  END LOOP;
END $$;