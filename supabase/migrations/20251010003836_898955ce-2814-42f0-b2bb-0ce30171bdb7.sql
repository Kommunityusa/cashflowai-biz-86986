-- Delete all 2024 transactions, keeping only 2025 data
DELETE FROM transactions
WHERE user_id IN (SELECT id FROM auth.users)
  AND EXTRACT(YEAR FROM transaction_date) = 2024;