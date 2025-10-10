-- Delete 2024 transactions first
DELETE FROM transactions
WHERE user_id IN (SELECT id FROM auth.users)
  AND EXTRACT(YEAR FROM transaction_date) = 2024;

-- The types in the database are already correct based on the CSV import
-- Just verify we only have 2025 data now