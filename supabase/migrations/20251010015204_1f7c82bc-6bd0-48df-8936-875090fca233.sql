-- Delete all existing categories (both default and custom)
DELETE FROM public.categories;

-- Insert IRS-approved categories for all existing users
INSERT INTO public.categories (user_id, name, type, is_default, color, irs_category_code)
SELECT 
  p.user_id,
  c.name,
  c.type,
  true,
  c.color,
  c.irs_category_code
FROM public.profiles p
CROSS JOIN (
  VALUES
    -- IRS-approved expense categories from Publication 334
    ('Advertising', 'expense', '#3B82F6', 'advertising'),
    ('Car and Truck Expenses', 'expense', '#8B5CF6', 'car_truck'),
    ('Commissions and Fees', 'expense', '#EC4899', 'commissions'),
    ('Contract Labor', 'expense', '#10B981', 'contract_labor'),
    ('Depreciation', 'expense', '#F59E0B', 'depreciation'),
    ('Employee Benefit Programs', 'expense', '#EF4444', 'employee_benefits'),
    ('Insurance', 'expense', '#6366F1', 'insurance'),
    ('Interest', 'expense', '#14B8A6', 'interest'),
    ('Legal and Professional Services', 'expense', '#F97316', 'legal_professional'),
    ('Office Expense', 'expense', '#64748B', 'office_expense'),
    ('Pension and Profit-Sharing Plans', 'expense', '#06B6D4', 'pension'),
    ('Rent - Vehicles/Machinery/Equipment', 'expense', '#8B5CF6', 'rent_equipment'),
    ('Rent - Other Business Property', 'expense', '#EC4899', 'rent_property'),
    ('Repairs and Maintenance', 'expense', '#10B981', 'repairs'),
    ('Supplies', 'expense', '#F59E0B', 'supplies'),
    ('Taxes and Licenses', 'expense', '#3B82F6', 'taxes_licenses'),
    ('Travel', 'expense', '#EF4444', 'travel'),
    ('Meals', 'expense', '#6366F1', 'meals'),
    ('Utilities', 'expense', '#14B8A6', 'utilities'),
    ('Wages', 'expense', '#F97316', 'wages'),
    ('Other Expenses', 'expense', '#64748B', 'other_expenses'),
    -- IRS-approved income categories
    ('Gross Receipts or Sales', 'income', '#22C55E', 'gross_receipts'),
    ('Returns and Allowances', 'income', '#3B82F6', 'returns_allowances'),
    ('Other Income', 'income', '#64748B', 'other_income')
) AS c(name, type, color, irs_category_code);