-- Remove duplicate transactions, keeping only the first occurrence of each plaid_transaction_id
-- This will delete duplicates based on plaid_transaction_id, keeping the oldest transaction

WITH duplicates AS (
  SELECT 
    id,
    plaid_transaction_id,
    ROW_NUMBER() OVER (
      PARTITION BY plaid_transaction_id 
      ORDER BY created_at ASC
    ) as row_num
  FROM transactions
  WHERE plaid_transaction_id IS NOT NULL
)
DELETE FROM transactions
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE row_num > 1
);