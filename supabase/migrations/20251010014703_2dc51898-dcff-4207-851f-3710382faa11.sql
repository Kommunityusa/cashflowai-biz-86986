-- Drop the existing function with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS public.create_default_categories() CASCADE;

-- Create new function with IRS-approved categories only
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- IRS-approved expense categories from Publication 334
  INSERT INTO public.categories (user_id, name, type, is_default, color, irs_category_code) VALUES
    (NEW.user_id, 'Advertising', 'expense', true, '#3B82F6', 'advertising'),
    (NEW.user_id, 'Car and Truck Expenses', 'expense', true, '#8B5CF6', 'car_truck'),
    (NEW.user_id, 'Commissions and Fees', 'expense', true, '#EC4899', 'commissions'),
    (NEW.user_id, 'Contract Labor', 'expense', true, '#10B981', 'contract_labor'),
    (NEW.user_id, 'Depreciation', 'expense', true, '#F59E0B', 'depreciation'),
    (NEW.user_id, 'Employee Benefit Programs', 'expense', true, '#EF4444', 'employee_benefits'),
    (NEW.user_id, 'Insurance', 'expense', true, '#6366F1', 'insurance'),
    (NEW.user_id, 'Interest', 'expense', true, '#14B8A6', 'interest'),
    (NEW.user_id, 'Legal and Professional Services', 'expense', true, '#F97316', 'legal_professional'),
    (NEW.user_id, 'Office Expense', 'expense', true, '#64748B', 'office_expense'),
    (NEW.user_id, 'Pension and Profit-Sharing Plans', 'expense', true, '#06B6D4', 'pension'),
    (NEW.user_id, 'Rent - Vehicles/Machinery/Equipment', 'expense', true, '#8B5CF6', 'rent_equipment'),
    (NEW.user_id, 'Rent - Other Business Property', 'expense', true, '#EC4899', 'rent_property'),
    (NEW.user_id, 'Repairs and Maintenance', 'expense', true, '#10B981', 'repairs'),
    (NEW.user_id, 'Supplies', 'expense', true, '#F59E0B', 'supplies'),
    (NEW.user_id, 'Taxes and Licenses', 'expense', true, '#3B82F6', 'taxes_licenses'),
    (NEW.user_id, 'Travel', 'expense', true, '#EF4444', 'travel'),
    (NEW.user_id, 'Meals', 'expense', true, '#6366F1', 'meals'),
    (NEW.user_id, 'Utilities', 'expense', true, '#14B8A6', 'utilities'),
    (NEW.user_id, 'Wages', 'expense', true, '#F97316', 'wages'),
    (NEW.user_id, 'Other Expenses', 'expense', true, '#64748B', 'other_expenses');
  
  -- IRS-approved income categories
  INSERT INTO public.categories (user_id, name, type, is_default, color, irs_category_code) VALUES
    (NEW.user_id, 'Gross Receipts or Sales', 'income', true, '#22C55E', 'gross_receipts'),
    (NEW.user_id, 'Returns and Allowances', 'income', true, '#3B82F6', 'returns_allowances'),
    (NEW.user_id, 'Other Income', 'income', true, '#64748B', 'other_income');
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger that was dropped
CREATE TRIGGER on_profile_created_create_categories
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_categories();