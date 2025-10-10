-- Remove duplicate transactions, keeping the most recent version of each
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, transaction_date, description, amount, type 
      ORDER BY created_at DESC
    ) as row_num
  FROM transactions
)
DELETE FROM transactions
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE row_num > 1
);