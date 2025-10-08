-- CRITICAL FIX: Payment Processing Fees is incorrectly categorized as INCOME
-- This is a major misclassification causing negative net profit calculations
-- Payment processing fees are money going OUT (an expense), not money coming IN

-- Fix the Payment Processing Fees category to be an expense
UPDATE categories
SET type = 'expense'
WHERE name ILIKE '%payment%processing%fee%'
  OR name = 'Payment Processing Fees';

-- Also fix all transactions currently using this category
-- They should all be classified as expenses
UPDATE transactions
SET type = 'expense'
WHERE category_id IN (
  SELECT id FROM categories 
  WHERE name ILIKE '%payment%processing%fee%'
    OR name = 'Payment Processing Fees'
);