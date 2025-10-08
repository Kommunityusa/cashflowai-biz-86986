-- FIX CRITICAL MISCLASSIFICATION: Check Deposits and Transfers IN are INCOME, not expenses
-- Check deposits = money coming IN to the account = INCOME
-- Transfers FROM another account = money coming IN = INCOME  
-- IO AUTOPAY (credit payments received) = money coming IN = INCOME

-- Fix all "Check Deposit" transactions - these are deposits INTO the account
UPDATE transactions
SET type = 'income'
WHERE description ILIKE '%check deposit%'
  AND type = 'expense';

-- Fix all "Transfer from" transactions - money coming FROM another account INTO this one
UPDATE transactions  
SET type = 'income'
WHERE description ILIKE '%transfer from%'
  AND type = 'expense';

-- Fix IO AUTOPAY - this is credit being received (money IN)
UPDATE transactions
SET type = 'income'
WHERE description ILIKE '%io autopay%'
  AND type = 'expense';

-- Fix Credit Cashback - this is money being credited to account (money IN)
UPDATE transactions
SET type = 'income'
WHERE description ILIKE '%credit cashback%'
  AND type = 'expense';