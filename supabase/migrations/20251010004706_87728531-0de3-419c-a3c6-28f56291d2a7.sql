-- Flip all transaction types to correct the Mercury import
-- Income should become Expense and vice versa
UPDATE transactions
SET type = CASE 
  WHEN type = 'income' THEN 'expense'
  WHEN type = 'expense' THEN 'income'
  ELSE type
END
WHERE user_id IN (SELECT id FROM auth.users)
  AND EXTRACT(YEAR FROM transaction_date) = 2025;