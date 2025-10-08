-- FIX: Stripe payments and San Francisco Learning Center transactions are INCOME
-- These represent money coming IN from customers/clients

-- Fix all Stripe transactions - payments received from customers
UPDATE transactions
SET type = 'income'
WHERE (description ILIKE '%stripe%' OR vendor_name ILIKE '%stripe%')
  AND type = 'expense';

-- Fix all San Francisco Learning Center transactions - customer payments
UPDATE transactions
SET type = 'income'
WHERE (
  description ILIKE '%south san francisco community learning center%' 
  OR description ILIKE '%san francisco learning center%'
  OR vendor_name ILIKE '%south san francisco community learning center%'
  OR vendor_name ILIKE '%san francisco learning center%'
)
AND type = 'expense';