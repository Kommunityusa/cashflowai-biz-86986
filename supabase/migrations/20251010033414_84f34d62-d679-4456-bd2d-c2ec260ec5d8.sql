-- Update common business expense categories to be tax-deductible by default
-- Based on IRS Publication 334 for small business tax deductions

UPDATE categories 
SET is_tax_deductible = true
WHERE name IN (
  'Advertising',
  'Car and Truck Expenses',
  'Commissions and Fees',
  'Contract Labor',
  'Depreciation',
  'Employee Benefit Programs',
  'Insurance',
  'Interest',
  'Legal and Professional Services',
  'Office Expense',
  'Pension and Profit-Sharing Plans',
  'Rent - Vehicles/Machinery/Equipment',
  'Rent - Other Business Property',
  'Repairs and Maintenance',
  'Supplies',
  'Taxes and Licenses',
  'Travel',
  'Meals',
  'Utilities',
  'Wages'
)
AND type = 'expense';